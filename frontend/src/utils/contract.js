import { ethers } from 'ethers';
import contractDeployment from '../contracts/EVoting.json';
import { HARDHAT_CHAIN_HEX, HARDHAT_CHAIN_ID, LOCAL_NETWORK_CONFIG } from './constants.js';

/**
 * Check if MetaMask or compatible web3 provider is installed
 */
export function hasEthereum() {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Get an ethers v6 BrowserProvider or fallback to direct JsonRpcProvider
 */
export function getProvider() {
  if (!hasEthereum()) {
    return new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Get direct JSON-RPC provider connected straight to Hardhat node
 */
export function getDirectNodeProvider() {
  return new ethers.JsonRpcProvider('http://127.0.0.1:8545');
}

/**
 * Request account connection and return signer and address
 */
export async function connectWallet() {
  if (!hasEthereum()) {
    throw new Error('MetaMask is not detected. Please install MetaMask to interact with this dApp.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts selected in wallet.');
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address,
    chainId: network.chainId,
  };
}

/**
 * Switch or add local Hardhat network in MetaMask
 */
export async function switchNetwork() {
  if (!hasEthereum()) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HARDHAT_CHAIN_HEX }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [LOCAL_NETWORK_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Hardhat local network to MetaMask: ' + addError.message);
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Get the EVoting smart contract instance
 * @param {ethers.Signer | ethers.Provider} signerOrProvider 
 * @param {string} customAddress Optional override for contract address
 */
export function getEVotingContract(signerOrProvider, customAddress) {
  const address = customAddress || contractDeployment.address;
  if (!address || !ethers.isAddress(address)) {
    throw new Error(`Invalid contract address: ${address}. Ensure the contract has been deployed.`);
  }

  return new ethers.Contract(address, contractDeployment.abi, signerOrProvider);
}

/**
 * Authoritatively query the on-chain pending transaction count for an account.
 * Checks both the direct Hardhat node and provider to prevent MetaMask nonce desync.
 * @param {ethers.Signer} signer
 */
export async function getOnChainNonce(signer) {
  const address = await signer.getAddress();
  try {
    const directProvider = getDirectNodeProvider();
    const count = await directProvider.getTransactionCount(address, 'pending');
    return Number(count);
  } catch (rpcErr) {
    if (signer.provider) {
      const count = await signer.provider.getTransactionCount(address, 'pending');
      return Number(count);
    }
    return Number(await signer.getNonce('pending'));
  }
}

/**
 * Comprehensive Transaction Lifecycle Execution & Verification Manager
 * 
 * Enforces the complete 6-stage lifecycle for all contract write operations:
 * 1. Validate connection, signer, and network chainId.
 * 2. Stage 'submitting': user prompt in MetaMask.
 * 3. Authoritative on-chain nonce assignment.
 * 4. Stage 'waiting': transaction broadcast with txHash.
 * 5. Block confirmation with tx.wait(1) and receipt.status === 1 validation.
 * 6. Direct on-chain state verification (verifyOnChain callback).
 * 7. Stage 'confirmed' ONLY after receipt and on-chain verification pass.
 * 
 * If ANY step fails or reverts, stage becomes 'failed' with detailed error and state is preserved.
 * 
 * @param {ethers.Contract} contract Contract instance attached to Signer
 * @param {string} methodName Method name on contract
 * @param {any[]} args Array of method arguments
 * @param {object} options Configuration callbacks and overrides
 * @param {function} [options.onStageChange] Callback: ({ stage, message, txHash, receipt, error }) => void
 * @param {function} [options.verifyOnChain] Async function verifying on-chain mutation directly from contract
 * @param {object} [options.overrides] Transaction overrides (gasLimit, etc.)
 */
export async function executeContractTransaction(contract, methodName, args = [], options = {}) {
  const { onStageChange, verifyOnChain, overrides = {} } = options;

  if (!contract || !contract.runner) {
    const errMsg = 'Contract instance has no active signer. Connect your wallet first.';
    onStageChange?.({ stage: 'failed', error: errMsg, message: errMsg });
    throw new Error(errMsg);
  }

  const signer = contract.runner;
  if (typeof signer.getAddress !== 'function') {
    const errMsg = 'Contract is in read-only mode. Connect a wallet signer to execute transactions.';
    onStageChange?.({ stage: 'failed', error: errMsg, message: errMsg });
    throw new Error(errMsg);
  }

  // 1. Verify network connection
  if (signer.provider) {
    const network = await signer.provider.getNetwork();
    if (network.chainId !== HARDHAT_CHAIN_ID) {
      const errMsg = `Connected to Chain ID ${network.chainId}. Please switch to Hardhat Localhost (31337).`;
      onStageChange?.({ stage: 'failed', error: errMsg, message: errMsg });
      throw new Error(errMsg);
    }
  }

  let tx = null;
  let txHash = null;

  try {
    // 2. Stage: SUBMITTING (Awaiting user authorization in wallet)
    onStageChange?.({
      stage: 'submitting',
      message: 'Submitting transaction… Please confirm in MetaMask.',
    });

    // 3. Resolve authoritative on-chain nonce
    let nonce = overrides.nonce;
    if (nonce == null) {
      nonce = await getOnChainNonce(signer);
    }

    const txOverrides = {
      ...overrides,
      nonce,
    };

    // 4. Send transaction to network
    tx = await contract[methodName](...args, txOverrides);
    txHash = tx.hash;

    // 5. Stage: WAITING (Transaction broadcast, awaiting block inclusion)
    onStageChange?.({
      stage: 'waiting',
      txHash,
      message: 'Transaction broadcast. Waiting for confirmation on Ethereum…',
    });

    // 6. Await receipt (1 confirmation)
    const receipt = await tx.wait(1);

    if (!receipt) {
      throw new Error('Transaction receipt was null or dropped from mempool.');
    }

    if (receipt.status !== 1) {
      throw new Error(`Transaction reverted on-chain (status: ${receipt.status}).`);
    }

    // 7. Verify the actual on-chain state directly from contract
    if (typeof verifyOnChain === 'function') {
      await verifyOnChain(receipt);
    }

    // 8. Stage: CONFIRMED (Only reached when receipt confirms status 1 and state is verified)
    onStageChange?.({
      stage: 'confirmed',
      txHash,
      receipt,
      message: 'Transaction confirmed on Ethereum blockchain.',
    });

    return { tx, receipt, txHash };
  } catch (err) {
    const formattedError = formatContractError(err);
    console.error(`Transaction [${methodName}] failed:`, err);

    onStageChange?.({
      stage: 'failed',
      txHash,
      error: formattedError,
      message: `Transaction failed: ${formattedError}`,
    });

    throw new Error(formattedError);
  }
}

/**
 * Format contract & Web3 errors into clear, actionable messages
 */
export function formatContractError(err) {
  if (!err) return 'Unknown transaction error occurred.';

  // User rejection in MetaMask
  if (
    err.code === 4001 ||
    err.code === 'ACTION_REJECTED' ||
    (err.message && (err.message.includes('user rejected') || err.message.includes('User denied')))
  ) {
    return 'Transaction rejected by user in MetaMask.';
  }

  // Nonce errors
  if (err.message && (err.message.includes('Nonce too high') || err.message.includes('nonce too low') || err.code === 'NONCE_EXPIRED')) {
    return 'Transaction nonce desync. The on-chain nonce has been refreshed; please retry.';
  }

  // Insufficient funds
  if (err.code === 'INSUFFICIENT_FUNDS' || (err.message && err.message.includes('insufficient funds'))) {
    return 'Insufficient ETH balance for transaction gas fee.';
  }

  // Transaction replacement / cancellation
  if (err.code === 'TRANSACTION_REPLACED') {
    if (err.cancelled) return 'Transaction was cancelled in wallet.';
    return 'Transaction was replaced in mempool.';
  }

  // EVM revert reasons
  if (err.reason) return err.reason;
  if (err.shortMessage) return err.shortMessage;
  if (err.message) {
    const match = err.message.match(/reverted with reason string '([^']+)'/);
    if (match) return match[1];

    const customMatch = err.message.match(/reverted with custom error '([^']+)'/);
    if (customMatch) return customMatch[1];

    if (err.message.includes('CALL_EXCEPTION')) {
      return 'Execution reverted by smart contract constraints.';
    }

    return err.message.split('(')[0].trim();
  }

  return String(err);
}

/**
 * Format address for clean UI display (0x1234...5678)
 */
export function truncateAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Truncate long ciphertext for clean UI display
 */
export function truncateCiphertext(text, length = 18) {
  if (!text) return '';
  if (text.length <= length * 2) return text;
  return `${text.substring(0, length)}...${text.substring(text.length - length)}`;
}

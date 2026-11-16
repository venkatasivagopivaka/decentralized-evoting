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
 * Checks both the active provider and direct Hardhat node to prevent MetaMask nonce desync.
 * @param {ethers.Signer} signer
 */
export async function getOnChainNonce(signer) {
  const address = await signer.getAddress();
  try {
    // 1. Direct query to local node gives ground-truth on-chain pending transaction count
    const directProvider = getDirectNodeProvider();
    const count = await directProvider.getTransactionCount(address, 'pending');
    return Number(count);
  } catch (rpcErr) {
    // 2. Fallback to signer's provider
    if (signer.provider) {
      const count = await signer.provider.getTransactionCount(address, 'pending');
      return Number(count);
    }
    return Number(await signer.getNonce('pending'));
  }
}

/**
 * Safely send a contract transaction with verified on-chain nonce and network protection.
 * Resolves the "Nonce too high. Expected nonce to be X but got Y" error caused by MetaMask caching.
 * @param {ethers.Contract} contract Contract instance attached to a Signer
 * @param {string} methodName Method name to invoke
 * @param {any[]} args Method arguments
 * @param {object} overrides Additional transaction overrides
 */
export async function sendContractTransaction(contract, methodName, args = [], overrides = {}) {
  if (!contract || !contract.runner) {
    throw new Error('Contract instance has no active signer. Connect your wallet first.');
  }

  const signer = contract.runner;
  if (typeof signer.getAddress !== 'function') {
    throw new Error('Contract is in read-only mode. Connect a signer to execute transactions.');
  }

  // 1. Verify network connection
  if (signer.provider) {
    const network = await signer.provider.getNetwork();
    if (network.chainId !== HARDHAT_CHAIN_ID) {
      throw new Error(`Connected to Chain ID ${network.chainId}. Please switch to Hardhat Localhost (31337).`);
    }
  }

  // 2. Authoritatively fetch next on-chain nonce unless explicitly supplied
  let nonce = overrides.nonce;
  if (nonce == null) {
    nonce = await getOnChainNonce(signer);
  }

  const txOverrides = {
    ...overrides,
    nonce,
  };

  // 3. Execute method on contract with explicit nonce override
  const tx = await contract[methodName](...args, txOverrides);
  return tx;
}

/**
 * Format contract & Web3 errors into clear, actionable messages
 */
export function formatContractError(err) {
  if (!err) return 'Unknown transaction error occurred.';

  // User rejection in MetaMask
  if (err.code === 4001 || err.code === 'ACTION_REJECTED' || (err.message && err.message.includes('user rejected'))) {
    return 'Transaction rejected by user in MetaMask.';
  }

  // Nonce issues
  if (err.message && err.message.includes('Nonce too high')) {
    return 'Nonce mismatch detected. A fresh on-chain nonce was obtained; please retry the transaction.';
  }

  // EVM revert reasons
  if (err.reason) return err.reason;
  if (err.shortMessage) return err.shortMessage;
  if (err.message) {
    // Strip verbose JSON RPC wrapper text
    const match = err.message.match(/reverted with reason string '([^']+)'/);
    if (match) return match[1];
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

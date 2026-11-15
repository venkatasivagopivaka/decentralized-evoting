import { ethers } from 'ethers';
import contractDeployment from '../contracts/EVoting.json';
import { HARDHAT_CHAIN_HEX, LOCAL_NETWORK_CONFIG } from './constants';

/**
 * Check if MetaMask or compatible web3 provider is installed
 */
export function hasEthereum() {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Get an ethers v6 BrowserProvider
 */
export function getProvider() {
  if (!hasEthereum()) {
    // Fallback to JSON-RPC provider on localhost
    return new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  }
  return new ethers.BrowserProvider(window.ethereum);
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
    // 4902 error code indicates that the chain has not been added to MetaMask
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

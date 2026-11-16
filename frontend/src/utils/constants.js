export const CANDIDATES = [
  {
    id: 0,
    number: "01",
    name: "Satoshi Nakamoto",
    role: "Candidate 01",
    platform: "Decentralized Infrastructure & Protocol Sovereignty",
    avatar: "⚡",
  },
  {
    id: 1,
    number: "02",
    name: "Vitalik Buterin",
    role: "Candidate 02",
    platform: "Programmable Smart Contracts & Quadratic Funding",
    avatar: "🔷",
  },
  {
    id: 2,
    number: "03",
    name: "Ada Lovelace",
    role: "Candidate 03",
    platform: "Mathematical Verifiability & Cryptographic Rigor",
    avatar: "✦",
  },
];

export const RADIX_BASE = 10000n; // Base for multi-candidate encoding (allows up to 9,999 votes per candidate)

export const HARDHAT_CHAIN_ID = 31337n;
export const HARDHAT_CHAIN_HEX = "0x7a69";

export const LOCAL_NETWORK_CONFIG = {
  chainId: HARDHAT_CHAIN_HEX,
  chainName: "Hardhat Localhost",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://127.0.0.1:8545"],
};

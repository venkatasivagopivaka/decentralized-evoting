export const CANDIDATES = [
  {
    id: 0,
    name: "Satoshi Nakamoto",
    role: "Candidate A",
    platform: "Decentralized Infrastructure & Protocol Sovereignty",
    avatar: "⚡",
    tagColor: "bg-saffron-light text-saffron-dark border-saffron-border",
    accentColor: "border-saffron",
  },
  {
    id: 1,
    name: "Vitalik Buterin",
    role: "Candidate B",
    platform: "Programmable Smart Contracts & Quadratic Funding",
    avatar: "🔷",
    tagColor: "bg-indigo-light text-indigo border-indigo-border",
    accentColor: "border-indigo",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    role: "Candidate C",
    platform: "Mathematical Verifiability & Cryptographic Rigor",
    avatar: "✦",
    tagColor: "bg-jade-light text-jade-dark border-jade-border",
    accentColor: "border-jade",
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

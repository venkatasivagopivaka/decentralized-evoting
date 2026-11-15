export const CANDIDATES = [
  {
    id: 0,
    name: "Satoshi Nakamoto",
    role: "Candidate A",
    platform: "Decentralized Infrastructure & Protocol Sovereignty",
    avatar: "⚡",
    color: "from-amber-500 to-orange-600",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    id: 1,
    name: "Vitalik Buterin",
    role: "Candidate B",
    platform: "Programmable Smart Contracts & Quadratic Funding",
    avatar: "🔷",
    color: "from-indigo-500 to-purple-600",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    role: "Candidate C",
    platform: "Mathematical Verifiability & Cryptographic Rigor",
    avatar: "🌸",
    color: "from-emerald-500 to-teal-600",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
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

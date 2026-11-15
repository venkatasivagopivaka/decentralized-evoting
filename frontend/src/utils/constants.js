export const CANDIDATES = [
  {
    id: 0,
    name: "Satoshi Nakamoto",
    role: "Candidate A",
    platform: "Decentralized Infrastructure & Protocol Sovereignty",
    avatar: "⚡",
    tagColor: "bg-amber-light text-amber-dark border-amber-border",
    badgeBackground: "bg-sand-subtle",
    selectedBorder: "border-amber",
    accentColor: "text-amber",
    barColor: "bg-amber",
  },
  {
    id: 1,
    name: "Vitalik Buterin",
    role: "Candidate B",
    platform: "Programmable Smart Contracts & Quadratic Funding",
    avatar: "🔷",
    tagColor: "bg-indigo-light text-indigo-dark border-indigo-border",
    badgeBackground: "bg-ocean-light",
    selectedBorder: "border-indigo",
    accentColor: "text-indigo",
    barColor: "bg-indigo",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    role: "Candidate C",
    platform: "Mathematical Verifiability & Cryptographic Rigor",
    avatar: "✦",
    tagColor: "bg-sage-light text-sage-dark border-sage-border",
    badgeBackground: "bg-mint-subtle",
    selectedBorder: "border-emerald",
    accentColor: "text-emerald",
    barColor: "bg-sage",
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

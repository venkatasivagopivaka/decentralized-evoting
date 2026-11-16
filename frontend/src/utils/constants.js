export const CANDIDATES = [
  {
    id: 0,
    name: "Satoshi Nakamoto",
    role: "Candidate A",
    platform: "Decentralized Infrastructure & Protocol Sovereignty",
    avatar: "⚡",
    tagColor: "bg-pale-amber text-amber-dark border-amber-border",
    badgeBackground: "bg-pale-amber text-amber-dark",
    paleBg: "bg-pale-amber",
    selectedBorder: "border-amber",
    selectedRing: "ring-amber/20",
    accentColor: "text-amber-dark",
    barColor: "bg-amber",
    hexCode: "#D99A35",
  },
  {
    id: 1,
    name: "Vitalik Buterin",
    role: "Candidate B",
    platform: "Programmable Smart Contracts & Quadratic Funding",
    avatar: "🔷",
    tagColor: "bg-pale-lavender text-indigo-dark border-indigo-border",
    badgeBackground: "bg-pale-lavender text-indigo-dark",
    paleBg: "bg-pale-lavender",
    selectedBorder: "border-indigo",
    selectedRing: "ring-indigo/20",
    accentColor: "text-indigo-dark",
    barColor: "bg-indigo",
    hexCode: "#4959C8",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    role: "Candidate C",
    platform: "Mathematical Verifiability & Cryptographic Rigor",
    avatar: "✦",
    tagColor: "bg-pale-mint text-sage-dark border-sage-border",
    badgeBackground: "bg-pale-mint text-sage-dark",
    paleBg: "bg-pale-mint",
    selectedBorder: "border-sage",
    selectedRing: "ring-sage/20",
    accentColor: "text-sage-dark",
    barColor: "bg-sage",
    hexCode: "#8BAA63",
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

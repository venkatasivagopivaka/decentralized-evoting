# 🗳️ Decentralized E-Voting System (Paillier Homomorphic Cryptosystem)

A production-ready, privacy-preserving Decentralized Electronic Voting system built in a single monorepo. The application combines Ethereum smart contracts with **Paillier Additively Homomorphic Encryption**, guaranteeing **end-to-end ballot secrecy**, **provable mathematical tallying**, and **zero-knowledge privacy** for voters.

---

## 🌟 Key Features

- **End-to-End Ballot Privacy**: Ballots are encrypted on the voter's client using Paillier public-key cryptography before reaching Ethereum. Individual voter choices are never stored in plaintext on-chain, nor are they ever revealed to miners, nodes, or the election administrator.
- **Homomorphic Tallying**: The election administrator aggregates all encrypted ballots directly in ciphertext space off-chain using the homomorphic addition property ($\prod c_i \bmod n^2$). Only the final mathematical total is decrypted.
- **Strict On-Chain Access Control**: Smart contract enforces voter whitelisting, prevents double-voting, restricts administrative actions, and governs the election lifecycle (Closed $\leftrightarrow$ Open).
- **Multi-Candidate Radix Encoding**: Implements super-increasing radix encoding ($B^i$, base $10,000$) to tally multiple candidates unambiguously in a single aggregate ciphertext without interactive zero-knowledge proofs. Also includes support for two-candidate linear systems ($A=1, B=2$).
- **Modern Web3 Tech Stack**: Built with **Hardhat** (Solidity `^0.8.20`), **Vite + React 18**, **ethers.js (v6)**, and **paillier-bigint**.
- **Interactive Cryptographic Inspector**: Built-in visual sandbox and educational drawer explaining the underlying modular arithmetic and live homomorphic computations.

---

## 🏗️ Architecture & Monorepo Structure

```
decentralized-evoting/
├── backend/                             # Hardhat Solidity environment
│   ├── contracts/
│   │   └── EVoting.sol                  # Main E-Voting Smart Contract
│   ├── scripts/
│   │   └── deploy.js                    # Deployment script (auto-exports ABI to frontend)
│   ├── test/
│   │   └── EVoting.test.js              # Comprehensive unit & homomorphic crypto tests (21 tests)
│   ├── hardhat.config.js                # Hardhat network & compiler configuration
│   └── package.json                     # Backend dependencies
│
├── frontend/                            # Vite + React Web3 application
│   ├── public/                          # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Wallet status, network switch, tab navigation
│   │   │   ├── VoterView.jsx            # Candidate selection & encrypted ballot submission
│   │   │   ├── AdminView.jsx            # Key management, whitelisting, homomorphic tallying
│   │   │   ├── CandidateCard.jsx        # Candidate cards with cryptographic preview
│   │   │   └── CryptoInspector.jsx      # Interactive homomorphic math sandbox
│   │   ├── contracts/
│   │   │   └── EVoting.json             # Deployed address & ABI
│   │   ├── utils/
│   │   │   ├── crypto.js                # Paillier keygen, encryption, aggregation, decryption
│   │   │   ├── contract.js              # Ethers v6 provider, signer, network switching
│   │   │   └── constants.js             # Candidates, chain IDs, Radix base
│   │   ├── App.jsx                      # Master layout & real-time blockchain event synchronization
│   │   ├── index.css                    # Tailwind CSS + glassmorphism styling
│   │   └── main.jsx                     # React entrypoint
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json                     # Frontend dependencies
│
├── package.json                         # Root monorepo orchestration scripts
└── README.md                            # Comprehensive documentation
```

---

## 🔐 Cryptographic Theory & Security Model

### 1. Paillier Homomorphic Cryptosystem
The Paillier cryptosystem is an asymmetric additively homomorphic encryption scheme:
- **Public Key**: $(n, g)$ where $n = p \cdot q$ and $g = n + 1$
- **Private Key**: $(\lambda, \mu)$ where $\lambda = \text{lcm}(p-1, q-1)$ and $\mu = (L(g^\lambda \bmod n^2))^{-1} \bmod n$
- **Probabilistic Encryption**:
  $$c = g^m \cdot r^n \bmod n^2$$
  where $m \in \mathbb{Z}_n$ is the plaintext message and $r \in \mathbb{Z}_n^*$ is a cryptographically secure random blinding salt.
  *Because $r$ is randomly chosen for every ballot, two voters voting for the exact same candidate produce completely different, indistinguishable ciphertexts.*

### 2. Homomorphic Addition
Given two ciphertexts $c_1 = E(m_1)$ and $c_2 = E(m_2)$:
$$c_{\text{sum}} = c_1 \cdot c_2 \bmod n^2 = (g^{m_1} r_1^n)(g^{m_2} r_2^n) \bmod n^2 = g^{m_1 + m_2} (r_1 r_2)^n \bmod n^2 = E(m_1 + m_2)$$
The administrator computes the product of all ciphertexts without decrypting any individual ballot. Only the final aggregate total is decrypted using the private key:
$$M_{\text{total}} = D\left(\prod_{i=1}^{k} c_i \bmod n^2\right) = \sum_{i=1}^{k} m_i \bmod n$$

### 3. Multi-Candidate Radix Encoding
If candidates are merely encoded as $1, 2, 3$, an aggregate sum of $6$ is mathematically ambiguous ($1+2+3 = 2+2+2 = 1+1+4$).
To resolve this rigorously, each candidate $i \in \{0, 1, 2, \dots\}$ is encoded using a super-increasing radix sequence:
$$m = B^i \quad (\text{where } B = 10,000)$$
For 3 candidates:
- Candidate 0 (Satoshi Nakamoto): $10000^0 = 1$
- Candidate 1 (Vitalik Buterin): $10000^1 = 10,000$
- Candidate 2 (Ada Lovelace): $10000^2 = 100,000,000$

Upon decrypting the final sum $S = M_{\text{total}}$, the exact vote count $N_i$ for each candidate is cleanly extracted:
$$N_0 = S \bmod 10000$$
$$N_1 = \lfloor S / 10000 \rfloor \bmod 10000$$
$$N_2 = \lfloor S / 10000^2 \rfloor \bmod 10000$$

*(The system also provides full support for the two-candidate linear equation system: Candidate A = 1, Candidate B = 2, where $N_B = S - V$ and $N_A = V - N_B$.)*

---

## ⚡ Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on `v20.x` and `v24.x`)
- **npm**: `v9.x` or higher
- **MetaMask**: Browser extension installed

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
From the root directory, install dependencies across both `backend` and `frontend`:
```bash
npm run install:all
```
*(Or navigate to `/backend` and `/frontend` individually and run `npm install`)*

---

### ⚡ Single-Command Startup (DevOps Automated)
You can start the entire stack simultaneously with one command:
```bash
npm run start:all
```
*This command uses `concurrently` and `wait-on` to launch the local Hardhat node, wait for port 8545 to accept connections, deploy `EVoting.sol` (synchronizing the ABI), and spin up the Vite React frontend.*

---

### Step 2: Manual Step-by-Step Alternative
If you prefer running services in separate terminal windows:
```bash
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contract to local node
npm run deploy

# Terminal 3: Start Vite frontend
npm run dev
```

---

### Step 5: Configure MetaMask for Localhost
1. Open MetaMask and click the **Network Selector** in the top left.
2. Select **Add Network** $\rightarrow$ **Add a network manually**.
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Import Hardhat Test Accounts into MetaMask:
   - When you start the node (`npm run node`), Hardhat outputs 20 accounts and their private keys in your terminal.
   - **Deployer / Admin (Account #0)**: Address `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (copy private key from terminal output).
   - **Voter 1 (Account #1)**: Address `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (copy private key from terminal output).
   - **Voter 2 (Account #2)**: Address `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (copy private key from terminal output).
   - *Security Note:* These default Hardhat test accounts and keys are public and strictly for isolated local development. Never use them on public testnets or mainnet.

---

## 🔄 Complete Voting Lifecycle Walkthrough

### 1. Admin Setup
1. Switch to **Account #0** in MetaMask and click **Connect Wallet**.
2. Navigate to the **Admin Dashboard** tab.
3. Under **Paillier Cryptosystem Keys**:
   - Click **Generate 1024-bit Paillier Keys**.
   - Click **Publish to Contract** to store the public key on Ethereum.
4. Under **Voter Whitelisting Engine**:
   - Whitelist voter addresses using the single address field or click **Fill Hardhat Test Accounts** and click **Batch Whitelist Addresses**.
5. Under **Election Lifecycle Control**:
   - Click **Start Election** (Election state becomes **Open**).

### 2. Voter Participation
1. Switch MetaMask to **Account #1** (or any whitelisted account).
2. Navigate to the **Voter Portal** tab.
3. Notice your eligibility badge displays:
   - Whitelist Status: **Whitelisted Voter**
   - Ballot Status: **Ready to Vote**
   - Election: **Active (Open)**
4. Select a candidate (e.g. Satoshi Nakamoto, Vitalik Buterin, or Ada Lovelace).
5. Inspect the live **Ballot Encryption Preview**:
   - Plaintext message $m$
   - Modulus $n$
   - Randomized Paillier ciphertext $c$
6. Click **Cast Encrypted Vote**.
7. Confirm the transaction in MetaMask.
8. Once mined, your ballot is permanently sealed on-chain, and your status changes to **Ballot Cast** (double voting is strictly blocked).

### 3. Tallying & Winner Decryption
1. Switch MetaMask back to **Account #0** (Admin) and open the **Admin Dashboard**.
2. Click **End Election** (Election state becomes **Closed**; no further ballots can be cast).
3. Under **Homomorphic Tally & Winner Decryption**:
   - Click **Step 1: Compute Homomorphic Sum**: Aggregates all ciphertexts off-chain ($\prod c_i \bmod n^2$).
   - Click **Step 2 & 3: Decrypt Tally & Reveal Winner**: Uses the Admin Private Key to decrypt the aggregate sum and decode the candidate counts.
4. Confetti triggers and the winner is declared with full podium and percentage breakdowns!

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive Hardhat test suite verifying the smart contract constraints and verifying Paillier homomorphic math on-chain.

Run the test suite:
```bash
npm test
```

### Test Coverage Highlights (21 tests):
- ✅ **Deployment & Initial State**: Admin assignment, initial closed state, empty ballot arrays.
- ✅ **Access Control**: Admin-only whitelisting, preventing duplicate whitelisting, zero-address rejection, batch whitelisting.
- ✅ **Key Management**: Admin publishing Paillier $(n, g)$ public key on-chain, unauthorized access rejection.
- ✅ **Election Lifecycle**: State transitions (`startElection`, `endElection`), modifier enforcement.
- ✅ **Ballot Security**: Whitelisted submission, strict double-voting prevention, non-whitelisted revert, closed election revert.
- ✅ **End-to-End Cryptographic Tallying**:
  - Full multi-voter simulation with Radix encoding ($10,000^i$).
  - Full multi-voter simulation with 2-candidate linear system ($A=1, B=2$).
  - Assertion that homomorphic product decrypts to the exact candidate vote distribution.

---

## 🔒 Security Best Practices

1. **Private Key Isolation**: In production, the election private key is held in an HSM or split among election trustees using Shamir's Secret Sharing ($k$-of-$n$ threshold decryption).
2. **Re-encryption & Zero-Knowledge Proofs**: The client can optionally produce NIZK (Non-Interactive Zero-Knowledge) proofs of plaintext validity ($m \in \{B^0, B^1, \dots\}$) to prevent malicious plaintexts.
3. **Immutability & Auditability**: Every encrypted ciphertext is immutably stored in the `encryptedVotes` array on Ethereum, allowing anyone to independently verify the homomorphic summation step.

---

## 📄 License
This project is open-source software licensed under the [MIT License](LICENSE).

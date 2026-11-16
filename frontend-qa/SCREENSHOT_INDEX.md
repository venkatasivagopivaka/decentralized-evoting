# Decentralized E-Voting System — Production Screenshot Index & Technical Reference

> **Document Type:** Production Screenshot Catalog & Pedagogical Reference  
> **Application:** Decentralized E-Voting System (Ethereum + Paillier Homomorphic Cryptosystem)  
> **Visual Identity:** Neo-Lime Editorial (Soft Ivory `#F3F0E6`, Midnight Black `#08090B`, Neon Lime `#C6FF00`)  
> **Total Captured Views:** 17 Production Screenshots (13 Desktop 1440×900, 4 Mobile 390×844)  
> **Audit Status:** Verified Genuine (Real Hardhat Node, Chain ID 31337, Real 1024-bit Paillier Keypair, Zero Mocks)

---

## 1. Executive Summary of Screenshot Artifacts

This index provides a complete, structured technical reference for all 17 high-resolution screenshots captured from the working decentralized e-voting application. Every screenshot represents an authentic state produced by our automated verification suite (`scripts/capture_current_screenshots.mjs`), which executed the entire on-chain election lifecycle:

1. **Key Generation & On-Chain Publishing:** Deploying 1024-bit Paillier public key $(n, g)$ to Ethereum.
2. **Access Control & Whitelisting:** Multi-account whitelisting and live on-chain status verification.
3. **Voting Window State Transition:** Starting the election window on the smart contract (`isElectionOpen = true`).
4. **Unauthorized Rejection:** Attempting access with an unwhitelisted account (`UnauthorizedView`).
5. **Client-Side Encryption & Ballot Submission:** Casting encrypted Radix ballots for Satoshi Nakamoto and Vitalik Buterin.
6. **Election Sealing:** Closing the election window on the smart contract (`isElectionOpen = false`).
7. **Homomorphic Tallying & Outcome:** Computing homomorphic product $C_{\text{total}} = \prod c_i \bmod n^2$, decrypting plaintext sum (10002), and crowning the winner with celebratory confetti.
8. **Mobile Responsiveness:** Capturing full responsive layouts at mobile dimensions (390 × 844).

---

## 2. Complete Screenshot Catalog

### Desktop Viewports (1440 × 900)

| Filename | Viewport | Interface / State | Active Role | Key Technical Features | Recommended Report Placement |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **`01-desktop-landing.png`** | 1440×900 | Hero Landing Page | Disconnected | Editorial headline "YOUR VOTE. YOUR POWER.", 3D interactive holographic monolith, protocol feature tags, sticky navigation bar with prominent "CONNECT WALLET" button. | Chapter 4: System Architecture / User Interface |
| **`02-desktop-wallet-connection.png`** | 1440×900 | Sovereign Access Gateway | Disconnected | "DEMOCRATIC ACCESS", "Connect to Determine Protocol Role", role capability cards (Registered Voter vs. Election Authority), on-chain protocol badges (Zero-Knowledge Privacy, Chain ID 31337). | Chapter 4: Role-Based Access Control Architecture |
| **`03-desktop-voter-dashboard.png`** | 1440×900 | Voter Official Ballot | Voter (`0x7099...`) | Dynamic navbar `VOTER` badge, `LIVE POLLS` status pill, candidate nomination grid with platform summaries, radix polynomial indicators. | Chapter 5: Voter Workflow & Ballot Interface |
| **`04-desktop-candidate-selection.png`** | 1440×900 | Candidate Selection Active | Voter (`0x7099...`) | Satoshi Nakamoto actively selected with glowing Neon Lime border, checkmark badge, live Radix weight preview ($10,000^0 = 1$), Paillier ciphertext preview box. | Chapter 5: Client-Side Radix Encoding |
| **`05-desktop-encrypted-ballot.png`** | 1440×900 | Ballot Confirmed & Sealed | Voter (`0x7099...`) | Expanded 617-digit ciphertext preview, transaction confirmed on Ethereum, button state "BALLOT VERIFIED & SEALED ON-CHAIN", toast notification. | Chapter 5: Cryptographic Ballot Submission |
| **`06-desktop-admin-dashboard.png`** | 1440×900 | Admin Console Overview | Admin (`0xf39F...`) | Dynamic navbar `ADMIN` badge, Section 01 Lifecycle controls, Section 02 Paillier key management, account switcher toast notification. | Chapter 6: Administrative Operations & Protocol Governance |
| **`07-desktop-election-lifecycle.png`** | 1440×900 | Election Lifecycle (Sec 01) | Admin (`0xf39F...`) | Election status badge (`POLLS CLOSED`), recorded ballot counter (0), "Open Voting Window" (lime button), "Close & Seal Voting" (destructive button). | Chapter 6: Smart Contract State Transitions |
| **`08-desktop-paillier-cryptography.png`** | 1440×900 | Paillier Parameters (Sec 02) | Admin (`0xf39F...`) | Bitlength selector (1024-bit), "Generate 1024-bit Keys" trigger, on-chain public key status ("Public Key Active On-Chain"), truncated modulus $n$, local private key $(\lambda, \mu)$ active status. | Chapter 3: Paillier Cryptographic Implementation |
| **`09-desktop-voter-management.png`** | 1440×900 | Voter Access & Whitelist (Sec 03) | Admin (`0xf39F...`) | Single voter registration input, batch registration textarea, Live On-Chain Voter Status Verification tool showing `0x7099...` as "Whitelisted & Eligible" with green badge. | Chapter 6: Identity Management & Whitelisting |
| **`10-desktop-tally-results.png`** | 1440×900 | Homomorphic Tally & Winner (Sec 04) | Admin (`0xf39F...`) | Homomorphic product ($C_{\text{total}} = \prod c_i \bmod n^2$), decrypted plaintext sum (10002), decomposed votes (Satoshi: 2, Vitalik: 1, Ada: 0), Monumental Certified Winner card with crown & confetti. | Chapter 7: Homomorphic Tallying & Verification |
| **`12-desktop-cryptography-interface.png`** | 1440×900 | Cryptography Lab (3 Pillars) | Public / Any | "The Mathematics of Secrecy", 3 Pillars: Additive Homomorphism ($E(m_1) \cdot E(m_2) \bmod n^2$), Probabilistic Semantic Security ($r \in \mathbb{Z}^*_n$), Radix Base-10,000 Encoding. | Chapter 3: Theoretical Foundation & Cryptosystem |
| **`15-desktop-access-denied-unauthorized.png`** | 1440×900 | Access Denied / Security Screen | Unregistered (`0x3333...`) | High-contrast security alert ("WALLET NOT WHITELISTED"), "CIVIC ACCESS POLICY VIOLATION", unauthorized address display, account switcher & disconnect action buttons. | Chapter 8: Security Analysis & Attack Mitigation |
| **`16-desktop-crypto-sandbox-simulation.png`** | 1440×900 | Interactive Math Sandbox | Public / Any | Off-chain simulation playground, demo presets, plaintext ballot inputs ($m_1, m_2$), "Execute Simulation" button, live modular arithmetic calculation breakdown. | Chapter 3: Pedagogical Tools & Cryptographic Demonstration |

---

### Mobile Viewports (390 × 844)

| Filename | Viewport | Interface / State | Active Role | Key Technical Features | Recommended Report Placement |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **`11-mobile-landing.png`** | 390×844 | Mobile Landing View | Disconnected | Mobile stacked pill navigation, responsive editorial typography "YOUR VOTE. YOUR POWER.", responsive "CONNECT WALLET" header button. | Appendix A: Mobile Accessibility & Responsive Design |
| **`13-mobile-admin-dashboard.png`** | 390×844 | Mobile Admin Dashboard | Admin (`0xf39F...`) | Responsive administration cards, vertical stack layout for keygen buttons and lifecycle controls, touch-friendly pill buttons. | Appendix A: Mobile Administrative Capabilities |
| **`14-mobile-voter-dashboard.png`** | 390×844 | Mobile Voter Ballot | Voter (`0x7099...`) | Mobile-optimized candidate selection cards, active nominee selection highlight in neon lime, mobile ballot submission trigger. | Appendix A: Mobile Citizen Voting Experience |
| **`17-mobile-cryptography.png`** | 390×844 | Mobile Cryptography Lab | Public / Any | Mobile mathematical formula breakdown, vertically stacked pedagogical pillars, readable LaTeX KaTeX equations on narrow viewports. | Appendix A: Mobile Cryptographic Education |

---

## 3. Detailed Technical Analysis per Screenshot

### `01-desktop-landing.png`
- **Resolution:** 1440 × 900
- **User Role:** Disconnected Visitor
- **Technical Description:** Displays the unauthenticated entry screen of the application. The navigation header contains the protocol identifier, a segmented route switch ("LANDING" vs. "CRYPTOGRAPHY LAB"), an election lifecycle status pill ("SEALED"), and a prominent high-contrast "CONNECT WALLET" button. Crucially, the "BALLOT" and "ADMIN" tabs are hidden, adhering to our wallet-first security architecture. The hero section features expressive typography ("YOUR VOTE. YOUR POWER.") and a 3D interactive holographic monolith rendered using Three.js with floating particle physics.

### `02-desktop-wallet-connection.png`
- **Resolution:** 1440 × 900
- **User Role:** Disconnected Visitor (Scrolled to Gateway)
- **Technical Description:** Illustrates the Sovereign Access Gateway ("Democratic Access.") section on the Soft Ivory canvas (`#F3F0E6`). The primary authentication card features a pulsing status indicator ("WALLET DISCONNECTED // AUTHENTICATION REQUIRED") and outlines the automatic on-chain role determination mechanism. Four protocol verification badges are rendered: On-Chain Role Check, Zero-Knowledge Privacy, Homomorphic Tallying, and Chain ID 31337. Two role preview cards explain the specific privileges of a Registered Voter (Role 01) and the Election Authority (Role 02).

### `03-desktop-voter-dashboard.png`
- **Resolution:** 1440 × 900
- **User Role:** Registered Voter (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)
- **Technical Description:** Displays the authenticated Voter Ballot interface after connecting an authorized voter account. The navbar dynamically renders an active `VOTER` badge alongside the voter's truncated Ethereum address and a pulsing green `LIVE POLLS` status pill. The central ballot grid presents the 3 certified candidates (Satoshi Nakamoto, Vitalik Buterin, Ada Lovelace) with their platforms, credential tags, and respective Radix polynomial weights. The administrative console is inaccessible from this view.

### `04-desktop-candidate-selection.png`
- **Resolution:** 1440 × 900
- **User Role:** Registered Voter (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)
- **Technical Description:** Demonstrates active candidate selection. Candidate 01 ("Satoshi Nakamoto") is selected, triggering a luminous Neon Lime (`#C6FF00`) border and a green checkmark badge ("SELECTED"). The Radix weight preview displays `RADIX VALUE: 10,000^0 = 1`. In the right-hand submission card, the client-side Paillier encryption engine automatically computes the 617-digit decimal ciphertext preview blinded with random salt $r \in \mathbb{Z}^*_n$. The action button displays "CAST BALLOT FOR SATOSHI NAKAMOTO".

### `05-desktop-encrypted-ballot.png`
- **Resolution:** 1440 × 900
- **User Role:** Registered Voter (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)
- **Technical Description:** Captures the verified on-chain confirmation state after the voter's ballot has been mined into an Ethereum block. The status card displays "BALLOT SEALED — Your encrypted vote is permanently verified on Ethereum." The action button is locked in an immutable confirmed state ("BALLOT VERIFIED & SEALED ON-CHAIN"), preventing duplicate submissions. A toast notification confirms: "Ballot confirmed on Ethereum blockchain."

### `06-desktop-admin-dashboard.png`
- **Resolution:** 1440 × 900
- **User Role:** Election Administrator (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Technical Description:** Shows the full administrative console mounted immediately upon connecting Account #0. The navbar displays the `ADMIN` role badge and conceals the voter ballot tab. The page layout is organized into 4 distinct operational sections: Section 01 (Lifecycle), Section 02 (Paillier Parameters), Section 03 (Voter Access), and Section 04 (Homomorphic Tally). An informative toast confirms: "Switched to Administrator Account (0xf39F...2266)".

### `07-desktop-election-lifecycle.png`
- **Resolution:** 1440 × 900
- **User Role:** Election Administrator (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Technical Description:** Detailed view of Section 01: Election Lifecycle. Shows the initial sealed state ("POLLS CLOSED (SEALED)"), a live on-chain counter displaying current recorded ballots (0), and two high-visibility action controls: "Open Voting Window" (Neon Lime pill) and "Close & Seal Voting" (destructive outline pill).

### `08-desktop-paillier-cryptography.png`
- **Resolution:** 1440 × 900
- **User Role:** Election Administrator (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Technical Description:** Detailed view of Section 02: Paillier Encryption Parameters. Demonstrates key management capabilities: bitlength selection (1024-bit selected), on-chain status indicator ("Public Key Active On-Chain"), truncated Modulus $n$ public parameter, and private key status badge ("Active in Secure Browser Session").

### `09-desktop-voter-management.png`
- **Resolution:** 1440 × 900
- **User Role:** Election Administrator (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Technical Description:** Detailed view of Section 03: Voter Access & Whitelist. Displays two registration mechanisms: Single Address Registration and Batch Address Registration. Highlights the Live On-Chain Voter Status Verification inspection tool: when queried for test account `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`, it executes a real-time call to `EVoting.sol` and confirms "Whitelisted & Eligible" with a green checkmark pill.

### `10-desktop-tally-results.png`
- **Resolution:** 1440 × 900
- **User Role:** Election Administrator (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Technical Description:** Detailed view of Section 04: Homomorphic Tally & Certified Outcome. Demonstrates the complete tally calculation:
  1. Shows that 3 encrypted ballots were retrieved from Ethereum.
  2. Displays the aggregated ciphertext product ($C_{\text{total}} = \prod c_i \bmod n^2$).
  3. Displays the decrypted plaintext sum: `10002`.
  4. Displays the Monumental Winner Card: "CERTIFIED WINNER: SATOSHI NAKAMOTO (2 Votes Certified)", accompanied by a golden crown and confetti animation.
  5. Displays the candidate distribution breakdown bars: Satoshi Nakamoto (2 votes, 67%), Vitalik Buterin (1 vote, 33%), Ada Lovelace (0 votes, 0%).

### `12-desktop-cryptography-interface.png`
- **Resolution:** 1440 × 900
- **User Role:** Public Auditor / Any User
- **Technical Description:** Academic overview of the Cryptography Lab: "The Mathematics of Secrecy". Details the 3 core pillars of the voting protocol: Additive Homomorphism ($\mathcal{D}(c_1 \cdot c_2 \bmod n^2) = m_1 + m_2 \bmod n$), Probabilistic Semantic Security (IND-CPA using blinding factor $r \in \mathbb{Z}^*_n$), and Radix Base-10,000 Polynomial Encoding ($m = \sum v_i \cdot 10,000^i$).

### `15-desktop-access-denied-unauthorized.png`
- **Resolution:** 1440 × 900
- **User Role:** Unregistered Account (`0x3333333333333333333333333333333333333333`)
- **Technical Description:** High-contrast security alert displayed when an unauthorized account connects. The navbar indicates `ACCESS STATUS` with an `UNREGISTERED` coral red badge. The main view displays "WALLET NOT WHITELISTED // CIVIC ACCESS POLICY VIOLATION" and explains that unwhitelisted accounts cannot inject ciphertexts into the ballot box. Provides direct action buttons to "SWITCH METAMASK ACCOUNT" or "DISCONNECT WALLET".

### `16-desktop-crypto-sandbox-simulation.png`
- **Resolution:** 1440 × 900
- **User Role:** Public Auditor / Any User
- **Technical Description:** Scrolled view of the Interactive Homomorphic Sandbox within the Cryptography Lab. Features interactive demo presets (e.g., "Satoshi + Vitalik", "Carry-Over Test"), input fields for plaintext ballots $m_1$ and $m_2$, and an "Execute Simulation" button that performs keygen, encryption, ciphertext multiplication, and tally decoding in real time off-chain.

### `11-mobile-landing.png`
- **Resolution:** 390 × 844 (Mobile Viewport)
- **User Role:** Disconnected Visitor
- **Technical Description:** Mobile-responsive landing screen demonstrating vertical layout stacking. Shows the compact mobile navbar with responsive "CONNECT WALLET" button, large legible editorial headline, and mobile-optimized "Connect Wallet to Enter" call-to-action button.

### `13-mobile-admin-dashboard.png`
- **Resolution:** 390 × 844 (Mobile Viewport)
- **User Role:** Election Administrator (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Technical Description:** Responsive mobile view of the Admin Console. Features stacked bitlength selection pills (512, 1024, 2048), full-width key generation buttons, and mobile-friendly election lifecycle controls without horizontal scrollbars.

### `14-mobile-voter-dashboard.png`
- **Resolution:** 390 × 844 (Mobile Viewport)
- **User Role:** Registered Voter (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)
- **Technical Description:** Mobile-responsive view of the Voter Ballot. Shows touch-friendly candidate cards, active nominee selection highlight in neon lime, platform descriptions, and full accessibility on narrow mobile displays.

### `17-mobile-cryptography.png`
- **Resolution:** 390 × 844 (Mobile Viewport)
- **User Role:** Public Auditor / Any User
- **Technical Description:** Mobile view of the Cryptography Lab. Demonstrates clean typography and responsive mathematical formula rendering (KaTeX) formatted cleanly for smartphone screens.

---

## 4. Suggested Report Integration Guide

To maximize academic presentation impact in Google AI Studio or your final thesis document:

1. **Chapter 1 / Introduction:** Use `01-desktop-landing.png` to showcase the system's design identity and user onboarding.
2. **Chapter 3 / Cryptographic Architecture:** Embed `12-desktop-cryptography-interface.png` and `16-desktop-crypto-sandbox-simulation.png` to illustrate Paillier mathematical homomorphism and Radix encoding.
3. **Chapter 4 / Security & Role-Based Access Control:** Pair `02-desktop-wallet-connection.png` with `15-desktop-access-denied-unauthorized.png` to demonstrate on-chain whitelist enforcement and unauthorized account rejection.
4. **Chapter 5 / Voter Experience:** Use `03-desktop-voter-dashboard.png`, `04-desktop-candidate-selection.png`, and `05-desktop-encrypted-ballot.png` in a progressive sequence showing nominee selection, client-side encryption, and on-chain sealing.
5. **Chapter 6 / Administrative Governance & Tallying:** Present `06-desktop-admin-dashboard.png`, `08-desktop-paillier-cryptography.png`, `09-desktop-voter-management.png`, and `10-desktop-tally-results.png` to illustrate key publishing, voter whitelisting, homomorphic aggregation, and certified outcome declaration.
6. **Appendix / Responsiveness:** Embed `11-mobile-landing.png`, `13-mobile-admin-dashboard.png`, `14-mobile-voter-dashboard.png`, and `17-mobile-cryptography.png` to prove mobile usability and cross-platform accessibility.

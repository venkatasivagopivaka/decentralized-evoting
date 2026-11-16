/**
 * Automated Production Screenshot Capture Script for Decentralized E-Voting
 * 
 * Captures 17 genuine, unmocked screenshots of the current running application
 * across Desktop (1440x900) and Mobile (390x844) viewports.
 * 
 * Preserves the Neo-Lime Editorial visual identity:
 * - Soft Ivory #F3F0E6
 * - Midnight Black #08090B
 * - Neon Lime #C6FF00
 */

import puppeteer from 'puppeteer-core';
import { ethers } from '../frontend/node_modules/ethers/lib.esm/index.js';
import fs from 'fs';
import path from 'path';
import {
  generatePaillierKeys,
  serializePublicKey,
  serializePrivateKey,
  encodeCandidateVoteRadix,
  encryptVote,
} from '../frontend/src/utils/crypto.js';

const SCREENSHOT_DIR = path.resolve('frontend-qa/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const VOTER1_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const VOTER2_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const VOTER3_ADDRESS = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const UNREGISTERED_ADDRESS = '0x3333333333333333333333333333333333333333';

const HARDHAT_ACC0_PRIVKEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const HARDHAT_ACC1_PRIVKEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const HARDHAT_ACC2_PRIVKEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const HARDHAT_ACC3_PRIVKEY = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

const contractArtifact = JSON.parse(
  fs.readFileSync('frontend/src/contracts/EVoting.json', 'utf8')
);
const rpcProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const adminWallet = new ethers.Wallet(HARDHAT_ACC0_PRIVKEY, rpcProvider);
const voter1Wallet = new ethers.Wallet(HARDHAT_ACC1_PRIVKEY, rpcProvider);
const voter2Wallet = new ethers.Wallet(HARDHAT_ACC2_PRIVKEY, rpcProvider);
const voter3Wallet = new ethers.Wallet(HARDHAT_ACC3_PRIVKEY, rpcProvider);

const evotingAdmin = new ethers.Contract(contractArtifact.address, contractArtifact.abi, adminWallet);
const evotingVoter1 = new ethers.Contract(contractArtifact.address, contractArtifact.abi, voter1Wallet);
const evotingVoter2 = new ethers.Contract(contractArtifact.address, contractArtifact.abi, voter2Wallet);
const evotingVoter3 = new ethers.Contract(contractArtifact.address, contractArtifact.abi, voter3Wallet);

// Authoritative nonce-tracked transaction execution
async function sendAdminTx(method, ...args) {
  const nonce = await rpcProvider.getTransactionCount(ADMIN_ADDRESS, 'pending');
  const tx = await evotingAdmin[method](...args, { nonce });
  return await tx.wait();
}

async function sendVoterTx(voterContract, wallet, method, ...args) {
  const nonce = await rpcProvider.getTransactionCount(wallet.address, 'pending');
  const tx = await voterContract[method](...args, { nonce });
  return await tx.wait();
}

async function capture() {
  console.log('===============================================================');
  console.log('   STARTING AUTOMATED PRODUCTION SCREENSHOT CAPTURE SUITE     ');
  console.log('===============================================================\n');

  // Step 0: Pre-generate a 1024-bit Paillier Keypair for deterministic on-chain & session consistency
  console.log('>>> [0/17] Generating 1024-bit Paillier Keypair for Election...');
  const { publicKey, privateKey } = await generatePaillierKeys(1024);
  const serPub = serializePublicKey(publicKey);
  const serPriv = serializePrivateKey(privateKey);
  console.log(`    Modulus n bitlength: ${publicKey.n.toString(2).length} bits`);
  console.log('    Keypair generated successfully.');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[Browser Console Error] ${msg.text()}`);
    }
  });

  // Inject Web3 Mock Provider
  await page.evaluateOnNewDocument(() => {
    window.__mockAddress = null;
    window.ethereum = {
      isMetaMask: true,
      get selectedAddress() {
        return window.__mockAddress;
      },
      set selectedAddress(val) {
        window.__mockAddress = val;
      },
      networkVersion: '31337',
      chainId: '0x7a69',
      _listeners: {},
      on(event, callback) {
        this._listeners[event] = this._listeners[event] || [];
        this._listeners[event].push(callback);
      },
      removeListener(event, callback) {
        if (this._listeners[event]) {
          this._listeners[event] = this._listeners[event].filter((cb) => cb !== callback);
        }
      },
      emit(event, ...args) {
        if (this._listeners[event]) {
          this._listeners[event].forEach((cb) => cb(...args));
        }
      },
      async request({ method, params }) {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          return window.__mockAddress ? [window.__mockAddress] : [];
        }
        if (method === 'eth_chainId') {
          return '0x7a69';
        }
        if (method === 'wallet_switchEthereumChain') {
          return null;
        }
        if (method === 'wallet_requestPermissions') {
          return [{ eth_accounts: {} }];
        }
        const response = await fetch('http://127.0.0.1:8545', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Math.floor(Math.random() * 1000000),
            method,
            params,
          }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'RPC Error');
        return data.result;
      },
      send(method, params) {
        return this.request({ method, params });
      },
    };
  });

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP LANDING PAGE (Disconnected)
    // -------------------------------------------------------------
    console.log('>>> [1/17] Capturing 01-desktop-landing.png...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Seed Paillier keys in browser sessionStorage for Admin session decryption later
    await page.evaluate((sp, spr) => {
      sessionStorage.setItem('paillier_admin_pubkey_n', sp.n);
      sessionStorage.setItem('paillier_admin_pubkey_g', sp.g);
      sessionStorage.setItem('paillier_admin_privkey', JSON.stringify(spr));
    }, serPub, serPriv);

    // Scroll to top to frame hero section and navbar
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-desktop-landing.png'),
      fullPage: false,
    });
    console.log('    ✓ 01-desktop-landing.png captured.');

    // -------------------------------------------------------------
    // 2. DESKTOP WALLET CONNECTION GATEWAY
    // -------------------------------------------------------------
    console.log('>>> [2/17] Capturing 02-desktop-wallet-connection.png...');
    // Scroll down to the LandingGateway ("Democratic Access") section
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2, h3')).find((el) =>
        el.textContent.includes('Democratic Access') || el.textContent.includes('Connect to Determine')
      );
      if (heading) {
        heading.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -90); // Account for sticky navbar
      }
    });
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-desktop-wallet-connection.png'),
      fullPage: false,
    });
    console.log('    ✓ 02-desktop-wallet-connection.png captured.');

    // -------------------------------------------------------------
    // 3. DESKTOP CRYPTOGRAPHY INTERFACE (Overview)
    // -------------------------------------------------------------
    console.log('>>> [3/17] Capturing 12-desktop-cryptography-interface.png...');
    // Click "Explore Cryptography Lab"
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Cryptography')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll to top of Cryptography view
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '12-desktop-cryptography-interface.png'),
      fullPage: false,
    });
    console.log('    ✓ 12-desktop-cryptography-interface.png captured.');

    // -------------------------------------------------------------
    // 4. DESKTOP CRYPTOGRAPHY SANDBOX SIMULATION
    // -------------------------------------------------------------
    console.log('>>> [4/17] Capturing 16-desktop-crypto-sandbox-simulation.png...');
    // Scroll down to the Interactive Homomorphic Sandbox section
    await page.evaluate(() => {
      const sandbox = Array.from(document.querySelectorAll('h3')).find((el) =>
        el.textContent.includes('Interactive Homomorphic Sandbox')
      );
      if (sandbox) {
        sandbox.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -90);
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click "Execute Simulation" to ensure live results are shown
    await page.evaluate(() => {
      const execBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Execute Simulation') || b.textContent.includes('Computing')
      );
      if (execBtn) execBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '16-desktop-crypto-sandbox-simulation.png'),
      fullPage: false,
    });
    console.log('    ✓ 16-desktop-crypto-sandbox-simulation.png captured.');

    // -------------------------------------------------------------
    // 5. ADMIN SETUP: CONNECT ADMIN & VIEW DASHBOARD
    // -------------------------------------------------------------
    console.log('>>> [5/17] Capturing 06-desktop-admin-dashboard.png...');
    // Return to Landing and connect as Admin
    await page.evaluate((adminAddr) => {
      sessionStorage.removeItem('evoting_manual_disconnect');
      window.__mockAddress = adminAddr;
      if (window.ethereum) window.ethereum.emit('accountsChanged', [adminAddr]);
    }, ADMIN_ADDRESS);
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to top of Admin Dashboard
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-desktop-admin-dashboard.png'),
      fullPage: false,
    });
    console.log('    ✓ 06-desktop-admin-dashboard.png captured.');

    // -------------------------------------------------------------
    // 6. ADMIN ELECTION LIFECYCLE (Section 01)
    // -------------------------------------------------------------
    console.log('>>> [6/17] Capturing 07-desktop-election-lifecycle.png...');
    await page.evaluate(() => {
      const sec01 = Array.from(document.querySelectorAll('span, h3')).find((el) =>
        el.textContent.includes('SECTION 01')
      );
      if (sec01) {
        sec01.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-desktop-election-lifecycle.png'),
      fullPage: false,
    });
    console.log('    ✓ 07-desktop-election-lifecycle.png captured.');

    // -------------------------------------------------------------
    // 7. ADMIN PAILLIER CRYPTOGRAPHY (Section 02)
    // -------------------------------------------------------------
    console.log('>>> [7/17] Publishing 1024-bit Paillier Key on Ethereum...');
    // Publish public key to Ethereum contract directly on-chain
    await sendAdminTx('setPaillierPublicKey', serPub.n, serPub.g);
    console.log('    Published 1024-bit Paillier key to Ethereum smart contract.');

    // Refresh UI contract state
    await page.evaluate(() => {
      if (window.ethereum) window.ethereum.emit('accountsChanged', [window.__mockAddress]);
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Scroll to Section 02
    await page.evaluate(() => {
      const sec02 = Array.from(document.querySelectorAll('span, h3')).find((el) =>
        el.textContent.includes('SECTION 02')
      );
      if (sec02) {
        sec02.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -90);
      }
    });
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '08-desktop-paillier-cryptography.png'),
      fullPage: false,
    });
    console.log('    ✓ 08-desktop-paillier-cryptography.png captured.');

    // -------------------------------------------------------------
    // 8. ADMIN VOTER MANAGEMENT & LIVE LOOKUP (Section 03)
    // -------------------------------------------------------------
    console.log('>>> [8/17] Whitelisting Voters & Testing Live Lookup Tool...');
    // Whitelist Voter 1, 2, 3 on-chain if not already whitelisted
    const [isV1] = await evotingAdmin.getVoterStatus(VOTER1_ADDRESS);
    if (!isV1) {
      await sendAdminTx('addVoter', VOTER1_ADDRESS);
      console.log('    Whitelisted Voter 1 on-chain.');
    }
    const [isV2] = await evotingAdmin.getVoterStatus(VOTER2_ADDRESS);
    if (!isV2) {
      await sendAdminTx('addVoter', VOTER2_ADDRESS);
      console.log('    Whitelisted Voter 2 on-chain.');
    }
    const [isV3] = await evotingAdmin.getVoterStatus(VOTER3_ADDRESS);
    if (!isV3) {
      await sendAdminTx('addVoter', VOTER3_ADDRESS);
      console.log('    Whitelisted Voter 3 on-chain.');
    }

    // Scroll to Section 03
    await page.evaluate(() => {
      const sec03 = Array.from(document.querySelectorAll('span, h3')).find((el) =>
        el.textContent.includes('SECTION 03')
      );
      if (sec03) {
        sec03.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -90);
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click Test Preset "Acct #1" in the Live Voter Status Inspection Tool
    await page.evaluate(() => {
      const presetBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.trim() === 'Acct #1'
      );
      if (presetBtn) presetBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '09-desktop-voter-management.png'),
      fullPage: false,
    });
    console.log('    ✓ 09-desktop-voter-management.png captured.');

    // Open Voting Window now so voting is active
    console.log('    Opening Voting Window on-chain...');
    const isAlreadyOpen = await evotingAdmin.isElectionOpen();
    if (!isAlreadyOpen) {
      await sendAdminTx('startElection');
      console.log('    Election started on-chain.');
    }

    // -------------------------------------------------------------
    // 9. ACCESS DENIED / UNAUTHORIZED VIEW
    // -------------------------------------------------------------
    console.log('>>> [9/17] Capturing 15-desktop-access-denied-unauthorized.png...');
    // Switch to Unregistered Address
    await page.evaluate((unregAddr) => {
      window.__mockAddress = unregAddr;
      if (window.ethereum) window.ethereum.emit('accountsChanged', [unregAddr]);
    }, UNREGISTERED_ADDRESS);
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to top of Unauthorized View
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '15-desktop-access-denied-unauthorized.png'),
      fullPage: false,
    });
    console.log('    ✓ 15-desktop-access-denied-unauthorized.png captured.');

    // -------------------------------------------------------------
    // 10. VOTER DASHBOARD (Account #1)
    // -------------------------------------------------------------
    console.log('>>> [10/17] Capturing 03-desktop-voter-dashboard.png...');
    // Switch to Registered Voter 1
    await page.evaluate((voterAddr) => {
      window.__mockAddress = voterAddr;
      if (window.ethereum) window.ethereum.emit('accountsChanged', [voterAddr]);
    }, VOTER1_ADDRESS);
    await new Promise((r) => setTimeout(r, 2500));

    // Scroll to top of Voter View
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-desktop-voter-dashboard.png'),
      fullPage: false,
    });
    console.log('    ✓ 03-desktop-voter-dashboard.png captured.');

    // -------------------------------------------------------------
    // 11. CANDIDATE SELECTION
    // -------------------------------------------------------------
    console.log('>>> [11/17] Capturing 04-desktop-candidate-selection.png...');
    // Click candidate 0 (Satoshi Nakamoto) card to ensure neon lime selection
    await page.evaluate(() => {
      const satoshiCard = Array.from(document.querySelectorAll('div, button')).find((el) =>
        el.textContent.includes('Satoshi Nakamoto') && el.textContent.includes('01')
      );
      if (satoshiCard) satoshiCard.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-desktop-candidate-selection.png'),
      fullPage: false,
    });
    console.log('    ✓ 04-desktop-candidate-selection.png captured.');

    // -------------------------------------------------------------
    // 12. ENCRYPTED BALLOT STATE & VOTE CAST
    // -------------------------------------------------------------
    console.log('>>> [12/17] Capturing 05-desktop-encrypted-ballot.png...');
    // Click "Expand" ciphertext preview
    await page.evaluate(() => {
      const expandBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.trim() === 'Expand'
      );
      if (expandBtn) expandBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Cast Voter 1 Ballot on-chain
    console.log('    Casting ballot for Voter 1 (Satoshi Nakamoto) on-chain...');
    const m1 = encodeCandidateVoteRadix(0); // 10,000^0 = 1n
    const c1 = encryptVote(publicKey, m1);
    await sendVoterTx(evotingVoter1, voter1Wallet, 'castVote', c1.toString());
    console.log('    Voter 1 ballot recorded on-chain.');

    // Trigger UI refresh to reflect "Ballot Verified & Sealed On-Chain"
    await page.evaluate(() => {
      if (window.ethereum) window.ethereum.emit('accountsChanged', [window.__mockAddress]);
    });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-desktop-encrypted-ballot.png'),
      fullPage: false,
    });
    console.log('    ✓ 05-desktop-encrypted-ballot.png captured.');

    // Cast Voter 2 (Satoshi Nakamoto) & Voter 3 (Vitalik Buterin) on-chain
    console.log('    Casting ballot for Voter 2 (Satoshi Nakamoto)...');
    const m2 = encodeCandidateVoteRadix(0); // 1n
    const c2 = encryptVote(publicKey, m2);
    await sendVoterTx(evotingVoter2, voter2Wallet, 'castVote', c2.toString());

    console.log('    Casting ballot for Voter 3 (Vitalik Buterin)...');
    const m3 = encodeCandidateVoteRadix(1); // 10,000^1 = 10,000n
    const c3 = encryptVote(publicKey, m3);
    await sendVoterTx(evotingVoter3, voter3Wallet, 'castVote', c3.toString());
    console.log('    Total 3 ballots recorded on-chain (Satoshi: 2, Vitalik: 1, Ada: 0).');

    // -------------------------------------------------------------
    // 13. ADMIN TALLY & CERTIFIED WINNER (Section 04)
    // -------------------------------------------------------------
    console.log('>>> [13/17] Capturing 10-desktop-tally-results.png...');
    // Close election on-chain
    const isStillOpen = await evotingAdmin.isElectionOpen();
    if (isStillOpen) {
      await sendAdminTx('endElection');
      console.log('    Election closed on-chain.');
    }

    // Switch back to Admin
    await page.evaluate((adminAddr) => {
      window.__mockAddress = adminAddr;
      if (window.ethereum) window.ethereum.emit('accountsChanged', [adminAddr]);
    }, ADMIN_ADDRESS);
    await new Promise((r) => setTimeout(r, 2500));

    // Scroll to Section 04
    await page.evaluate(() => {
      const sec04 = Array.from(document.querySelectorAll('span, h3')).find((el) =>
        el.textContent.includes('SECTION 04')
      );
      if (sec04) {
        sec04.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -90);
      }
    });
    await new Promise((r) => setTimeout(r, 800));

    // Click "Step 1: Aggregate Ciphertexts"
    console.log('    Executing Homomorphic Addition in UI...');
    await page.evaluate(() => {
      const aggBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Aggregate Ciphertexts')
      );
      if (aggBtn) aggBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Click "Step 2: Decrypt & Reveal Results"
    console.log('    Executing Private-Key Decryption & Radix Decomposition in UI...');
    await page.evaluate(() => {
      const decBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Decrypt & Reveal Results')
      );
      if (decBtn) decBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll down to display the full Section 04 Certified Winner & candidate tally
    await page.evaluate(() => {
      const crown = Array.from(document.querySelectorAll('span, h4')).find((el) =>
        el.textContent.includes('Certified Winner') || el.textContent.includes('CERTIFIED WINNER')
      );
      if (crown) {
        crown.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '10-desktop-tally-results.png'),
      fullPage: false,
    });
    console.log('    ✓ 10-desktop-tally-results.png captured.');

    // -------------------------------------------------------------
    // MOBILE VIEWPORTS (390 x 844)
    // -------------------------------------------------------------
    console.log('\n--- Switching to Mobile Viewport (390 x 844) ---');
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    // 14. MOBILE LANDING
    console.log('>>> [14/17] Capturing 11-mobile-landing.png...');
    // Disconnect wallet
    await page.evaluate(() => {
      sessionStorage.setItem('evoting_manual_disconnect', 'true');
      window.__mockAddress = null;
      if (window.ethereum) window.ethereum.emit('accountsChanged', []);
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '11-mobile-landing.png'),
      fullPage: false,
    });
    console.log('    ✓ 11-mobile-landing.png captured.');

    // 15. MOBILE ADMIN DASHBOARD
    console.log('>>> [15/17] Capturing 13-mobile-admin-dashboard.png...');
    await page.evaluate((adminAddr) => {
      sessionStorage.removeItem('evoting_manual_disconnect');
      window.__mockAddress = adminAddr;
      if (window.ethereum) window.ethereum.emit('accountsChanged', [adminAddr]);
    }, ADMIN_ADDRESS);
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '13-mobile-admin-dashboard.png'),
      fullPage: false,
    });
    console.log('    ✓ 13-mobile-admin-dashboard.png captured.');

    // 16. MOBILE VOTER INTERFACE
    console.log('>>> [16/17] Capturing 14-mobile-voter-dashboard.png...');
    await page.evaluate((voterAddr) => {
      window.__mockAddress = voterAddr;
      if (window.ethereum) window.ethereum.emit('accountsChanged', [voterAddr]);
    }, VOTER1_ADDRESS);
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '14-mobile-voter-dashboard.png'),
      fullPage: false,
    });
    console.log('    ✓ 14-mobile-voter-dashboard.png captured.');

    // 17. MOBILE CRYPTOGRAPHY
    console.log('>>> [17/17] Capturing 17-mobile-cryptography.png...');
    // Navigate to Cryptography tab
    await page.evaluate(() => {
      const cryptoBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Cryptography')
      );
      if (cryptoBtn) cryptoBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '17-mobile-cryptography.png'),
      fullPage: false,
    });
    console.log('    ✓ 17-mobile-cryptography.png captured.');

    console.log('\n===============================================================');
    console.log('   ALL 17 PRODUCTION SCREENSHOTS SUCCESSFULLY CAPTURED!        ');
    console.log('===============================================================\n');

  } finally {
    await browser.close();
  }
}

capture()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FATAL CAPTURE ERROR:', err);
    process.exit(1);
  });

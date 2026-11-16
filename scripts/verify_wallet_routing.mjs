/**
 * Automated Verification Script: Wallet-Based Role Routing
 * 
 * Verifies all 10 requirements:
 * 1. Disconnected users see Landing screen + Connect Wallet button.
 * 2. Public Ballot and Admin tabs are hidden when disconnected.
 * 3. Cryptography remains accessible from landing screen.
 * 4. Return to landing from Cryptography works.
 * 5. Administrator wallet connection opens Admin dashboard.
 * 6. Registered voter wallet connection opens Voter dashboard.
 * 7. Unregistered wallet connection receives Access Denied state.
 * 8. Account switching from Admin to Unregistered immediately unmounts Admin view.
 * 9. Disconnect wallet action clears state and returns to landing screen.
 * 10. Zero browser console errors throughout all navigation flows.
 */

import puppeteer from 'puppeteer-core';
import { ethers } from '../frontend/node_modules/ethers/lib.esm/index.js';
import fs from 'fs';

const ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const VOTER_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const UNREGISTERED_ADDRESS = '0x3333333333333333333333333333333333333333';

const HARDHAT_ACC0_PRIVKEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const consoleErrors = [];
const pageErrors = [];

async function runRoutingVerification() {
  console.log('===============================================================');
  console.log('   AUTOMATED VERIFICATION: WALLET-BASED ROLE ROUTING FLOW     ');
  console.log('===============================================================\n');

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
      consoleErrors.push(msg.text());
      console.error(`[Browser Console Error] ${msg.text()}`);
    } else {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
    console.error(`[Browser Page Error] ${err.toString()}`);
  });

  try {
    // ------------------------------------------------------------------
    // TEST 1: Disconnected User Landing Screen
    // ------------------------------------------------------------------
    console.log('>>> [1/7] Testing Disconnected Landing Screen...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Ballot and Admin tabs are NOT in the header navigation
    const navText = await page.evaluate(() => {
      const nav = document.querySelector('header nav');
      return nav ? nav.textContent : '';
    });

    const hasBallotTab = navText.includes('Ballot');
    const hasAdminTab = navText.includes('Admin');
    console.log(`    Header nav contains 'Ballot': ${hasBallotTab} (Expected: false)`);
    console.log(`    Header nav contains 'Admin': ${hasAdminTab} (Expected: false)`);
    console.log(`    Header nav content: "${navText.trim()}"`);

    if (hasBallotTab || hasAdminTab) {
      throw new Error('Public navigation contains Ballot or Admin tabs when disconnected!');
    }

    // Verify prominent "Connect Wallet" button exists
    const hasConnectBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent.includes('Connect Wallet'));
    });
    console.log(`    Prominent 'Connect Wallet' button present: ${hasConnectBtn}`);
    if (!hasConnectBtn) {
      throw new Error('Missing Connect Wallet button on disconnected landing screen');
    }

    // Verify Landing Gateway is visible and Ballot/Admin are hidden
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.textContent : '';
    });
    const hasDemocraticAccess = mainContent.includes('Democratic Access');
    const hasCandidateCards = mainContent.includes('Dr. Aris Thorne') || mainContent.includes('Satoshi Nakamoto');
    console.log(`    Main area shows 'Democratic Access' gateway: ${hasDemocraticAccess}`);
    console.log(`    Main area prematurely exposes candidate cards: ${hasCandidateCards} (Expected: false)`);

    if (!hasDemocraticAccess || hasCandidateCards) {
      throw new Error('Landing screen failed: either missing Gateway or prematurely exposing ballot');
    }
    console.log('    Disconnected Landing Screen: PASS\n');

    // ------------------------------------------------------------------
    // TEST 2: Explore Cryptography from Disconnected State
    // ------------------------------------------------------------------
    console.log('>>> [2/7] Testing Independent Cryptography Page Access...');
    await page.evaluate(() => {
      const cryptoBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Cryptography')
      );
      if (cryptoBtn) cryptoBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const cryptoContent = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.textContent : '';
    });
    const hasMathTitle = cryptoContent.includes('The Mathematics of Secrecy');
    const has3Pillars = cryptoContent.includes('Probabilistic Semantic Secrecy') && cryptoContent.includes('Radix Base-10,000 Encoding');
    console.log(`    Cryptography Lab loaded: ${hasMathTitle && has3Pillars}`);

    if (!hasMathTitle || !has3Pillars) {
      throw new Error('Cryptography page failed to render properly');
    }

    // Return to Landing
    await page.evaluate(() => {
      const returnBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Return to Landing') || b.textContent.includes('Home')
      );
      if (returnBtn) returnBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const returnedToLanding = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.textContent.includes('Democratic Access') : false;
    });
    console.log(`    Returned to Landing screen cleanly: ${returnedToLanding}`);
    if (!returnedToLanding) {
      throw new Error('Return to landing from Cryptography failed');
    }
    console.log('    Cryptography Navigation: PASS\n');

    // ------------------------------------------------------------------
    // TEST 3: Mock MetaMask Injected Provider Helper
    // ------------------------------------------------------------------
    console.log('>>> [3/7] Testing Role-Based Wallet Detection with Mock Provider...');

    // Function to simulate Ethereum provider in the browser context
    async function setMockWallet(accountAddress) {
      await page.evaluate((mockAddress) => {
        // Clear manual disconnect flag
        sessionStorage.removeItem('evoting_manual_disconnect');

        if (window.ethereum && window.ethereum.isMetaMask) {
          window.ethereum.selectedAddress = mockAddress;
          return;
        }

        window.ethereum = {
          isMetaMask: true,
          selectedAddress: mockAddress,
          networkVersion: '31337',
          chainId: '0x7a69', // 31337 in hex
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
              const current = window.ethereum ? window.ethereum.selectedAddress : mockAddress;
              return current ? [current] : [];
            }
            if (method === 'eth_chainId') {
              return '0x7a69';
            }
            if (method === 'wallet_switchEthereumChain') {
              return null;
            }
            // Delegate all RPC calls (eth_call, eth_blockNumber, etc.) directly to Hardhat node
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
      }, accountAddress);
    }

    // ------------------------------------------------------------------
    // TEST 4: Administrator Wallet Detection -> Admin Dashboard
    // ------------------------------------------------------------------
    console.log('>>> [4/7] Testing Administrator Wallet Connection (Account #0)...');
    await setMockWallet(ADMIN_ADDRESS);

    // Click "Connect Wallet"
    await page.evaluate(() => {
      const connectBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Connect Wallet') || b.textContent.includes('Connect')
      );
      if (connectBtn) connectBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Check if Admin Dashboard is rendered
    const adminDashboardRendered = await page.evaluate(() => {
      const text = document.body.textContent;
      const hasAdminTitle = text.includes('Election Administration') || text.includes('ADMINISTRATOR ENGINE') || text.includes('Election Lifecycle');
      const hasKeygen = text.includes('Paillier Encryption Parameters') || text.includes('SECTION 02');
      const hasVoterWhitelisting = text.includes('Voter Access & Whitelist') || text.includes('Single Address Registration');
      return hasAdminTitle && hasKeygen && hasVoterWhitelisting;
    });

    const navbarRole = await page.evaluate(() => {
      const nav = document.querySelector('header');
      return nav ? nav.textContent : '';
    });
    const showsAdminBadge = navbarRole.includes('Admin') || navbarRole.includes('ADMIN');
    const showsBallotOption = navbarRole.includes('Voter Ballot');

    console.log(`    Admin Dashboard rendered: ${adminDashboardRendered}`);
    console.log(`    Navbar displays Admin role badge: ${showsAdminBadge}`);
    console.log(`    Navbar conceals Voter Ballot tab: ${!showsBallotOption}`);

    if (!adminDashboardRendered || !showsAdminBadge || showsBallotOption) {
      throw new Error('Admin role routing failed: Admin dashboard not shown or permissions leaked');
    }
    console.log('    Administrator Role Routing: PASS\n');

    // ------------------------------------------------------------------
    // TEST 5: Account Switching from Admin to Unregistered -> Immediate Access Denied
    // ------------------------------------------------------------------
    console.log('>>> [5/7] Testing MetaMask Account Switch to Unregistered Wallet...');
    await page.evaluate((unregAddr) => {
      window.ethereum.selectedAddress = unregAddr;
      window.ethereum.emit('accountsChanged', [unregAddr]);
    }, UNREGISTERED_ADDRESS);
    await new Promise((r) => setTimeout(r, 2000));

    const accessDeniedShown = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Wallet Not Whitelisted') || text.includes('ACCESS RESTRICTED');
    });

    const adminStillVisible = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Paillier Encryption Parameters') && text.includes('Election Administration');
    });

    console.log(`    Access Denied screen triggered: ${accessDeniedShown}`);
    console.log(`    Admin console cleanly unmounted: ${!adminStillVisible}`);

    if (!accessDeniedShown || adminStillVisible) {
      throw new Error('Security failure: Admin dashboard remained visible after account switch!');
    }
    console.log('    Account Switching & Access Denied: PASS\n');

    // ------------------------------------------------------------------
    // TEST 6: Registered Voter Wallet Connection -> Voter Dashboard
    // ------------------------------------------------------------------
    console.log('>>> [6/7] Testing Registered Voter Wallet Connection (Account #1)...');
    
    // Ensure Voter Address is whitelisted on the smart contract
    const contractArtifact = JSON.parse(
      fs.readFileSync('frontend/src/contracts/EVoting.json', 'utf8')
    );
    const rpcProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const adminSigner = new ethers.Wallet(HARDHAT_ACC0_PRIVKEY, rpcProvider);
    const evotingContract = new ethers.Contract(contractArtifact.address, contractArtifact.abi, adminSigner);
    const [isVoterWhitelisted] = await evotingContract.getVoterStatus(VOTER_ADDRESS);
    if (!isVoterWhitelisted) {
      console.log('    Whitelisting Account #1 on-chain for voter role test...');
      const tx = await evotingContract.addVoter(VOTER_ADDRESS);
      await tx.wait();
    }

    await page.evaluate(async (voterAddr) => {
      // Switch mock address
      window.ethereum.selectedAddress = voterAddr;
      window.ethereum.emit('accountsChanged', [voterAddr]);
    }, VOTER_ADDRESS);
    await new Promise((r) => setTimeout(r, 2000));

    const voterDashboardRendered = await page.evaluate(() => {
      const text = document.body.textContent;
      const hasBallot = text.includes('Elect Your Representative') || text.includes('OFFICIAL BALLOT') || text.includes('Candidate');
      const hasCandidates = text.includes('Satoshi Nakamoto') || text.includes('Vitalik Buterin');
      return hasBallot && hasCandidates;
    });

    const voterNav = await page.evaluate(() => {
      const nav = document.querySelector('header');
      return nav ? nav.textContent : '';
    });
    const showsVoterBadge = voterNav.includes('Voter') || voterNav.includes('VOTER');
    const showsAdminNav = voterNav.includes('Admin Console');

    console.log(`    Voter Dashboard rendered: ${voterDashboardRendered}`);
    console.log(`    Navbar displays Voter role badge: ${showsVoterBadge}`);
    console.log(`    Navbar conceals Admin Console: ${!showsAdminNav}`);

    if (!voterDashboardRendered || !showsVoterBadge || showsAdminNav) {
      throw new Error('Voter role routing failed: Voter dashboard not shown or Admin leaked');
    }
    console.log('    Registered Voter Role Routing: PASS\n');

    // ------------------------------------------------------------------
    // TEST 7: Disconnect Wallet Action
    // ------------------------------------------------------------------
    console.log('>>> [7/7] Testing Disconnect Wallet Action...');
    await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const disconnectBtn = allBtns.find((b) =>
        b.textContent.includes('Disconnect') || b.getAttribute('title')?.includes('Disconnect')
      );
      if (disconnectBtn) disconnectBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    const backOnLanding = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.textContent.includes('Democratic Access') : false;
    });
    const connectButtonBack = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent.includes('Connect Wallet'));
    });

    console.log(`    Returned to Landing Gateway: ${backOnLanding}`);
    console.log(`    'Connect Wallet' button restored: ${connectButtonBack}`);

    if (!backOnLanding || !connectButtonBack) {
      throw new Error('Disconnect wallet failed to return to clean landing state');
    }
    console.log('    Disconnect Wallet: PASS\n');

    console.log('---------------------------------------------------------------');
    console.log(`Browser Console Errors: ${consoleErrors.length}`);
    console.log(`Browser Page Errors:    ${pageErrors.length}`);
    console.log('---------------------------------------------------------------');

    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      throw new Error(`Found ${consoleErrors.length} console errors and ${pageErrors.length} page errors`);
    }

    console.log('\n===============================================================');
    console.log('   ALL 7 ROLE-ROUTING VERIFICATION CHECKS PASSED (100%)       ');
    console.log('===============================================================\n');

  } finally {
    await browser.close();
  }
}

runRoutingVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FATAL VERIFICATION ERROR:', err);
    process.exit(1);
  });

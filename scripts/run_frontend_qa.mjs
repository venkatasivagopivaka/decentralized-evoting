import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('frontend-qa/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const consoleLogs = [];
const consoleErrors = [];
const pageErrors = [];

async function runQA() {
  console.log('🚀 Starting Full Browser QA on http://localhost:5173 ...');

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

  // Monitor console & runtime errors
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`[Browser Console Error] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
    console.error(`[Browser Page Error] ${err.toString()}`);
  });

  try {
    // ==========================================
    // 1. DESKTOP VIEWPORT (1440 x 900)
    // ==========================================
    console.log('\n--- 1. Desktop Visual QA (1440 x 900) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Screenshot 1: Desktop Landing Page
    const shot1 = path.join(SCREENSHOT_DIR, '01-desktop-main-landing.png');
    await page.screenshot({ path: shot1, fullPage: false });
    console.log(`✓ Captured: ${shot1}`);

    // Screenshot 2: Voter Interface
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Ballot') || b.textContent.includes('Vote')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot2 = path.join(SCREENSHOT_DIR, '02-desktop-voter-interface.png');
    await page.screenshot({ path: shot2, fullPage: false });
    console.log(`✓ Captured: ${shot2}`);

    // Screenshot 3: Candidate Selection
    await page.evaluate(() => {
      const candidateCard = Array.from(document.querySelectorAll('div, button')).find((c) =>
        c.textContent.includes('Satoshi Nakamoto') && c.textContent.includes('01')
      );
      if (candidateCard) candidateCard.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    const shot3 = path.join(SCREENSHOT_DIR, '03-desktop-candidate-selection.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log(`✓ Captured: ${shot3}`);

    // Screenshot 4: Ballot Ciphertext Inspection
    await page.evaluate(() => {
      const expandBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.trim() === 'Expand'
      );
      if (expandBtn) expandBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot4 = path.join(SCREENSHOT_DIR, '04-desktop-ballot-ciphertext-expanded.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log(`✓ Captured: ${shot4}`);

    // Screenshot 5: Admin Dashboard (Section 01 & 02)
    await page.evaluate(() => {
      const adminBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Admin')
      );
      if (adminBtn) adminBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shot5 = path.join(SCREENSHOT_DIR, '05-desktop-admin-dashboard.png');
    await page.screenshot({ path: shot5, fullPage: false });
    console.log(`✓ Captured: ${shot5}`);

    // Screenshot 6: Voter Verification Tool in Section 03
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3, h4')).find((h) =>
        h.textContent.includes('Voter Access') || h.textContent.includes('Live On-Chain Voter')
      );
      if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const presetBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Acct #1')
      );
      if (presetBtn) presetBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shot6 = path.join(SCREENSHOT_DIR, '06-desktop-admin-voter-verification.png');
    await page.screenshot({ path: shot6, fullPage: false });
    console.log(`✓ Captured: ${shot6}`);

    // Screenshot 7: Admin Tally & Outcome (Section 04)
    await page.evaluate(() => {
      const tallyHeading = Array.from(document.querySelectorAll('h3')).find((h) =>
        h.textContent.includes('Homomorphic Tally')
      );
      if (tallyHeading) tallyHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot7 = path.join(SCREENSHOT_DIR, '07-desktop-admin-tally-results.png');
    await page.screenshot({ path: shot7, fullPage: false });
    console.log(`✓ Captured: ${shot7}`);

    // Screenshot 8: Cryptography Interface (Pillars & Proofs)
    await page.evaluate(() => {
      const cryptoBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Cryptography')
      );
      if (cryptoBtn) cryptoBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shot8 = path.join(SCREENSHOT_DIR, '08-desktop-cryptography-interface.png');
    await page.screenshot({ path: shot8, fullPage: false });
    console.log(`✓ Captured: ${shot8}`);

    // Screenshot 9: Cryptography Sandbox Simulation & Radix Decomposition
    await page.evaluate(() => {
      const sandbox = Array.from(document.querySelectorAll('h3')).find((h) =>
        h.textContent.includes('Interactive Homomorphic Sandbox')
      );
      if (sandbox) sandbox.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const presetBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Multi-Candidate Radix')
      );
      if (presetBtn) presetBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    const shot9 = path.join(SCREENSHOT_DIR, '09-desktop-crypto-sandbox-simulation.png');
    await page.screenshot({ path: shot9, fullPage: false });
    console.log(`✓ Captured: ${shot9}`);

    // ==========================================
    // 2. MOBILE VIEWPORT (390 x 844)
    // ==========================================
    console.log('\n--- 2. Mobile Visual QA (390 x 844) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Screenshot 10: Mobile Landing Page
    const shot10 = path.join(SCREENSHOT_DIR, '10-mobile-landing.png');
    await page.screenshot({ path: shot10, fullPage: false });
    console.log(`✓ Captured: ${shot10}`);

    // Screenshot 11: Mobile Voter Interface & Candidates
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Ballot') || b.textContent.includes('Vote')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shot11 = path.join(SCREENSHOT_DIR, '11-mobile-voter-interface.png');
    await page.screenshot({ path: shot11, fullPage: false });
    console.log(`✓ Captured: ${shot11}`);

    // Screenshot 12: Mobile Admin Dashboard
    await page.evaluate(() => {
      const adminBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Admin')
      );
      if (adminBtn) adminBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shot12 = path.join(SCREENSHOT_DIR, '12-mobile-admin-dashboard.png');
    await page.screenshot({ path: shot12, fullPage: false });
    console.log(`✓ Captured: ${shot12}`);

    // Screenshot 13: Mobile Cryptography Laboratory
    await page.evaluate(() => {
      const cryptoBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Cryptography')
      );
      if (cryptoBtn) cryptoBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shot13 = path.join(SCREENSHOT_DIR, '13-mobile-crypto-laboratory.png');
    await page.screenshot({ path: shot13, fullPage: false });
    console.log(`✓ Captured: ${shot13}`);

    console.log('\n--- QA Run Complete ---');
    console.log(`Total Console Messages: ${consoleLogs.length}`);
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log(`Total Page Errors: ${pageErrors.length}`);

    const reportData = {
      timestamp: new Date().toISOString(),
      screenshots: [
        shot1, shot2, shot3, shot4, shot5, shot6, shot7, shot8, shot9,
        shot10, shot11, shot12, shot13
      ],
      consoleErrors,
      pageErrors,
    };

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'qa-summary.json'),
      JSON.stringify(reportData, null, 2)
    );

  } catch (error) {
    console.error('QA Runner Exception:', error);
  } finally {
    await browser.close();
  }
}

runQA();

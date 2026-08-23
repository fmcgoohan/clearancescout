import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';

async function waitForServer(url, timeoutMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve(true);
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error(`Timeout waiting for server at ${url}`);
}

async function run() {
  console.log('=== Phase 1 Fresh Session & Token Control Live Verification ===');

  // Start Express Backend on 3001 if needed
  let backendProcess;
  try {
    await waitForServer('http://localhost:3001/api/health', 1000);
    console.log('✔ Express backend server already running on port 3001');
  } catch {
    console.log('Starting Express backend server on port 3001...');
    backendProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      env: { ...process.env, PORT: '3001', EXECUTION_MODE: 'DEMO_MODE' },
      stdio: 'pipe',
    });
    await waitForServer('http://localhost:3001/api/health', 15000);
    console.log('✔ Express backend server started on port 3001');
  }

  // Ensure Vite Dev Server on 5173 is accessible
  await waitForServer('http://localhost:5173', 10000);
  console.log('✔ Vite frontend server accessible at http://localhost:5173');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Fully clear all storage/cookies/cache for a genuinely fresh real browser session
    console.log('\n--- Step 1: Fresh Real Session Hard Reload ---');
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    // Verify workspace loaded automatically on fresh load
    await page.waitForSelector('.readiness-band, .entity-table, .glass-panel', { timeout: 10000 });
    console.log('✔ Workspace loaded cleanly on fresh startup without hanging');

    // Step 2: Test Demo Access Token Modal Visibility & Autofocus
    console.log('\n--- Step 2: Demo Token Modal Open, Styling & Autofocus ---');
    const tokenButton = page.locator('#demo-token-button');
    await tokenButton.click();

    await page.waitForSelector('#demo-token-input-field', { state: 'visible', timeout: 5000 });

    // Verify modal computed styles
    const modalStyle = await page.evaluate(() => {
      const modal = document.querySelector('.glass-panel.modal-responsive');
      if (!modal) return null;
      const computed = window.getComputedStyle(modal);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        border: computed.border,
        display: computed.display,
        visibility: computed.visibility,
      };
    });
    console.log('Modal computed styles:', modalStyle);
    if (!modalStyle || modalStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || modalStyle.visibility !== 'visible') {
      throw new Error('FAILED: Modal panel rendered invisible or missing solid background');
    }
    console.log('✔ Modal surface rendered fully opaque with solid background');

    // Verify autofocus
    const activeId = await page.evaluate(() => document.activeElement?.id);
    console.log('Active element ID on modal open:', activeId);
    if (activeId !== 'demo-token-input-field') {
      throw new Error(`FAILED: Autofocus expected #demo-token-input-field, got #${activeId}`);
    }
    console.log('✔ Autofocus correctly landed on #demo-token-input-field');

    // Step 3: Test Escape Key Dismissal & Focus Restoration
    console.log('\n--- Step 3: Keyboard Escape Dismissal & Focus Restoration ---');
    await page.keyboard.press('Escape');

    await page.waitForSelector('#demo-token-input-field', { state: 'detached', timeout: 5000 });
    const isRootHiddenAfterEscape = await page.evaluate(() => document.getElementById('root')?.getAttribute('aria-hidden'));
    console.log('Root aria-hidden after Escape dismissal:', isRootHiddenAfterEscape);
    if (isRootHiddenAfterEscape === 'true') {
      throw new Error('FAILED: #root left aria-hidden="true" after modal dismissal');
    }

    const restoredFocusId = await page.evaluate(() => document.activeElement?.id);
    console.log('Restored focus element ID:', restoredFocusId);
    if (restoredFocusId !== 'demo-token-button') {
      console.warn(`Note: Restored focus on #${restoredFocusId}`);
    }
    console.log('✔ Escape key cleanly dismissed DemoTokenModal and restored non-inert workspace');

    // Step 4: Test Cancel Button Dismissal
    console.log('\n--- Step 4: Cancel Button Dismissal ---');
    await tokenButton.click();
    await page.waitForSelector('#demo-token-input-field', { state: 'visible' });
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('#demo-token-input-field', { state: 'detached', timeout: 5000 });
    console.log('✔ Cancel button cleanly dismissed DemoTokenModal');

    // Step 5: Test Close (✕) Button Dismissal
    console.log('\n--- Step 5: Close (✕) Button Dismissal ---');
    await tokenButton.click();
    await page.waitForSelector('#demo-token-input-field', { state: 'visible' });
    await page.click('button[aria-label="Close Demo Access Token dialog"]');
    await page.waitForSelector('#demo-token-input-field', { state: 'detached', timeout: 5000 });
    console.log('✔ Close (✕) button cleanly dismissed DemoTokenModal');

    // Step 6: Test Token Saving & Form Submit
    console.log('\n--- Step 6: Token Configuration & Saving ---');
    await tokenButton.click();
    await page.waitForSelector('#demo-token-input-field', { state: 'visible' });
    await page.fill('#demo-token-input-field', 'test-pass-2026');
    await page.click('button[type="submit"]:has-text("Save Token")');
    await page.waitForSelector('#demo-token-input-field', { state: 'detached', timeout: 5000 });

    const storedToken = await page.evaluate(() => localStorage.getItem('clearancescout_demo_token'));
    console.log('Stored token in localStorage:', storedToken);
    if (storedToken !== 'test-pass-2026') {
      throw new Error(`FAILED: Expected stored token "test-pass-2026", got "${storedToken}"`);
    }
    console.log('✔ Token saved successfully and stored in localStorage');

    // Step 7: Test Token Clearing
    console.log('\n--- Step 7: Token Clearing ---');
    await tokenButton.click();
    await page.waitForSelector('#demo-token-input-field', { state: 'visible' });
    await page.click('button:has-text("Clear Token")');
    await page.waitForSelector('#demo-token-input-field', { state: 'detached', timeout: 5000 });

    const clearedToken = await page.evaluate(() => localStorage.getItem('clearancescout_demo_token'));
    console.log('Cleared token in localStorage:', clearedToken);
    if (clearedToken !== null) {
      throw new Error(`FAILED: Expected null token after clear, got "${clearedToken}"`);
    }
    console.log('✔ Token cleared cleanly from localStorage');

    console.log('\n🎉 ALL LIVE FRESH-SESSION VERIFICATION CHECKS PASSED PERFECTLY!');
  } finally {
    await browser.close();
    if (backendProcess) {
      backendProcess.kill();
    }
  }
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});

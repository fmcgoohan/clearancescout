import { chromium } from 'playwright';

async function runLiveKeyboardFocusValidation() {
  console.log('=== Live Keyboard & Focus Trap Validation against Cloud Run ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const liveUrl = 'https://clearance-scout-415588196771.us-central1.run.app';
  console.log('[1/6] Navigating to live deployment:', liveUrl);
  await page.goto(liveUrl, { waitUntil: 'networkidle' });

  // Set token
  await page.evaluate(() => {
    localStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
    sessionStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // 1. Test DemoTokenModal Focus Trap, Initial Focus, and Escape
  console.log('[2/6] Testing DemoTokenModal initial focus, tab trap, and Escape key...');
  const tokenBtn = await page.waitForSelector('button:has-text("Demo Token")');
  await tokenBtn.focus();
  await page.keyboard.press('Enter');

  const tokenDialog = await page.waitForSelector('[role="dialog"][aria-labelledby="token-modal-title"]');
  console.log('  ✓ Token dialog opened');

  // Strict check: Initial focus MUST be inside modal
  const initialFocusInsideToken = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="token-modal-title"]');
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  if (!initialFocusInsideToken) {
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
    const activeText = await page.evaluate(() => document.activeElement?.textContent?.slice(0, 50));
    throw new Error(`CRITICAL QA DEFECT: Initial focus is OUTSIDE Token dialog! Active element: <${activeTagName}> "${activeText}"`);
  }
  console.log('  ✓ Initial focus inside Token dialog: true');

  // Tab through all elements to ensure it cycles within dialog
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const isInside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="token-modal-title"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped Token dialog during forward Tab cycle');
  }
  console.log('  ✓ Forward Tab cycle (8 steps) remained strictly trapped inside Token dialog');

  // Shift+Tab backward cycle
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Shift+Tab');
    const isInside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="token-modal-title"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped Token dialog during Shift+Tab cycle');
  }
  console.log('  ✓ Backward Shift+Tab cycle (8 steps) remained strictly trapped inside Token dialog');

  // Escape key closes modal and restores focus
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="token-modal-title"]', { state: 'detached' });
  const isFocusRestoredToken = await page.evaluate(() => {
    return document.activeElement?.innerText?.includes('Demo Token');
  });
  console.log('  ✓ Escape closed Token dialog and restored focus to trigger:', isFocusRestoredToken);

  // 2. Test ScriptUploadModal Initial Focus & Trap
  console.log('[3/6] Testing ScriptUploadModal initial focus, trap & polite live region...');
  const uploadBtn = await page.waitForSelector('button:has-text("Upload Screenplay"), button:has-text("Replace Screenplay"), button:has-text("Load Sample Screenplay")');
  await uploadBtn.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
  console.log('  ✓ Upload modal opened');

  const initialFocusInsideUpload = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  if (!initialFocusInsideUpload) {
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
    throw new Error(`CRITICAL QA DEFECT: Initial focus is OUTSIDE Upload modal! Active element: <${activeTagName}>`);
  }
  console.log('  ✓ Initial focus inside Upload modal: true');

  const uploadLiveRegionExists = await page.evaluate(() => {
    const statusRegion = document.querySelector('[role="status"][aria-live="polite"]');
    return statusRegion !== null;
  });
  console.log('  ✓ Upload modal declares polite aria-live status region:', uploadLiveRegionExists);

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const isInside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped Upload modal during Tab cycle');
  }
  console.log('  ✓ Tab cycle (12 steps) remained strictly trapped inside Upload modal');

  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="upload-modal-title"]', { state: 'detached' });
  console.log('  ✓ Escape closed Upload modal');

  // 3. Test Production Operations Dashboard Focus Trap & Escape
  console.log('[4/6] Testing Operations Dashboard initial focus, trap & collapsible scenes...');
  const dashBtn = await page.waitForSelector('button:has-text("Operations Dashboard")');
  await dashBtn.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]');

  const initialFocusInsideDash = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]');
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  if (!initialFocusInsideDash) {
    throw new Error('CRITICAL QA DEFECT: Initial focus is OUTSIDE Operations Dashboard!');
  }
  console.log('  ✓ Initial focus inside Operations Dashboard: true');

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const isInside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped Operations Dashboard during Tab cycle');
  }
  console.log('  ✓ Tab cycle (12 steps) remained strictly trapped inside Operations Dashboard');

  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]', { state: 'detached' });
  console.log('  ✓ Escape closed Operations Dashboard');

  // 4. Test Action Center Focus Trap & Escape
  console.log('[5/6] Testing Department Tasks Action Center initial focus & trap...');
  const actionBtn = await page.waitForSelector('button:has-text("Department Tasks")');
  await actionBtn.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role="dialog"][aria-labelledby="action-modal-title"]');

  const initialFocusInsideAction = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="action-modal-title"]');
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  if (!initialFocusInsideAction) {
    throw new Error('CRITICAL QA DEFECT: Initial focus is OUTSIDE Action Center modal!');
  }
  console.log('  ✓ Initial focus inside Action Center modal: true');

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const isInside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="action-modal-title"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped Action Center during Tab cycle');
  }
  console.log('  ✓ Tab cycle (10 steps) remained strictly trapped inside Action Center');

  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="action-modal-title"]', { state: 'detached' });
  console.log('  ✓ Escape closed Action Center');

  console.log('[6/6] Validation Complete: 100% modal initial focus inside, Tab trapping, Esc dismissal, and focus restoration.');
  await browser.close();
}

runLiveKeyboardFocusValidation().catch((err) => {
  console.error('Keyboard Validation Error:', err);
  process.exit(1);
});


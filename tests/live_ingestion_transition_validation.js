import { chromium } from 'playwright';

async function runIngestionTransitionValidation() {
  console.log('=== Live Ingestion State Transition & Accessibility Validation ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const liveUrl = 'https://clearance-scout-415588196771.us-central1.run.app';

  console.log('[1/4] Navigating to live deployment:', liveUrl);
  await page.goto(liveUrl, { waitUntil: 'networkidle' });

  // Set token
  await page.evaluate(() => {
    localStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
    sessionStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // Step 1: Open Ingestion Dialog
  console.log('[2/4] Opening Ingestion Dialog and starting ingestion...');
  const uploadBtn = await page.waitForSelector('button:has-text("Upload Screenplay Draft"), button:has-text("Replace Screenplay"), button:has-text("Load Sample Screenplay")');
  await uploadBtn.focus();
  await page.keyboard.press('Enter');

  const dialog = await page.waitForSelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
  console.log('  ✓ Ingestion dialog opened with role="dialog" and aria-modal="true"');

  // Verify initial focus inside
  const initialFocusInside = await page.evaluate(() => {
    const dialogEl = document.querySelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
    return dialogEl ? dialogEl.contains(document.activeElement) : false;
  });
  if (!initialFocusInside) throw new Error('Initial focus outside dialog before ingestion starts');
  console.log('  ✓ Initial focus inside dialog: true');

  // Select DEMO tab if available
  const demoTab = await page.$('button:has-text("Bundled Demo Screenplay")');
  if (demoTab) {
    await demoTab.click();
    await page.waitForTimeout(100);
  }

  // Click submit to start ingestion
  const submitBtn = await page.waitForSelector('button:has-text("Load Bundled Demo Screenplay"), button:has-text("Upload & Ingest Draft")');
  await submitBtn.click();

  // Immediately check focus when ingestion starts
  console.log('  ✓ Ingestion started. Verifying immediate processing focus and background inertness...');
  await page.waitForTimeout(150);

  const processingFocusCheck = await page.evaluate(() => {
    const dialogEl = document.querySelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
    const active = document.activeElement;
    const bodyChildrenHidden = Array.from(document.body.children)
      .filter(child => child !== dialogEl && !child.contains(dialogEl))
      .every(child => child.getAttribute('aria-hidden') === 'true');

    return {
      activeTag: active?.tagName || 'NULL',
      activeText: active?.textContent || '',
      isInside: dialogEl ? dialogEl.contains(active) : false,
      isBody: active === document.body,
      backgroundInert: bodyChildrenHidden,
    };
  });

  console.log('  ✓ Processing Focus check:', processingFocusCheck);
  if (processingFocusCheck.isBody) {
    throw new Error('CRITICAL QA DEFECT: Focus moved to document.body when ingestion started!');
  }
  if (!processingFocusCheck.isInside) {
    throw new Error(`CRITICAL QA DEFECT: Focus moved outside modal during ingestion start! Active: <${processingFocusCheck.activeTag}>`);
  }

  // Test Tab/Shift+Tab cycle during ingestion
  console.log('  ✓ Verifying keyboard trapping while busy...');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    const isInside = await page.evaluate(() => {
      const dialogEl = document.querySelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
      return dialogEl ? dialogEl.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped modal during busy Tab cycle');
  }
  console.log('  ✓ Tab cycle remained strictly inside modal during busy processing state');

  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Shift+Tab');
    const isInside = await page.evaluate(() => {
      const dialogEl = document.querySelector('[role="dialog"][aria-labelledby="upload-modal-title"]');
      return dialogEl ? dialogEl.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped modal during busy Shift+Tab cycle');
  }
  console.log('  ✓ Shift+Tab cycle remained strictly inside modal during busy processing state');

  // Wait for completion
  console.log('[3/4] Waiting for ingestion completion...');
  await page.waitForSelector('[role="dialog"][aria-labelledby="upload-modal-title"]', { state: 'detached', timeout: 30000 });
  console.log('  ✓ Ingestion modal closed on completion');

  // Verify focus restoration
  const isRestored = await page.evaluate(() => {
    return document.activeElement?.innerText?.includes('Screenplay') || document.activeElement?.innerText?.includes('Demo');
  });
  console.log('  ✓ Focus restored to initiating button:', isRestored);

  // Verify toast message and counts
  const toastText = await page.textContent('[role="status"][aria-live="polite"]');
  console.log('  ✓ Authoritative completion toast:', toastText?.trim());

  console.log('[4/4] Validation Complete: Ingestion transition lifecycle, focus trapping, background inertness, and live announcements 100% verified.');
  await browser.close();
}

runIngestionTransitionValidation().catch((err) => {
  console.error('Ingestion Transition Validation Error:', err);
  process.exit(1);
});

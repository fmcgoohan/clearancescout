import { chromium } from 'playwright';

async function runLiveValidation() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Log console errors and network requests
  const networkLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[Browser Console ${msg.type().toUpperCase()}]`, msg.text());
    }
  });

  page.on('request', (req) => {
    networkLogs.push({ method: req.method(), url: req.url(), timestamp: new Date().toISOString() });
  });

  console.log('--- Step 1: Navigate to Live Cloud Run Application ---');
  const liveUrl = 'https://clearance-scout-415588196771.us-central1.run.app';
  await page.goto(liveUrl, { waitUntil: 'networkidle' });
  console.log('Loaded:', liveUrl);

  console.log('--- Step 2: Configure Operator Access Token ---');
  // Inject demo token in localStorage before bootstrap
  await page.evaluate(() => {
    localStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
    sessionStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // If token modal is open or needs setting
  const setTokenBtn = await page.$('text=Set Access Token');
  if (setTokenBtn) {
    await setTokenBtn.click();
    await page.fill('input[type="text"]', 'judge-pass-2026');
    await page.click('button:has-text("Save & Authenticate")');
    await page.waitForTimeout(500);
  }

  console.log('--- Step 3: Verify Workspace is Active ---');
  await page.waitForSelector('button:has-text("Load Sample Screenplay")');
  console.log('Workspace is active and ready.');

  console.log('--- Step 4: Ingest Bundled Demo Screenplay (Initial Load) ---');
  const sampleBtn = await page.waitForSelector('button:has-text("Load Sample Screenplay")');
  await sampleBtn.click();

  await page.waitForSelector('[role="dialog"]');
  console.log('Sample Screenplay Modal open. Ingesting demo...');
  const ingestBtn = await page.waitForSelector('[role="dialog"] button:has-text("Load Bundled Demo Screenplay"), [role="dialog"] button:has-text("Ingest Screenplay")');
  await ingestBtn.click();

  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 90000 });
  console.log('Initial demo ingestion complete and modal closed.');

  console.log('--- Step 5: Replace Current Screenplay ---');
  const replaceTriggerBtn = await page.waitForSelector('button:has-text("Upload Screenplay"), button:has-text("Replace Screenplay")');
  await replaceTriggerBtn.click();

  await page.waitForSelector('[role="dialog"]');
  const demoTabBtn = await page.waitForSelector('[role="dialog"] button:has-text("Fictional Demo Screenplay"), [role="dialog"] button:has-text("Demo Screenplay")');
  await demoTabBtn.click();

  const observedStages = new Set();
  const stageWatcher = setInterval(async () => {
    try {
      const dialogText = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog ? dialog.innerText : '';
      });
      if (dialogText.includes('Receiving screenplay')) observedStages.add('UPLOADING');
      if (dialogText.includes('Segmenting scenes')) observedStages.add('PARSING');
      if (dialogText.includes('Identifying candidate')) observedStages.add('EXTRACTING');
      if (dialogText.includes('Persisting active canonical')) observedStages.add('RECONCILING');
      if (dialogText.includes('Syncing project workspace')) observedStages.add('SYNCING');
      if (dialogText.includes('Screenplay ingestion complete') || dialogText.includes('Screenplay replaced successfully')) observedStages.add('COMPLETE');
    } catch {}
  }, 100);

  const startReplaceBtn = await page.waitForSelector('[role="dialog"] button:has-text("Replace Current Screenplay"), [role="dialog"] button:has-text("Load Bundled Demo Screenplay")');
  await startReplaceBtn.click();

  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 90000 });
  clearInterval(stageWatcher);

  console.log('Observed Named Stages during Replace:', Array.from(observedStages));
  if (!observedStages.has('SYNCING')) {
    throw new Error('Assertion Failed: SYNCING progress stage was not observed during screenplay replacement.');
  }

  console.log('--- Step 6: Verify Immediate Truth at Complete (Without opening any modals) ---');
  const snapshotData = await page.evaluate(() => {
    const headerText = document.querySelector('header')?.innerText || '';
    const bodyText = document.body.innerText;
    const tableRows = Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.innerText);
    const toast = document.querySelector('[role="alert"], [aria-live="polite"], .toast')?.innerText || '';
    const deptTasksBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Department Tasks'))?.innerText || '';

    return {
      headerText,
      tableRows,
      toast,
      deptTasksBtn,
      bodyTextSnippet: bodyText.slice(0, 1500),
    };
  });

  console.log('Immediate Toast Message:', snapshotData.toast);
  console.log('Immediate Header Summary:', snapshotData.headerText);
  console.log('Immediate Department Tasks Toolbar Button:', snapshotData.deptTasksBtn);
  console.log('Immediate Entity Registry Table Rows Count:', snapshotData.tableRows.length);
  console.log('Immediate Entity Table Rows Sample:', snapshotData.tableRows.slice(0, 7));

  // Immediate Assertions
  if (!snapshotData.toast.includes('3 scenes processed · 7 entities registered · 7 department tasks created')) {
    throw new Error(`Assertion Failed: Toast message did not match expected counts. Got: "${snapshotData.toast}"`);
  }
  if (snapshotData.tableRows.length !== 7) {
    throw new Error(`Assertion Failed: Expected 7 entity rows in registry, but found ${snapshotData.tableRows.length}`);
  }
  const hasElena = snapshotData.tableRows.some(r => r.includes('Elena Vance'));
  if (!hasElena) {
    throw new Error('Assertion Failed: Elena Vance was not found in active entity registry table.');
  }
  if (!snapshotData.deptTasksBtn.includes('(7)')) {
    throw new Error(`Assertion Failed: Department Tasks button did not show (7). Got: "${snapshotData.deptTasksBtn}"`);
  }

  console.log('--- Step 7: 20-30 Second Idle Stability Check ---');
  console.log('Waiting 25 seconds idle...');
  await page.waitForTimeout(25000);

  const postIdleData = await page.evaluate(() => {
    const headerText = document.querySelector('header')?.innerText || '';
    const tableRows = Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.innerText);
    const deptTasksBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Department Tasks'))?.innerText || '';
    return { headerText, tableRowsCount: tableRows.length, deptTasksBtn };
  });

  console.log('Post-Idle Table Rows Count:', postIdleData.tableRowsCount);
  console.log('Post-Idle Department Tasks Button:', postIdleData.deptTasksBtn);

  if (postIdleData.tableRowsCount !== 7 || !postIdleData.deptTasksBtn.includes('(7)')) {
    throw new Error(`Assertion Failed: Idle drift detected after 25s (Rows: ${postIdleData.tableRowsCount}, Btn: ${postIdleData.deptTasksBtn})`);
  }

  console.log('--- Step 8: Open Action Center (Verify Read-Only & Count Coherence) ---');
  const preActionReqCount = networkLogs.filter(l => l.method !== 'GET').length;
  const actionModalBtn = await page.waitForSelector('button:has-text("Department Tasks")');
  await actionModalBtn.click();
  await page.waitForSelector('[role="dialog"]');

  // Wait for loading to finish and actions to render
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog && !dialog.innerText.includes('Loading action items...');
  }, { timeout: 10000 });

  const actionModalData = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const text = dialog ? dialog.innerText : '';
    const headerBadge = dialog?.querySelector('span')?.innerText || '';
    const actionCards = Array.from(dialog?.querySelectorAll('.action-item, [style*="border-radius"]') || []).map(el => (el as HTMLElement).innerText);
    return { text, headerBadge, actionCardsSample: actionCards.slice(0, 5) };
  });

  console.log('Action Center Loaded Data:', actionModalData.text.slice(0, 300));
  
  // Close Action Center
  await page.locator('[role="dialog"] button[aria-label*="lose" i], [role="dialog"] button:has-text("×"), [role="dialog"] button:has-text("✕")').first().click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10000 });
  await page.waitForTimeout(500);

  const postActionReqCount = networkLogs.filter(l => l.method !== 'GET').length;
  console.log('Non-GET network requests during Action Center inspection (must be 0):', postActionReqCount - preActionReqCount);
  if (postActionReqCount - preActionReqCount !== 0) {
    throw new Error(`Assertion Failed: Mutating requests detected on Action Center open: ${postActionReqCount - preActionReqCount}`);
  }

  console.log('--- Step 9: Open Operations Dashboard (Verify Read-Only & KPI Rendering) ---');
  const preDashReqCount = networkLogs.filter(l => l.method !== 'GET').length;
  const dashBtn = await page.waitForSelector('button:has-text("Operations Dashboard")');
  await dashBtn.click();
  await page.waitForSelector('[role="dialog"]');

  // Wait for dashboard data to load
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog && !dialog.innerText.includes('Loading dashboard...');
  }, { timeout: 10000 });

  const dashDialogText = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText || '');
  console.log('Operations Dashboard Loaded Content Snippet:', dashDialogText.slice(0, 400));

  // Close Dashboard
  await page.locator('[role="dialog"] button[aria-label*="lose" i], [role="dialog"] button:has-text("×"), [role="dialog"] button:has-text("✕")').first().click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10000 });
  await page.waitForTimeout(500);

  const postDashReqCount = networkLogs.filter(l => l.method !== 'GET').length;
  console.log('Non-GET network requests during Dashboard inspection (must be 0):', postDashReqCount - preDashReqCount);
  if (postDashReqCount - preDashReqCount !== 0) {
    throw new Error(`Assertion Failed: Mutating requests detected on Dashboard open: ${postDashReqCount - preDashReqCount}`);
  }

  console.log('--- Step 9.5: Open Observable Action Timeline (Verify Read-Only) ---');
  const preTimeReqCount = networkLogs.filter(l => l.method !== 'GET').length;
  const timeBtn = await page.waitForSelector('button:has-text("Observable Timeline")');
  await timeBtn.click();
  await page.waitForSelector('[role="region"][aria-label*="Observable Action Timeline"]');
  const timelineText = await page.evaluate(() => document.querySelector('[role="region"][aria-label*="Observable Action Timeline"]')?.innerText || '');
  console.log('Observable Timeline Opened. Content Snippet:', timelineText.slice(0, 300));

  // Close Timeline
  await page.click('[role="region"][aria-label*="Observable Action Timeline"] button:has-text("Close")');
  await page.waitForSelector('[role="region"][aria-label*="Observable Action Timeline"]', { state: 'detached', timeout: 10000 });
  await page.waitForTimeout(500);

  const postTimeReqCount = networkLogs.filter(l => l.method !== 'GET').length;
  console.log('Non-GET network requests during Timeline inspection (must be 0):', postTimeReqCount - preTimeReqCount);
  if (postTimeReqCount - preTimeReqCount !== 0) {
    throw new Error(`Assertion Failed: Mutating requests detected on Timeline open: ${postTimeReqCount - preTimeReqCount}`);
  }

  console.log('--- Step 10: Reload Browser & Verify Persistence ---');
  await page.reload({ waitUntil: 'networkidle' });
  const postReloadData = await page.evaluate(() => {
    const headerText = document.querySelector('header')?.innerText || '';
    const tableRows = Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.innerText);
    const deptTasksBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Department Tasks'))?.innerText || '';
    return { headerText, tableRowsCount: tableRows.length, tableRows, deptTasksBtn };
  });

  console.log('Post-Reload Header:', postReloadData.headerText);
  console.log('Post-Reload Table Rows Count (must be 7):', postReloadData.tableRowsCount);
  console.log('Post-Reload Department Tasks Button:', postReloadData.deptTasksBtn);
  console.log('Post-Reload Table Rows Sample:', postReloadData.tableRows.slice(0, 7));

  if (postReloadData.tableRowsCount !== 7) {
    throw new Error(`Assertion Failed: Expected 7 rows after reload, found ${postReloadData.tableRowsCount}`);
  }
  if (!postReloadData.tableRows.some(r => r.includes('Elena Vance'))) {
    throw new Error('Assertion Failed: Elena Vance missing after reload');
  }
  if (!postReloadData.deptTasksBtn.includes('(7)')) {
    throw new Error(`Assertion Failed: Department Tasks button did not show (7) after reload`);
  }

  await browser.close();
  console.log('=== Live Browser Validation Passed All Strict Assertions ===');
}

runLiveValidation().catch((err) => {
  console.error('Validation Script Error:', err);
  process.exit(1);
});

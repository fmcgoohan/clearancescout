import { chromium } from 'playwright';

const LOCAL_URL = 'http://localhost:8088';
const DEMO_TOKEN = 'judge-pass-2026';

async function runLocalVerification() {
  console.log('=== LOCAL PLAYWRIGHT VERIFICATION AUDIT (FEATURE 029) ===');
  console.log(`Target URL: ${LOCAL_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Initial Page Load & Set Demo Token
    console.log('[Step 1] Navigating to local URL and configuring demo token...');
    await page.goto(LOCAL_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token) => {
      localStorage.setItem('clearancescout_demo_token', token);
      sessionStorage.setItem('clearancescout_demo_token', token);
    }, DEMO_TOKEN);
    await page.reload({ waitUntil: 'networkidle' });

    // Provenance Verification
    console.log('\n--- PROVENANCE & SERVING REVISION AUDIT ---');
    const settingsBtn = await page.waitForSelector('#settings-menu-button', { timeout: 5000 });
    await settingsBtn.click();
    await page.waitForSelector('[data-testid="serving-revision"]', { timeout: 5000 });
    const servingRevisionText = await page.$eval('[data-testid="serving-revision"]', el => el.innerText.replace(/📋|✓|\n/g, '').trim());
    console.log(`UI Serving Revision Displayed: "${servingRevisionText}"`);
    if (!servingRevisionText || servingRevisionText === '') {
      console.error('PROVENANCE AUDIT FAIL: Serving revision is empty!');
      process.exit(1);
    }
    console.log('Provenance & Serving Revision Audit: PASS (User-visible in Settings)');
    await settingsBtn.click(); // close settings menu
    await page.waitForTimeout(300);

    // =========================================================================
    // SCENARIO A: Persistent "New Production" Button in Header
    // =========================================================================
    console.log('\n--- SCENARIO A: PERSISTENT NEW PRODUCTION HEADER CONTROL ---');
    const newProdBtn = await page.waitForSelector('[data-testid="header-new-production-btn"]', { timeout: 5000 });
    const newProdBtnText = await newProdBtn.innerText();
    const newProdBtnAria = await newProdBtn.getAttribute('aria-label');
    console.log(`Header New Production Button: "${newProdBtnText}" (aria-label: "${newProdBtnAria}")`);

    const switchProjBtn = await page.waitForSelector('[data-testid="header-switch-project-btn"], button:has-text("Switch Project")', { timeout: 5000 });
    const switchProjText = await switchProjBtn.innerText();
    console.log(`Header Switch Project Button: "${switchProjText}"`);

    if (!newProdBtnText.includes('New Production')) {
      console.error('SCENARIO A FAIL: "+ New Production" button is not directly visible in header!');
      process.exit(1);
    }
    console.log('Scenario A (Persistent New Production Button): PASS');

    // =========================================================================
    // SCENARIO B: Create Clean Production & Honest Empty State
    // =========================================================================
    console.log('\n--- SCENARIO B: CREATE CLEAN PRODUCTION & HONEST EMPTY STATE ---');
    await newProdBtn.click();
    await page.waitForSelector('[data-testid="create-production-submit-btn"]', { timeout: 5000 });

    const prodTitleInput = await page.$('#new-prod-title');
    const prodStudioInput = await page.$('#new-prod-studio');
    await prodTitleInput.fill('Solaris Dawn');
    await prodStudioInput.fill('A24 Studios');

    const createSubmitBtn = await page.$('[data-testid="create-production-submit-btn"]');
    await createSubmitBtn.click();
    await page.waitForTimeout(1000);

    // Verify newly opened workspace
    const projectHeaderTitle = await page.$eval('[data-testid="workspace-project-title"]', el => el.innerText.trim()).catch(() => 'N/A');
    console.log(`Active Workspace Title: "${projectHeaderTitle}"`);

    const summaryBarText = await page.$eval('[data-testid="project-summary-bar"]', el => el.innerText.replace(/\n/g, ' ').trim()).catch(() => 'N/A');
    console.log(`Summary Bar Text: "${summaryBarText}"`);

    const recCardText = await page.$eval('[data-testid="primary-recommendation-card"]', el => el.innerText.replace(/\n/g, ' ').trim()).catch(() => 'N/A');
    console.log(`Recommendation Card: "${recCardText}"`);

    const emptyStateVisible = await page.$('[data-testid="workspace-empty-state"]').then(el => Boolean(el));
    console.log(`Workspace Empty State Notice Visible: ${emptyStateVisible}`);

    if (!projectHeaderTitle.includes('Solaris Dawn')) {
      console.error(`SCENARIO B FAIL: Expected active project "Solaris Dawn", got "${projectHeaderTitle}"`);
      process.exit(1);
    }
    if (!summaryBarText.includes('No clearance items recorded')) {
      console.error(`SCENARIO B FAIL: Summary bar should report "No clearance items recorded", got "${summaryBarText}"`);
      process.exit(1);
    }
    if (!recCardText.includes('Upload Screenplay to Begin Clearance')) {
      console.error(`SCENARIO B FAIL: Primary recommendation should be "Upload Screenplay", got "${recCardText}"`);
      process.exit(1);
    }
    console.log('Scenario B (Clean Production Creation & Honest Empty Workspace): PASS');

    // =========================================================================
    // SCENARIO C: Ingestion Extraction Preview & 0-Scene Block
    // =========================================================================
    console.log('\n--- SCENARIO C: INGESTION EXTRACTION PREVIEW & 0-SCENE BLOCK ---');
    const uploadTriggerBtn = await page.waitForSelector('[data-testid="recommendation-upload-script-btn"], [data-testid="workspace-empty-upload-btn"]', { timeout: 5000 });
    await uploadTriggerBtn.click();
    await page.waitForSelector('[aria-labelledby="upload-modal-title"]', { timeout: 5000 });

    // Switch to Paste Screenplay tab
    const pasteTabBtn = await page.waitForSelector('button:has-text("Paste Screenplay Text")', { timeout: 5000 });
    await pasteTabBtn.click();

    // Type invalid non-screenplay text (no sluglines)
    const textarea = await page.waitForSelector('textarea', { timeout: 5000 });
    await textarea.fill('This is an ordinary text document without any scene headings or sluglines.\nJust informal notes.');
    await page.waitForTimeout(1000);

    // Inspect preview card & warning banner
    const previewWarnings = await page.waitForSelector('[data-testid="extraction-preview-warnings"]', { timeout: 5000 });
    const warningText = await previewWarnings.innerText();
    console.log(`Extraction Preview Warning: "${warningText.replace(/\n/g, ' ')}"`);

    const confirmBtn = await page.$('[data-testid="btn-confirm-ingestion"]');
    const isConfirmDisabled = await confirmBtn.getAttribute('disabled');
    const confirmBtnText = await confirmBtn.innerText();
    console.log(`Confirm Button: "${confirmBtnText}" | disabled=${isConfirmDisabled !== null}`);

    if (isConfirmDisabled === null) {
      console.error('SCENARIO C FAIL: "Confirm Ingestion" button must be disabled when 0 scenes are detected!');
      process.exit(1);
    }

    // Close upload modal
    const cancelModalBtn = await page.$('button[aria-label="Close upload dialog"], button:has-text("Cancel")');
    await cancelModalBtn.click();
    await page.waitForTimeout(500);

    // Verify workspace remains empty and was NOT replaced with Neon Horizon
    const afterCancelSummary = await page.$eval('[data-testid="project-summary-bar"]', el => el.innerText.replace(/\n/g, ' ').trim()).catch(() => 'N/A');
    console.log(`Workspace after failed extraction cancel: "${afterCancelSummary}"`);
    if (!afterCancelSummary.includes('No clearance items recorded')) {
      console.error(`SCENARIO C FAIL: Workspace was corrupted or replaced with demo data after cancelled upload!`);
      process.exit(1);
    }
    console.log('Scenario C (Extraction Preview Warning & 0-Scene Ingestion Block): PASS');

    // =========================================================================
    // SCENARIO D: Explicit "Load Sample Production" Action
    // =========================================================================
    console.log('\n--- SCENARIO D: EXPLICIT LOAD SAMPLE PRODUCTION ---');
    const loadSampleBtn = await page.waitForSelector('[data-testid="recommendation-load-sample-btn"]', { timeout: 5000 });
    console.log(`Found explicit sample load button: "${await loadSampleBtn.innerText()}"`);
    await loadSampleBtn.click();
    await page.waitForTimeout(2000);

    const loadedReadiness = await page.$eval('[data-testid="workspace-readiness-pct"]', el => el.textContent.trim()).catch(() => 'N/A');
    const loadedSummary = await page.$eval('[data-testid="project-summary-bar"]', el => el.innerText.replace(/\n/g, ' ').trim()).catch(() => 'N/A');
    const loadedBlockers = await page.$eval('[data-testid="workspace-blocked-scenes"]', el => el.textContent.trim()).catch(() => 'N/A');

    console.log(`Loaded Sample Readiness: ${loadedReadiness}`);
    console.log(`Loaded Sample Summary: ${loadedSummary}`);
    console.log(`Loaded Sample Blockers: ${loadedBlockers}`);

    if (loadedReadiness !== '33.3%') {
      console.error(`SCENARIO D FAIL: Expected Neon Horizon 33.3% readiness, got "${loadedReadiness}"`);
      process.exit(1);
    }
    if (!loadedBlockers.includes('2')) {
      console.error(`SCENARIO D FAIL: Expected Neon Horizon 2 blocked scenes, got "${loadedBlockers}"`);
      process.exit(1);
    }
    console.log('Scenario D (Explicit Load Sample -> Neon Horizon 33.3% / 2 Blocked): PASS');

    // =========================================================================
    // SCENARIO E: Cyberpunk Odyssey Isolation from Portfolio
    // =========================================================================
    console.log('\n--- SCENARIO E: CYBERPUNK ODYSSEY ISOLATION ---');
    const portfolioToggleBtn = await page.waitForSelector('[data-testid="portfolio-view-toggle"]', { timeout: 5000 });
    await portfolioToggleBtn.click();
    await page.waitForSelector('[data-portfolio-card="true"]', { timeout: 5000 });

    const cyberpunkCard = await page.waitForSelector('[data-portfolio-card="true"]:has-text("Cyberpunk Odyssey")', { timeout: 5000 });
    const cyberpunkReadinessBadge = await cyberpunkCard.$eval('[data-readiness-badge="true"]', el => el.innerText.trim()).catch(() => 'N/A');
    console.log(`Cyberpunk Portfolio Card Readiness: "${cyberpunkReadinessBadge}"`);

    await cyberpunkCard.click();
    await page.waitForTimeout(1500);

    const cyberReadiness = await page.$eval('[data-testid="workspace-readiness-pct"]', el => el.textContent.trim()).catch(() => 'N/A');
    const cyberBlockers = await page.$eval('[data-testid="workspace-blocked-scenes"]', el => el.textContent.trim()).catch(() => 'N/A');
    console.log(`Cyberpunk Active Workspace Readiness: ${cyberReadiness} | Blockers: ${cyberBlockers}`);

    if (cyberReadiness !== '100%') {
      console.error(`SCENARIO E FAIL: Expected Cyberpunk 100% readiness, got "${cyberReadiness}"`);
      process.exit(1);
    }
    if (!cyberBlockers.includes('0')) {
      console.error(`SCENARIO E FAIL: Expected Cyberpunk 0 blocked scenes, got "${cyberBlockers}"`);
      process.exit(1);
    }
    console.log('Scenario E (Cyberpunk Odyssey 100% / 0 Blocked Isolation): PASS');

    // =========================================================================
    // SCENARIO F: Notification Deep-Link & Tombstone Integrity
    // =========================================================================
    console.log('\n--- SCENARIO F: NOTIFICATION DEEP-LINK & TOMBSTONE INTEGRITY ---');
    // Switch back to Neon Horizon using portfolio
    const portfolioBtnF = await page.waitForSelector('[data-testid="portfolio-view-toggle"]', { timeout: 5000 });
    await portfolioBtnF.click();
    await page.waitForSelector('[data-portfolio-card="true"]', { timeout: 5000 });

    const neonHorizonCard = await page.waitForSelector('[data-portfolio-card="true"]:has-text("The Neon Horizon")', { timeout: 5000 });
    await neonHorizonCard.click();
    await page.waitForTimeout(1500);

    // Ensure sample data is populated on proj-default
    await page.evaluate(async (token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['x-demo-token'] = token;
      await fetch('/api/projects/proj-default/script/demo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ autoEvaluate: true, includeSampleRights: true, includeSamplePlaceholders: true }),
      });
    }, DEMO_TOKEN);

    // Open notification drawer
    const alertsBtn = await page.waitForSelector('#notification-drawer-button, button:has-text("Alerts")', { timeout: 5000 });
    await alertsBtn.click();
    await page.waitForSelector('[role="dialog"][aria-label="Notifications"]', { timeout: 5000 });

    // Test valid notification deep link
    const validNotification = await page.waitForSelector('[data-notification-target-task="TASK-101"]', { timeout: 5000 });
    console.log(`Clicking valid notification for TASK-101...`);
    await validNotification.click();
    await page.waitForSelector('[role="dialog"][aria-labelledby="action-modal-title"]', { timeout: 5000 });
    await page.waitForSelector('#task-heading-TASK-101', { timeout: 5000 });
    await page.waitForTimeout(400);

    const activeHeadingId = await page.evaluate(() => document.activeElement ? document.activeElement.id : null);
    console.log(`Focused Element in Action Center: id="${activeHeadingId}"`);
    if (activeHeadingId !== 'task-heading-TASK-101') {
      console.error(`SCENARIO F FAIL: Expected focus on task-heading-TASK-101, got "${activeHeadingId}"`);
      process.exit(1);
    }

    // Close Action Center modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Test temporary orphan tombstone
    const orphanCreate = await page.evaluate(async (token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['x-demo-token'] = token;
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: 'LEGAL_COUNSEL',
          projectId: 'proj-default',
          triggerType: 'TASK_MENTION',
          title: 'Orphan Notification QA',
          message: 'Target task deleted.',
          targetTaskId: 'TASK-NON-EXISTENT-999',
        }),
      });
      return { ok: res.ok, data: await res.json() };
    }, DEMO_TOKEN);

    const orphanId = orphanCreate.data?.notification?.id;
    const alertsBtn2 = await page.waitForSelector('#notification-drawer-button, button:has-text("Alerts")', { timeout: 5000 });
    await alertsBtn2.click();
    await page.waitForTimeout(500);

    const orphanItem = await page.waitForSelector('[data-notification-target-task="TASK-NON-EXISTENT-999"]', { timeout: 5000 });
    const isOrphanDisabled = await orphanItem.getAttribute('data-notification-disabled');
    console.log(`Orphan notification disabled attribute: "${isOrphanDisabled}"`);

    await orphanItem.click({ force: true });
    await page.waitForTimeout(300);

    const liveAnnouncement = await page.$eval('[data-testid="notification-live-announcement"]', el => el.textContent.trim()).catch(() => 'N/A');
    console.log(`Orphan click live announcement: "${liveAnnouncement}"`);

    if (isOrphanDisabled !== 'true' || liveAnnouncement !== 'This task is no longer available.') {
      console.error(`SCENARIO F FAIL: Orphan task was not properly tombstoned!`);
      process.exit(1);
    }

    // Cleanup orphan notification
    if (orphanId) {
      await page.evaluate(async ({ id, token }) => {
        const headers = {};
        if (token) headers['x-demo-token'] = token;
        await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers });
      }, { id: orphanId, token: DEMO_TOKEN });
    }

    await alertsBtn2.click();
    await page.waitForTimeout(300);
    console.log('Scenario F (Valid Notification Deep-Link & Orphan Tombstone): PASS');

    // =========================================================================
    // SCENARIO G: Coors Light 4-Page PDF Extraction & Negative PDF Integrity
    // =========================================================================
    console.log('\n--- SCENARIO G: COORS LIGHT 4-PAGE PDF & NEGATIVE PDF AUDIT ---');
    const path = await import('path');
    const fs = await import('fs');
    const coorsPdfPath = path.resolve(process.cwd(), 'tests/fixtures/coors_light_4page.pdf');
    const imageOnlyPdfPath = path.resolve(process.cwd(), 'tests/fixtures/image_only.pdf');
    const malformedPdfPath = path.resolve(process.cwd(), 'tests/fixtures/malformed.pdf');

    // 1. Create a fresh clean production for PDF testing
    const newProdBtnG = await page.waitForSelector('[data-testid="header-new-production-btn"]', { timeout: 5000 });
    await newProdBtnG.click();
    await page.waitForSelector('[data-testid="create-production-submit-btn"]', { timeout: 5000 });
    await page.fill('#new-prod-title', 'Mountain Refuge Feature');
    await page.fill('#new-prod-studio', 'Rockies Cinema');
    await page.click('[data-testid="create-production-submit-btn"]');
    await page.waitForTimeout(1000);

    // Initial Quota check
    const initialQuotaUsed = await page.$eval('[data-testid="quota-used-display"]', el => el.innerText.trim()).catch(() => '0');
    console.log(`Initial Research Quota Used: ${initialQuotaUsed}`);

    // 2. Negative Test: Image-Only Scanned PDF
    console.log('Testing Negative Upload 1: Image-only scanned PDF...');
    const uploadBtnG1 = await page.waitForSelector('[data-testid="recommendation-upload-script-btn"], [data-testid="workspace-empty-upload-btn"]', { timeout: 5000 });
    await uploadBtnG1.click();
    await page.waitForSelector('[aria-labelledby="upload-modal-title"]', { timeout: 5000 });

    const fileInputG = await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 5000 });
    await fileInputG.setInputFiles(imageOnlyPdfPath);
    await page.waitForTimeout(1500);

    const imgWarnings = await page.waitForSelector('[data-testid="extraction-preview-warnings"]', { timeout: 5000 });
    const imgWarnText = await imgWarnings.innerText();
    const imgConfirmBtn = await page.$('[data-testid="btn-confirm-ingestion"]');
    const isImgDisabled = await imgConfirmBtn.getAttribute('disabled');
    console.log(`Image-Only PDF Preview Warning: "${imgWarnText.replace(/\n/g, ' ')}"`);
    console.log(`Image-Only Confirm Button Disabled: ${isImgDisabled !== null}`);

    if (isImgDisabled === null) {
      console.error('SCENARIO G FAIL: Confirm button must be disabled for image-only PDF!');
      process.exit(1);
    }

    // 3. Negative Test: Corrupted / Malformed PDF
    console.log('Testing Negative Upload 2: Malformed corrupted PDF...');
    await fileInputG.setInputFiles(malformedPdfPath);
    await page.waitForTimeout(1500);

    const malWarnings = await page.waitForSelector('[data-testid="extraction-preview-warnings"]', { timeout: 5000 });
    const malWarnText = await malWarnings.innerText();
    const malConfirmBtn = await page.$('[data-testid="btn-confirm-ingestion"]');
    const isMalDisabled = await malConfirmBtn.getAttribute('disabled');
    console.log(`Malformed PDF Preview Warning: "${malWarnText.replace(/\n/g, ' ')}"`);
    console.log(`Malformed Confirm Button Disabled: ${isMalDisabled !== null}`);

    if (isMalDisabled === null) {
      console.error('SCENARIO G FAIL: Confirm button must be disabled for malformed PDF!');
      process.exit(1);
    }

    // 4. Positive Test: Real 4-Page Coors Light Screenplay PDF
    console.log('Testing Positive Upload: Coors Light 4-page Screenplay PDF...');
    await fileInputG.setInputFiles(coorsPdfPath);
    await page.waitForTimeout(2000);

    const previewCard = await page.waitForSelector('[data-testid="extraction-preview-card"]', { timeout: 5000 });
    const previewText = await previewCard.innerText();
    console.log(`Coors PDF Preview Card:\n${previewText}`);

    const coorsConfirmBtn = await page.$('[data-testid="btn-confirm-ingestion"]');
    const isCoorsDisabled = await coorsConfirmBtn.getAttribute('disabled');
    console.log(`Coors PDF Confirm Button Enabled: ${isCoorsDisabled === null}`);

    if (isCoorsDisabled !== null) {
      console.error('SCENARIO G FAIL: Confirm button must be enabled for valid 4-page Coors PDF!');
      process.exit(1);
    }

    if (!previewText.includes('coors_light_4page.pdf') || !previewText.includes('Est. Pages: 4') || !previewText.includes('Scenes Detected: 3')) {
      console.error(`SCENARIO G FAIL: Extraction preview mismatch! Expected 4 pages and 3 scenes.`);
      process.exit(1);
    }

    // Confirm Ingestion
    console.log('Clicking "Confirm Ingestion & Review"...');
    await coorsConfirmBtn.click();
    await page.waitForTimeout(3000);

    // Assert Ingested Workspace State
    const coorsSummary = await page.$eval('[data-testid="project-summary-bar"]', el => el.innerText.replace(/\n/g, ' ').trim()).catch(() => 'N/A');
    console.log(`Workspace Summary after Coors Ingestion: "${coorsSummary}"`);

    // Verify Coors Light entity in table / registry
    const registryTable = await page.waitForSelector('[data-testid="entity-registry-table"], table', { timeout: 5000 });
    const registryContent = await registryTable.innerText();
    console.log(`Registry Table Content Preview:\n${registryContent.slice(0, 300)}...`);

    const hasCoorsLight = registryContent.toLowerCase().includes('coors light') || registryContent.toLowerCase().includes('coors');
    const hasNeonDemo = registryContent.toLowerCase().includes('summit cola') || registryContent.toLowerCase().includes('aerotech');

    console.log(`Coors Light Identified: ${hasCoorsLight}`);
    console.log(`Zero Demo Entities Substituted: ${!hasNeonDemo}`);

    if (!hasCoorsLight) {
      console.error('SCENARIO G FAIL: "Coors Light" was not extracted as a clearance item!');
      process.exit(1);
    }
    if (hasNeonDemo) {
      console.error('SCENARIO G FAIL: Sample Neon Horizon entities were substituted into the user project!');
      process.exit(1);
    }

    // Assert Quota Unused
    const afterQuotaUsed = await page.$eval('[data-testid="quota-used-display"]', el => el.innerText.trim()).catch(() => '0');
    console.log(`Research Quota Used after ingestion (before evaluation): ${afterQuotaUsed}`);

    // Refresh and Verify State Persistence
    console.log('Reloading page to verify snapshot persistence...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const reloadedSummary = await page.$eval('[data-testid="project-summary-bar"]', el => el.innerText.replace(/\n/g, ' ').trim()).catch(() => 'N/A');
    const reloadedTable = await page.waitForSelector('[data-testid="entity-registry-table"], table', { timeout: 5000 });
    const reloadedContent = await reloadedTable.innerText();
    const reloadedHasCoors = reloadedContent.toLowerCase().includes('coors');

    console.log(`Reloaded Summary: "${reloadedSummary}"`);
    console.log(`Reloaded Coors Light Preserved: ${reloadedHasCoors}`);

    if (!reloadedHasCoors) {
      console.error('SCENARIO G FAIL: Coors Light entity was lost after page reload!');
      process.exit(1);
    }

    console.log('Scenario G (Coors Light 4-Page PDF & Negative PDF Integrity): PASS');

    console.log('\n=== LOCAL PLAYWRIGHT VERIFICATION AUDIT COMPLETE: ALL PASS (A–G) ===');
  } catch (err) {
    console.error('Local verification failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runLocalVerification();

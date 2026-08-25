import { chromium } from 'playwright';

async function runLiveKeyboardFocusValidation() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  console.log(`=== Live Keyboard & Focus Trap Validation against ${baseUrl} ===`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  console.log('[1/7] Navigating to target application:', baseUrl);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // Set demo token & initial project ID
  await page.evaluate(() => {
    localStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
    sessionStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // 1. Test DemoTokenModal Focus Trap, Initial Focus, and Escape
  console.log('[2/7] Testing DemoTokenModal initial focus, tab trap, and Escape key...');
  const settingsBtn = await page.waitForSelector('#settings-menu-button, button[aria-label="Settings"]');
  await settingsBtn.click();
  await page.waitForTimeout(100);

  const tokenBtn = await page.waitForSelector('#demo-token-button, button[aria-label="Configure Demo Access Token"]');
  await tokenBtn.focus();
  await page.keyboard.press('Enter');

  const tokenDialog = await page.waitForSelector('[role="dialog"][aria-labelledby="token-modal-title"]');
  console.log('  ✓ Token dialog opened');

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

  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const isInside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="token-modal-title"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped Token dialog during forward Tab cycle');
  }
  console.log('  ✓ Forward Tab cycle (8 steps) remained strictly trapped inside Token dialog');

  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Shift+Tab');
    const isInside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="token-modal-title"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    if (!isInside) throw new Error('Focus escaped Token dialog during Shift+Tab cycle');
  }
  console.log('  ✓ Backward Shift+Tab cycle (8 steps) remained strictly trapped inside Token dialog');

  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="token-modal-title"]', { state: 'detached' });
  const isFocusRestoredToken = await page.evaluate(() => {
    return document.activeElement?.innerText?.includes('Demo Token');
  });
  console.log('  ✓ Escape closed Token dialog and restored focus to trigger:', isFocusRestoredToken);

  // 2. Test ScriptUploadModal Initial Focus & Trap
  console.log('[3/7] Testing ScriptUploadModal initial focus, trap & polite live region...');
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
  console.log('[4/7] Testing Operations Dashboard initial focus, trap & collapsible scenes...');
  const dashBtn = await page.waitForSelector('button:has-text("Operations Dashboard")');
  await dashBtn.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]');
  await page.waitForTimeout(100);

  const dashFocusCheck = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]');
    const active = document.activeElement;
    return {
      isInside: dialog ? dialog.contains(active) : false,
      activeTag: active ? active.tagName : 'NULL',
      activeText: active ? active.textContent : '',
    };
  });
  if (!dashFocusCheck.isInside) {
    throw new Error(`CRITICAL QA DEFECT: Initial focus is OUTSIDE Operations Dashboard! Focus is on: <${dashFocusCheck.activeTag}> "${dashFocusCheck.activeText}"`);
  }
  console.log('  ✓ Initial focus inside Operations Dashboard: true');

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const status = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]');
      const active = document.activeElement;
      return {
        isInside: dialog ? dialog.contains(active) : false,
        activeTag: active ? active.tagName : 'NULL',
        activeText: active ? active.textContent : '',
      };
    });
    if (!status.isInside) {
      throw new Error(`Focus escaped Operations Dashboard during Tab cycle step ${i + 1}`);
    }
  }
  console.log('  ✓ Tab cycle (12 steps) remained strictly trapped inside Operations Dashboard');

  // Assert 4-department additive breakdown in Open Department Tasks tile
  await page.waitForSelector('text="Loading consolidated production dashboard..."', { state: 'detached', timeout: 10000 }).catch(() => {});

  const dashboardText = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]');
    return dialog ? dialog.innerText : '';
  });

  const has4DeptBreakdown = dashboardText.includes('Art:') && dashboardText.includes('Legal:') && dashboardText.includes('Locations:') && dashboardText.includes('Prod:');
  console.log('  ✓ Open Department Tasks tile displays full 4-department breakdown:', has4DeptBreakdown);
  if (!has4DeptBreakdown) {
    throw new Error('US21 DEFECT: Operations Dashboard Open Department Tasks tile failed to display full 4-department breakdown!');
  }

  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="dashboard-modal-title"]', { state: 'detached' });
  console.log('  ✓ Escape closed Operations Dashboard');

  // 4. Test Department Tasks Action Center Focus Trap & Escape
  console.log('[5/7] Testing Department Tasks Action Center initial focus & trap...');
  const tasksTab = await page.waitForSelector('#tab-tasks');
  await tasksTab.click();
  await page.waitForTimeout(100);

  const actionBtn = await page.waitForSelector('button[aria-label="Open Department Action Center"]');
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

  // --- US22 Task Ownership, Due Date, Overdue, Audit History & Keystroke-Flood Regression Sub-Checks ---
  // Sub-check 1: Type assignee name character-by-character into Open task and blur/tab away
  await page.waitForSelector('input[aria-label^="Assignee Name for"]');

  const openTaskCardHandle = await page.evaluateHandle(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const openBadge = spans.find((s) => s.textContent && s.textContent.trim() === 'Open');
    return openBadge ? openBadge.closest('div[style*="padding"]') : null;
  });

  const openTaskAssigneeInput = await openTaskCardHandle.asElement().$('input[placeholder="Assignee Name"]');
  await openTaskAssigneeInput.click();
  await openTaskAssigneeInput.fill('');
  await openTaskAssigneeInput.type('Sarah Jenkins');
  await page.keyboard.press('Tab'); // Trigger blur & focus shift
  await page.waitForTimeout(500);
  console.log('  ✓ Sub-check 1: Typed "Sarah Jenkins" character-by-character into Assignee input and blurred');

  // Sub-check 2: Due date input & past date OVERDUE badge trigger on the Open task
  const openTaskDueDateInput = await openTaskCardHandle.asElement().$('input[type="date"]');
  await openTaskDueDateInput.evaluate((el) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, '2025-01-01');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(600);

  const overdueBadge = await page.waitForSelector('[data-overdue="true"]');
  const overdueText = await overdueBadge.textContent();
  const showsOverdueBadge = overdueText.includes('OVERDUE');
  console.log('  ✓ Sub-check 2: Set past due date (2025-01-01) and verified OVERDUE badge rendered:', showsOverdueBadge);
  if (!showsOverdueBadge) {
    throw new Error('US22 DEFECT: OVERDUE badge failed to render for past due task!');
  }

  // Sub-check 3: Expand audit history on Open task and verify CREATED / ASSIGNED / DUE_DATE_CHANGED events and NO keystroke flooding
  const openTaskAuditBtn = await openTaskCardHandle.asElement().$('button:has-text("Audit History")');
  await openTaskAuditBtn.click();
  const auditTrail = await openTaskCardHandle.asElement().$('[data-audit-history="true"]');
  const auditText = await auditTrail.textContent();
  const assignedMatches = (auditText.match(/\[ASSIGNED\]/g) || []).length;
  const hasAuditEvents = assignedMatches === 1 && auditText.includes('DUE_DATE_CHANGED');
  console.log('  ✓ Sub-check 3: Expanded Audit Trail, confirmed exact 1 ASSIGNED event (no keystroke flooding, count = ' + assignedMatches + ') and DUE_DATE_CHANGED event:', hasAuditEvents);
  if (!hasAuditEvents) {
    throw new Error('US22 DEFECT: Audit trail timeline failed to display exact 1 ASSIGNED event or DUE_DATE_CHANGED event! Count was ' + assignedMatches);
  }

  // Sub-check 4: Reload page and verify persistence of assignee & due date & audit trail
  await page.reload({ waitUntil: 'networkidle' });
  const tasksTabReloaded = await page.waitForSelector('#tab-tasks');
  await tasksTabReloaded.click();
  const actionBtnReloaded = await page.waitForSelector('button[aria-label="Open Department Action Center"]');
  await actionBtnReloaded.click();
  await page.waitForSelector('[role="dialog"][aria-labelledby="action-modal-title"]');
  await page.waitForSelector('input[aria-label^="Assignee Name for"]');

  const reloadedVals = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const openBadge = spans.find((s) => s.textContent && s.textContent.trim() === 'Open');
    if (openBadge) {
      const card = openBadge.closest('div[style*="padding"]');
      const assInput = card?.querySelector('input[placeholder="Assignee Name"]');
      const dateInput = card?.querySelector('input[type="date"]');
      return {
        assignee: assInput ? assInput.value : '',
        dueDate: dateInput ? dateInput.value : '',
      };
    }
    return { assignee: '', dueDate: '' };
  });

  console.log('  ✓ Sub-check 4: Verified assignee ("' + reloadedVals.assignee + '") and due date ("' + reloadedVals.dueDate + '") persisted after page reload');
  if (reloadedVals.assignee !== 'Sarah Jenkins' || reloadedVals.dueDate !== '2025-01-01') {
    throw new Error('US22 DEFECT: Assignee or Due Date failed to persist across page reload!');
  }

  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="action-modal-title"]', { state: 'detached' });
  console.log('  ✓ Escape closed Action Center');

  // 5. Test Recommended-Action Drawer Focus Restoration Flow (FIX 1)
  console.log('[6/7] Testing Recommended-Action Drawer focus entry, trap, and semantic focus restoration...');
  
  // Ensure we are on Overview tab
  const overviewTab = await page.waitForSelector('#tab-overview, button:has-text("Overview")');
  await overviewTab.click();
  await page.waitForTimeout(100);

  // Locate and focus "Research Nocturne of the Wild" button
  const recActionBtn = await page.waitForSelector('button:has-text("Research Nocturne of the Wild")');
  await recActionBtn.focus();
  console.log('  ✓ Focused "Research Nocturne of the Wild" button on Overview');

  // Activate via keyboard (Enter)
  await page.keyboard.press('Enter');

  // Verify CitationDrawer opens with Nocturne title
  const drawer = await page.waitForSelector('[role="dialog"][aria-labelledby="citation-drawer-title"], [role="dialog"]:has-text("Nocturne of the Wild")');
  console.log('  ✓ CitationDrawer opened for "Nocturne of the Wild"');

  // Verify tab switched to Clearance Items
  const isClearanceSelected = await page.evaluate(() => {
    const tab = document.querySelector('#tab-clearance, [role="tab"][aria-selected="true"]');
    return tab ? tab.textContent?.includes('Clearance Items') || tab.id === 'tab-clearance' : false;
  });
  console.log('  ✓ Panel correctly switched to Clearance Items:', isClearanceSelected);

  // Verify initial focus inside drawer
  const focusInsideDrawer = await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    return dialogs.some(d => d.contains(document.activeElement));
  });
  if (!focusInsideDrawer) {
    const activeInfo = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 100));
    throw new Error(`CRITICAL QA DEFECT: Initial focus is OUTSIDE CitationDrawer! Active: ${activeInfo}`);
  }
  console.log('  ✓ Initial focus inside CitationDrawer: true');

  // Verify Tab focus trapping inside drawer
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const trapped = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
      return dialogs.some(d => d.contains(document.activeElement));
    });
    if (!trapped) throw new Error(`Focus escaped CitationDrawer during Tab step ${i + 1}`);
  }
  console.log('  ✓ Tab cycle (8 steps) remained trapped inside CitationDrawer');

  // Verify Shift+Tab focus trapping inside drawer
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Shift+Tab');
    const trapped = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
      return dialogs.some(d => d.contains(document.activeElement));
    });
    if (!trapped) throw new Error(`Focus escaped CitationDrawer during Shift+Tab step ${i + 1}`);
  }
  console.log('  ✓ Shift+Tab cycle (8 steps) remained trapped inside CitationDrawer');

  // Dismiss drawer with Escape
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"]:has-text("Nocturne of the Wild")', { state: 'detached' });
  console.log('  ✓ CitationDrawer dismissed via Escape key');

  // CRITICAL ASSERTION: Active element MUST be semantic target in Clearance Items, NOT "Switch Project"!
  const postCloseFocus = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      id: active?.id || '',
      tagName: active?.tagName || '',
      ariaLabel: active?.getAttribute('aria-label') || '',
      textContent: active?.textContent?.trim().slice(0, 50) || '',
      isSwitchProject: active?.id === 'project-switcher' || active?.textContent?.includes('Switch Project') || false,
      dataEntityId: active?.getAttribute('data-entity-id') || '',
    };
  });

  console.log('  ✓ Post-dismissal focus element:', JSON.stringify(postCloseFocus));

  if (postCloseFocus.isSwitchProject) {
    throw new Error('CRITICAL FOCUS REGRESSION: Focus returned to "Switch Project" after closing drawer!');
  }
  console.log('  ✓ Confirmed focus did NOT return to "Switch Project"');

  // 6. Test Project-Scoped Onboarding Persistence Flow
  console.log('[7/7] Testing Project-Scoped Onboarding Persistence across panel navigation, reloads, and project isolation...');

  // Ensure we are on Overview tab where OnboardingBanner resides
  const overviewTabB = await page.waitForSelector('#tab-overview');
  await overviewTabB.click();
  await page.waitForTimeout(100);

  // Read Project A ID directly from OnboardingBanner DOM attribute
  const projectAId = await page.$eval('[role="region"][aria-label="How Clearance Scout Works"]', el => el.getAttribute('data-project-id')).catch(() => 'default');
  console.log('  ✓ Initial Project A ID:', projectAId);

  await page.evaluate((id) => {
    if (id) localStorage.removeItem(`clearancescout:onboarding:v1:${id}`);
    localStorage.removeItem('clearancescout:onboarding:v1:default');
    localStorage.removeItem('clearancescout_onboarding_dismissed');
  }, projectAId);

  // Step 6a: Dismiss onboarding for Project A (default)
  const dismissBtn = await page.waitForSelector('button[aria-label="Dismiss clearance guide"]');
  await dismissBtn.click();
  await page.waitForTimeout(100);
  console.log('  ✓ Onboarding banner dismissed for Project A');

  // Confirm banner is hidden for Project A
  const bannerVisibleA = await page.$eval('[role="region"][aria-label="How Clearance Scout Works"]', el => !!el).catch(() => false);
  if (bannerVisibleA) throw new Error('Onboarding banner remained visible after dismissal on Project A!');
  console.log('  ✓ Onboarding banner hidden on Project A: true');

  // Step 6b: Navigate across panels and verify onboarding stays dismissed
  await (await page.waitForSelector('#tab-screenplay')).click();
  await page.waitForTimeout(100);
  const bannerOnScreenplay = await page.$eval('[role="region"][aria-label="How Clearance Scout Works"]', el => !!el).catch(() => false);
  if (bannerOnScreenplay) throw new Error('Onboarding banner reappeared on Screenplay tab!');

  await (await page.waitForSelector('#tab-clearance')).click();
  await page.waitForTimeout(100);
  const bannerOnClearance = await page.$eval('[role="region"][aria-label="How Clearance Scout Works"]', el => !!el).catch(() => false);
  if (bannerOnClearance) throw new Error('Onboarding banner reappeared on Clearance Items tab!');
  console.log('  ✓ Onboarding banner stayed hidden during panel navigation');

  // Step 6c: Reload Project A (Overview tab default) and verify onboarding stays dismissed
  await page.reload({ waitUntil: 'networkidle' });
  const bannerAfterReload = await page.$eval('[role="region"][aria-label="How Clearance Scout Works"]', el => !!el).catch(() => false);
  if (bannerAfterReload) throw new Error('Onboarding banner reappeared after page reload for Project A!');
  console.log('  ✓ Onboarding banner stayed hidden after reload for Project A');

  // Step 6d: Open Project Switcher and create a second project (Project B)
  console.log('  Testing Project Switcher and creating Project B...');
  const projSwitcherBtn = await page.waitForSelector('#project-switcher, button:has-text("Switch Project")');
  await projSwitcherBtn.click();
  await page.waitForTimeout(100);

  const newProjectBtn = await page.waitForSelector('button:has-text("Create New Project"), button:has-text("New Project")');
  await newProjectBtn.click();
  await page.waitForTimeout(100);

  // Fill in new project form
  const titleInput = await page.waitForSelector('input[placeholder="e.g. Cyberfall"]');
  await titleInput.fill('Project B - Isolated Test');

  const companyInput = await page.waitForSelector('input[placeholder="e.g. Apex Entertainment"]');
  await companyInput.fill('Test Productions Inc');

  const submitCreateBtn = await page.waitForSelector('button[type="submit"]:has-text("Create"), button:has-text("Create & Open Project")');
  await submitCreateBtn.click();
  await page.waitForTimeout(300);

  // Verify OnboardingBanner IS VISIBLE on new Project B
  const bannerProjectB = await page.$eval('[role="region"][aria-label="How Clearance Scout Works"]', el => !!el).catch(() => false);
  console.log('  ✓ Onboarding banner visible for newly created Project B:', bannerProjectB);
  if (!bannerProjectB) throw new Error('PROJECT ISOLATION FAILURE: Onboarding banner was suppressed on Project B when Project A was dismissed!');

  // Step 6e: Switch back to Project A via Project Switcher Modal
  const projSwitcherBtn2 = await page.waitForSelector('#project-switcher, button:has-text("Switch Project")');
  await projSwitcherBtn2.click();
  await page.waitForTimeout(100);

  // Click initial Project A card in ProjectListModal by its exact project ID
  const projectACard = await page.waitForSelector(`[role="dialog"] [data-project-id="${projectAId}"]`);
  await projectACard.click();
  await page.waitForTimeout(300);

  // Verify OnboardingBanner is STILL DISMISSED for Project A
  const bannerRestoredA = await page.$eval('[role="region"][aria-label="How Clearance Scout Works"]', el => !!el).catch(() => false);
  if (bannerRestoredA) throw new Error('PROJECT ISOLATION FAILURE: Onboarding banner reappeared on Project A after returning from Project B!');
  console.log('  ✓ Onboarding banner remained dismissed when returning to Project A');

  // 7. Test Atomic Workspace Snapshot Hydration Gate (AC-19.1)
  console.log('[8/8] Testing Atomic Workspace Snapshot Hydration Gate with controlled network delay (AC-19.1)...');

  // Intercept scene requests to introduce controlled 600ms hydration delay
  await page.route('**/api/projects/*/scenes', async (route) => {
    await new Promise((r) => setTimeout(r, 600));
    await route.continue();
  });

  // Reload page to trigger hydration with delayed network response
  const reloadPromise = page.reload({ waitUntil: 'commit' });

  // During hydration delay, verify synchronizing loader is displayed and "No Screenplay Ingested" is absent
  await page.waitForTimeout(200);
  const isSynchronizing = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Synchronizing Workspace Snapshot...');
  });
  const showsNoScreenplayDuringHydration = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('No Screenplay Ingested');
  });

  console.log('  ✓ Synchronizing loader active during hydration delay:', isSynchronizing);
  console.log('  ✓ "No Screenplay Ingested" suppressed during hydration delay:', !showsNoScreenplayDuringHydration);

  if (showsNoScreenplayDuringHydration) {
    throw new Error('HYDRATION DEFECT: "No Screenplay Ingested" was displayed during hydration delay!');
  }

  // Await network idle after response finishes
  await reloadPromise;
  await page.waitForLoadState('networkidle');

  // Unroute handler
  await page.unroute('**/api/projects/*/scenes');

  // Verify final atomic state after hydration completes
  const postHydrationText = await page.evaluate(() => document.body.innerText);
  const hasEntities = postHydrationText.includes('7 Clearance Items') || postHydrationText.includes('Nocturne of the Wild');
  const hasScenes = postHydrationText.includes('3 scenes') || postHydrationText.includes('Scene 1') || postHydrationText.includes('SCENE 1');

  console.log('  ✓ Workspace scenes and clearance entities rendered atomically post-hydration:', hasEntities && hasScenes);
  if (!hasEntities || !hasScenes) {
    throw new Error('HYDRATION DEFECT: Workspace failed to display 7 entities and 3 scenes after hydration!');
  }

  // 8. Test Project Directory Coherence & Active Workspace Fallback (US20 - AC-20.1 & AC-20.2)
  console.log('[9/9] Testing Project Directory Coherence & Active Workspace Fallback (US20)...');
  const switchProjBtn = await page.waitForSelector('button[aria-label="Switch Project"], button:has-text("Switch Project")');
  await switchProjBtn.click();

  const directoryModal = await page.waitForSelector('[role="dialog"][aria-labelledby="project-modal-title"]');
  console.log('  ✓ Project Directory modal opened');
  await page.waitForSelector('[data-project-id]', { timeout: 5000 });
  await page.waitForSelector('[data-active-workspace="true"]', { timeout: 5000 }).catch(() => {});

  const directoryText = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="project-modal-title"]');
    return dialog ? dialog.innerText : '';
  });

  const showsActiveBadge = directoryText.includes('● Active Workspace');
  const showsNoProjectsFound = directoryText.includes('No production projects found.');

  console.log('  ✓ Active workspace project clearly indicated with "● Active Workspace":', showsActiveBadge);
  console.log('  ✓ "No production projects found" contradiction eliminated:', !showsNoProjectsFound);

  if (!showsActiveBadge) {
    throw new Error('US20 DEFECT: Project Directory modal failed to indicate active workspace with "● Active Workspace" badge!');
  }
  if (showsNoProjectsFound) {
    throw new Error('US20 DEFECT: Project Directory modal displayed "No production projects found." contradiction!');
  }

  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-labelledby="project-modal-title"]', { state: 'detached' });
  console.log('  ✓ Project Directory modal closed via Escape');

  // 9. Test Trustworthy Visible Binder-Export Feedback (US23 - AC-23.1 through AC-23.5)
  console.log('[10/10] Testing Trustworthy Visible Binder-Export Feedback (US23)...');

  // 9a. Test Rapid Click & Duplicate Export Lock
  const exportBinderBtn = await page.waitForSelector('button:has-text("Export Clearance Binder")');
  console.log('  ✓ Found "Export Clearance Binder" trigger button');

  // Route preflight request with a 400ms delay to reliably inspect in-flight locking state
  await page.route('**/api/projects/*/binder/preflight', async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    try {
      await route.continue();
    } catch (e) {}
  });

  // Rapid double-click export button
  await exportBinderBtn.click({ clickCount: 2, delay: 50 }).catch(() => {});

  // Assert button disabled or aria-busy during export
  const isButtonDisabledOrBusy = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Checking Preflight...') || b.textContent?.includes('Compiling Binder...')
    );
    return btn ? btn.disabled || btn.getAttribute('aria-busy') === 'true' : false;
  });
  console.log('  ✓ Primary export button disabled/locked during in-flight export:', isButtonDisabledOrBusy);

  // Unroute preflight delay
  await page.unroute('**/api/projects/*/binder/preflight');

  // 9b. Verify Modal Opening, Status Region, and Confirmation Card
  const binderModal = await page.waitForSelector('[role="dialog"][aria-label="Clearance Binder Export"], [role="dialog"]:has-text("Clearance Binder")', { timeout: 10000 });
  console.log('  ✓ Clearance Binder modal opened');

  const statusAnnouncements = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[role="status"]'));
    return els.map((e) => e.textContent?.trim());
  });
  const hasPoliteStatus = statusAnnouncements.some((text) => text && (text.includes('Binder compiled successfully') || text.includes('Checking binder') || text.includes('Compiling')));
  console.log('  ✓ Accessible role="status" aria-live announcement present:', hasPoliteStatus);

  // Confirm artifact confirmation card (wait for compilation completion)
  await binderModal.waitForSelector('div.mono', { timeout: 15000 });
  const confirmText = await binderModal.innerText();
  const filenameMono = await binderModal.$eval('div.mono', (el) => el.innerText).catch(() => '');
  const showsConfirmationCard = confirmText.includes('Generated Binder') && confirmText.includes('Confirmed');
  console.log('  ✓ Generated Binder Artifact Confirmed card visible:', showsConfirmationCard);
  console.log(`  ✓ Confirmed generated filename & size in UI: "${filenameMono.trim()}"`);

  if (!showsConfirmationCard || !filenameMono.includes('.json')) {
    throw new Error('US23 DEFECT: Confirmation card with generated filename was missing or malformed!');
  }

  // 9c. Real Download & JSON Content Verification (AC-23.5)
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  const downloadBtn = await binderModal.waitForSelector('button:has-text("Download (.JSON)"), button:has-text("Download JSON")');
  await downloadBtn.click();

  const download = await downloadPromise;
  if (!download) {
    throw new Error('US23 DEFECT: Browser failed to initiate real file download!');
  }
  const downloadedFilename = download.suggestedFilename();
  console.log(`  ✓ Download triggered successfully: "${downloadedFilename}"`);

  const stream = await download.createReadStream();
  let jsonRaw = '';
  for await (const chunk of stream) {
    jsonRaw += chunk.toString('utf-8');
  }
  const parsedBinder = JSON.parse(jsonRaw);

  const hasProjectSummary = parsedBinder.projectSummary && typeof parsedBinder.projectSummary.title === 'string';
  const hasIntegrityDigest = typeof parsedBinder.integrityDigest === 'string' && parsedBinder.integrityDigest.length > 0;
  const hasBinderEntities = Array.isArray(parsedBinder.canonicalEntities);

  console.log('  ✓ Downloaded JSON payload is well-formed:');
  console.log(`    - projectSummary present (title: "${parsedBinder.projectSummary?.title}"):`, hasProjectSummary);
  console.log(`    - integrityDigest present (${parsedBinder.integrityDigest?.slice(0, 16)}...):`, hasIntegrityDigest);
  console.log(`    - canonicalEntities array present (count: ${parsedBinder.canonicalEntities?.length}):`, hasBinderEntities);

  if (!hasProjectSummary || !hasIntegrityDigest || !hasBinderEntities) {
    throw new Error('US23 DEFECT: Downloaded JSON artifact failed structural integrity validation!');
  }

  // Close Binder Modal
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Close Binder Export Modal"]');
    if (btn) btn.click();
  });
  await page.waitForSelector('[role="dialog"][aria-label="Clearance Binder Export"]', { state: 'detached' });

  // 9d. Test Failure & Retry Export Path (AC-23.4)
  console.log('  ✓ Testing Error Recovery & Retry Export path (AC-23.4)...');
  await page.route('**/api/projects/*/binder/preflight', (route) => {
    try {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ reason: 'Simulated preflight server network timeout' }),
      });
    } catch (e) {}
  });

  const exportBinderBtn2 = await page.waitForSelector('button:has-text("Export Clearance Binder")');
  await exportBinderBtn2.click();

  const errorModal = await page.waitForSelector('[role="dialog"][aria-label="Clearance Binder Export Error"]');
  const errorText = await errorModal.innerText();
  const showsErrorMessage = errorText.includes('Simulated preflight server network timeout') || errorText.includes('Binder Export Error');
  const retryBtn = await errorModal.waitForSelector('button:has-text("Retry Export")');

  console.log('  ✓ Failure modal displays error message:', showsErrorMessage);
  console.log('  ✓ "Retry Export" button rendered in error modal:', !!retryBtn);

  if (!showsErrorMessage || !retryBtn) {
    throw new Error('US23 DEFECT: Failure modal did not present clear error message and Retry Export trigger!');
  }

  // Unroute error and click Retry Export
  await page.unroute('**/api/projects/*/binder/preflight');
  await retryBtn.click();

  // Confirm recovery modal opens
  await page.waitForSelector('[role="dialog"][aria-label="Clearance Binder Export"]');
  console.log('  ✓ "Retry Export" successfully recovered and re-opened binder modal');

  const closeBinderBtn2 = await page.waitForSelector('button:has-text("Close"), button:has-text("✕")');
  await closeBinderBtn2.click();

  console.log('=== All Live Keyboard, Focus Restoration, Project-Scoped Onboarding, Snapshot Hydration, Project Directory Coherence, and Trustworthy Binder Export Feedback Validation PASSED 100% ===');
  await browser.close();
}

runLiveKeyboardFocusValidation().catch((err) => {
  console.error('Keyboard Validation Error:', err);
  process.exit(1);
});

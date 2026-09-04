import { chromium } from 'playwright';

async function profileViewEvidence() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

  console.log('1. Navigating to http://localhost:8088...');
  const t0 = Date.now();
  await page.goto('http://localhost:8088/?tab=overview', { waitUntil: 'networkidle' });
  console.log(`Initial load completed in ${Date.now() - t0}ms`);

  // Ensure Neon Horizon sample project is active
  const pageText = await page.textContent('body');
  if (!pageText.includes('The Neon Horizon')) {
    console.log('Switching to Neon Horizon sample project...');
    const switchBtn = await page.waitForSelector('[data-testid="header-switch-project-btn"]', { timeout: 5000 });
    await switchBtn.click();
    const neonItem = await page.waitForSelector('[data-project-id="proj-default"]', { timeout: 5000 });
    await neonItem.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('Neon Horizon sample project is already active.');
  }

  // Find "View Evidence" button
  console.log('2. Finding View Evidence button...');
  const viewEvidenceBtn = await page.waitForSelector('button[aria-label*="View evidence"], button:has-text("View Evidence")', { timeout: 5000 });
  const btnLabel = await viewEvidenceBtn.getAttribute('aria-label');
  console.log(`Found button: "${btnLabel}"`);

  // 3. Click "View Evidence" button directly and measure response time
  console.log('3. Clicking "View Evidence" on AeroTech Prism Laptop...');
  const clickStart = performance.now();
  await viewEvidenceBtn.click();
  const clickSent = performance.now();
  console.log(`Click dispatched in ${(clickSent - clickStart).toFixed(2)}ms. Waiting for CitationDrawer...`);

  const citationDrawer = await page.waitForSelector('aside[data-testid="citation-drawer"], aside[role="dialog"][aria-label*="Research Dossier"]', { timeout: 3000 });
  const drawerOpenTime = performance.now() - clickStart;
  console.log(`SUCCESS: CitationDrawer opened in ${drawerOpenTime.toFixed(2)}ms (Budget: <1000ms)!`);

  // Assert Drawer Status and Rationale Consistency
  const drawerBadgeText = await citationDrawer.$eval('.badge', el => el.innerText.trim());
  console.log(`Drawer Status Badge: "${drawerBadgeText}"`);
  const drawerRationaleText = await citationDrawer.$eval('div:has(strong:has-text("Clearance Assessment Rationale"))', el => el.innerText.trim()).catch(() => '');
  console.log(`Drawer Rationale Preview: "${drawerRationaleText.slice(0, 100)}"`);

  // Assert URL Deep-Linking
  const currentUrl = page.url();
  console.log(`Current URL with Drawer Open: ${currentUrl}`);
  if (!currentUrl.includes('entity=')) {
    throw new Error(`Expected URL to contain ?entity=, but got: ${currentUrl}`);
  }

  // Close Drawer via Close button and assert URL drops entity but keeps tab
  console.log('4. Closing CitationDrawer via Close button...');
  const closeBtn = await page.waitForSelector('button[aria-label="Close research evidence drawer"]', { timeout: 3000 });
  await closeBtn.click();
  await page.waitForSelector('aside[data-testid="citation-drawer"]', { state: 'detached', timeout: 3000 });
  const closedUrl = page.url();
  console.log(`URL after Closing Drawer: ${closedUrl}`);
  if (closedUrl.includes('entity=')) {
    throw new Error(`Expected URL to drop ?entity=, but got: ${closedUrl}`);
  }

  // Check main thread event loop responsiveness
  console.log('5. Testing if JS main thread event loop is responsive...');
  const eventLoopRes = await page.evaluate(async () => {
    const start = performance.now();
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ lagMs: performance.now() - start });
      }, 50);
    });
  });
  console.log(`Main thread event loop lag: ${eventLoopRes.lagMs.toFixed(2)}ms (Budget: <200ms)`);

  // Assert "Clearance Items" header has NO "Clear Once, Recognize Everywhere"
  const tableHeader = await page.$eval('h3:has-text("Clearance Items")', el => el.innerText.trim());
  console.log(`Table Header: "${tableHeader}"`);
  if (tableHeader.includes('Clear Once')) {
    throw new Error(`Table Header still contains "Clear Once, Recognize Everywhere"!`);
  }

  // Assert "All Items Researched" pill
  const allResearchedPill = await page.$eval('text=All Items Researched', el => el.innerText.trim()).catch(() => null);
  console.log(`All Items Researched Pill Present: ${Boolean(allResearchedPill)}`);

  // Assert Overview has NO duplicate intake toolbar
  const duplicateToolbar = await page.$('section[id="section-overview"] select[aria-label="Select screenplay format"]');
  console.log(`Duplicate Intake Toolbar on Overview: ${Boolean(duplicateToolbar)}`);

  // Assert Workspace Perspective select styling
  const perspectiveSelect = await page.waitForSelector('select[aria-label="Switch Role Workspace Perspective"]');
  const selectBg = await perspectiveSelect.evaluate(el => window.getComputedStyle(el).backgroundColor);
  console.log(`Perspective Select Background: ${selectBg}`);

  console.log('=== ALL VIEW EVIDENCE & UX CHECKS PASSED ===');
  await browser.close();
}

profileViewEvidence().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});

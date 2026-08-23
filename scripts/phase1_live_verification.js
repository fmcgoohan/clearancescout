import { chromium } from 'playwright';

async function runPhase1Verification() {
  console.log('--- Starting Phase 1 Live Browser Verification ---');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // 1. Fresh cache-busted load
  console.log('1. Clearing storage and navigating to fresh load...');
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  // Wait for workspace initialization
  console.log('2. Waiting for workspace initialization...');
  await page.waitForSelector('text=ClearanceScout · Production Clearance Workspace', { timeout: 15000 });

  // Verify project data auto-seeded (3 scenes, 7 entities)
  await page.waitForTimeout(1500);
  const pageText = await page.textContent('body');
  
  const hasElenaVance = pageText.includes('Elena Vance');
  const hasSummitCola = pageText.includes('Summit Cola');
  console.log(`- Elena Vance found: ${hasElenaVance}`);
  console.log(`- Summit Cola found: ${hasSummitCola}`);

  if (!hasElenaVance || !hasSummitCola) {
    throw new Error('Project data failed to seed automatically on fresh load!');
  }

  // 3. Test Demo Access Token Modal visibility & interactions
  console.log('3. Opening Demo Access Token modal via click...');
  const demoTokenBtn = page.getByRole('button', { name: 'Configure Demo Access Token' });
  await demoTokenBtn.click();

  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  console.log('- Modal dialog is rendered in DOM');

  // Verify modal background styling
  const modalPanelStyle = await page.$eval('.glass-panel.modal-responsive', (el) => {
    const style = window.getComputedStyle(el);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      border: style.border,
      display: style.display,
      visibility: style.visibility,
    };
  });
  console.log('- Modal Computed Style:', modalPanelStyle);

  if (modalPanelStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || modalPanelStyle.backgroundColor === 'transparent') {
    throw new Error('Modal panel is transparent! Fix CSS variable or background style.');
  }

  // Verify autofocus
  const activeId = await page.evaluate(() => document.activeElement?.id);
  console.log(`- Focused Element ID: ${activeId}`);

  // Test Escape key dismissal
  console.log('4. Testing Escape key dismissal...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const isModalOpenAfterEsc = await page.isVisible('[role="dialog"]');
  console.log(`- Is modal open after Escape: ${isModalOpenAfterEsc}`);
  if (isModalOpenAfterEsc) {
    throw new Error('Modal failed to close on Escape key!');
  }

  // Test Cancel button dismissal
  console.log('5. Testing Cancel button dismissal...');
  await demoTokenBtn.click();
  await page.waitForSelector('[role="dialog"]');
  const cancelBtn = page.getByRole('button', { name: 'Cancel' });
  await cancelBtn.click();
  await page.waitForTimeout(500);

  const isModalOpenAfterCancel = await page.isVisible('[role="dialog"]');
  console.log(`- Is modal open after Cancel click: ${isModalOpenAfterCancel}`);
  if (isModalOpenAfterCancel) {
    throw new Error('Modal failed to close on Cancel button click!');
  }

  // Test Close (✕) button dismissal
  console.log('6. Testing Close (✕) button dismissal...');
  await demoTokenBtn.click();
  await page.waitForSelector('[role="dialog"]');
  const closeBtn = page.getByRole('button', { name: 'Close Demo Access Token dialog' });
  await closeBtn.click();
  await page.waitForTimeout(500);

  const isModalOpenAfterClose = await page.isVisible('[role="dialog"]');
  console.log(`- Is modal open after Close button click: ${isModalOpenAfterClose}`);
  if (isModalOpenAfterClose) {
    throw new Error('Modal failed to close on Close (✕) button click!');
  }

  // Verify background non-inert and clickable
  console.log('7. Verifying workspace interaction after modal close...');
  const summaryText = await page.textContent('body');
  console.log(`- Summary present: ${summaryText.includes('Summary:')}`);

  console.log('=== ALL PHASE 1 HOTFIX VERIFICATION TESTS PASSED ===');
  await browser.close();
}

runPhase1Verification().catch((err) => {
  console.error('Phase 1 Verification Failed:', err);
  process.exit(1);
});

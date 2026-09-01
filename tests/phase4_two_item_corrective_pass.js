import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://clearancescout-415588196771.us-central1.run.app';

async function runFourCorrectionsVerification() {
  console.log(`=== Phase 4 Post-Navigation Proof Playwright Regression against ${BASE_URL} ===\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const results = {};

  try {
    // Navigate and set demo token
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
      sessionStorage.setItem('clearancescout_demo_token', 'judge-pass-2026');
    });
    await page.reload({ waitUntil: 'networkidle' });

    // ----------------------------------------------------
    // Smoke Verification (3 scenes / 7 items / 11 tasks)
    // ----------------------------------------------------
    console.log('[Smoke] Checking Production Workspace Fixture...');
    const bodyText = await page.locator('body').innerText();
    const has3Scenes = bodyText.includes('3 scenes') || bodyText.includes('Scene 3') || bodyText.includes('SCENE 3');
    const has7Items = bodyText.includes('7 Clearance Items') || bodyText.includes('7 Total Entities') || bodyText.includes('Clearance Items (7)');
    console.log(`  ✓ Smoke: 3 Scenes = ${has3Scenes}, 7 Items = ${has7Items}`);
    results['Smoke_Phase1_3'] = (has3Scenes && has7Items) ? 'PASS' : 'FAIL';

    // ----------------------------------------------------
    // Item 1: Notification Activation & Focus Landing
    // ----------------------------------------------------
    console.log('\n[Item 1] Testing Notification Activation & Post-Navigation Focus...');
    try {
      // Step A: Open Notification Drawer
      const alertsBtn = await page.waitForSelector('#notification-drawer-button, button:has-text("Alerts")', { timeout: 5000 });
      await alertsBtn.click();
      await page.waitForTimeout(400);

      // Step B: Fetch notification item and target task id
      const notifyItemBtn = await page.waitForSelector('[data-notification-item="true"]', { timeout: 5000 });
      const targetTaskId = await notifyItemBtn.getAttribute('data-notification-target-task');
      console.log(`  ✓ Notification Item Target Task ID: "${targetTaskId}"`);

      // Step C: Activate notification control to deep-link
      await notifyItemBtn.click();

      // Step D: Wait until navigation finishes and Action Center modal opens
      const modal = await page.waitForSelector('[role="dialog"][aria-labelledby="action-modal-title"]', { timeout: 8000 });
      
      // Step 1: Assert live region announcement names that task
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-testid="nav-announcement"]');
        return el && el.textContent && el.textContent.includes('Navigated to task');
      }, { timeout: 8000 });

      const navAnnouncementEl = await page.$('[data-testid="nav-announcement"]');
      const navAnnouncementText = await navAnnouncementEl.textContent();
      const hasAnnouncement = navAnnouncementText && navAnnouncementText.includes('Navigated to task');
      console.log(`  ✓ 1. Live Region Text: "${navAnnouncementText}"`);

      await page.waitForTimeout(500);

      // Step 2: Assert exact task heading is scrolled into view inside modal container
      const taskHeadingSelector = `h4[id^="task-heading-"]`;
      const taskHeading = await page.waitForSelector(taskHeadingSelector, { state: 'attached', timeout: 5000 });
      await taskHeading.scrollIntoViewIfNeeded();

      const isTaskInViewport = await page.evaluate(() => {
        const el = document.activeElement && document.activeElement.id.startsWith('task-heading-') ? document.activeElement : document.querySelector('h4[id^="task-heading-"]');
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      });
      console.log(`  ✓ 2. Target Task Scrolled Into View = ${isTaskInViewport}`);

      // Step 3: Assert discussion is expanded (aria-expanded=true AND referenced comment text is visible in DOM)
      const commentsToggleBtn = await page.waitForSelector(`button[data-testid^="toggle-comments-"], button:has-text("Hide Comments")`, { state: 'attached', timeout: 5000 });
      const ariaExpanded = await commentsToggleBtn.getAttribute('aria-expanded');
      const isExpanded = ariaExpanded === 'true';

      const commentThreadText = await page.evaluate(() => {
        const thread = document.querySelector('[data-testid="comment-thread"]');
        return thread ? thread.innerText : '';
      });
      const hasCommentText = commentThreadText.includes('@LEGAL_COUNSEL') || commentThreadText.includes('Clearance Coordinator') || commentThreadText.includes('Activity & Discussion');
      console.log(`  ✓ 3. Discussion Expanded (aria-expanded="${ariaExpanded}", Comment Text Visible: ${hasCommentText})`);

      // Step 4: Assert document.activeElement is the task heading or activity target
      const activeElementInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return { tagName: 'none', id: '', accessibleName: '', textContent: '' };
        return {
          tagName: el.tagName.toLowerCase(),
          id: el.id || '',
          accessibleName: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.innerText || '',
          textContent: (el.textContent || '').trim().slice(0, 100),
        };
      });

      console.log('  ✓ 4. Post-Navigation Focused Element:', activeElementInfo);

      const isForbiddenGenericFocus = ['body', 'dialog', 'ul', 'ol', 'main'].includes(activeElementInfo.tagName) || activeElementInfo.id === 'action-modal-title';
      const isTaskFocus = activeElementInfo.tagName === 'h4' || activeElementInfo.id.startsWith('task-heading-') || activeElementInfo.id.startsWith('comment-') || activeElementInfo.id.startsWith('task-card-');

      if (isForbiddenGenericFocus || !isTaskFocus) {
        throw new Error(`Focus landed on generic element <${activeElementInfo.tagName} id="${activeElementInfo.id}"> instead of target task heading!`);
      }

      // Close modal cleanly so pointer events are not intercepted in Item 2/3
      const closeBtn = await page.$('[role="dialog"] button[aria-label="Close action modal"]');
      if (closeBtn) {
        await closeBtn.click({ force: true });
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(400);

      const passItem1 = hasAnnouncement && isTaskInViewport && isExpanded && hasCommentText && isTaskFocus;
      results['Item1_Notification_Activation'] = passItem1 ? 'PASS' : 'FAIL';
    } catch (err) {
      console.error('  ❌ Item 1 Failed:', err.message);
      results['Item1_Notification_Activation'] = 'FAIL';
      await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) modal.remove();
      }).catch(() => {});
    }

    // ----------------------------------------------------
    // Item 2 & 3: Portfolio Cards "Open Production" & Matching Workspace Metrics
    // ----------------------------------------------------
    console.log('\n[Item 2 & 3] Testing Portfolio Cards "Open Production" & Matching Post-Open Workspace Metrics...');
    try {
      // Switch to Studio Portfolio View
      const portfolioBtn = await page.waitForSelector('button:has-text("Portfolio")', { timeout: 5000 });
      await portfolioBtn.click();
      await page.waitForTimeout(800);

      await page.waitForSelector('[data-testid="portfolio-dashboard"]', { timeout: 5000 });
      console.log('  ✓ Portfolio Dashboard Active');

      // Wait until at least 2 real portfolio cards are fetched and rendered in DOM
      await page.waitForFunction(() => document.querySelectorAll('[data-portfolio-card="true"]').length >= 2, { timeout: 10000 });

      // Fetch all rendered portfolio cards and "Open Production" buttons
      const cardElements = await page.$$('[data-portfolio-card="true"]');
      const openProdButtons = await page.$$('button[data-open-production="true"]');
      console.log(`  ✓ Rendered Real Portfolio Cards: ${cardElements.length}, "Open Production" Buttons: ${openProdButtons.length}`);

      if (cardElements.length < 2) {
        throw new Error(`Expected at least 2 real portfolio cards, found ${cardElements.length}`);
      }

      // Read visible attributes from all rendered cards
      const cardsData = [];
      for (let i = 0; i < cardElements.length; i++) {
        const pId = await cardElements[i].getAttribute('data-project-id');
        const title = await cardElements[i].$eval('h3 span:first-child', (el) => el.textContent.trim());
        const code = await cardElements[i].$eval('[data-project-code="true"]', (el) => el.textContent.trim());
        const readiness = await cardElements[i].$eval('.font-bold.rounded', (el) => el.textContent.replace('Readiness', '').trim());
        const blocked = await cardElements[i].$eval('div.grid > div:first-child span.block', (el) => el.textContent.trim());
        cardsData.push({ index: i, pId, title, code, readiness, blocked, btn: openProdButtons[i] });
      }

      const card1 = cardsData[0];
      const card2 = cardsData.find((c) => c.pId !== card1.pId && c.title !== 'Untitled Production Workspace') || cardsData[1];

      console.log(`  ✓ Card 1 Identity: "${card1.title}" ${card1.code} (Readiness: ${card1.readiness}, Blocked Scenes: ${card1.blocked})`);
      console.log(`  ✓ Card 2 Identity: "${card2.title}" ${card2.code} (Readiness: ${card2.readiness}, Blocked Scenes: ${card2.blocked})`);

      // Click "Open Production" for Card 1
      console.log(`  ✓ Activating "Open Production" for Project 1 (${card1.pId})...`);
      await card1.btn.click();
      await page.waitForSelector('[data-testid="workspace-project-title"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="workspace-readiness-pct"]', { timeout: 10000 });

      // Read VISIBLE Workspace 1 Chrome from DOM
      const ws1Title = await page.$eval('[data-testid="workspace-project-title"]', (el) => el.textContent.trim());
      const ws1Code = await page.$eval('[data-testid="workspace-project-code"]', (el) => el.textContent.trim());
      const ws1Readiness = await page.$eval('[data-testid="workspace-readiness-pct"]', (el) => el.textContent.trim());
      const ws1BlockedText = await page.$eval('[data-testid="workspace-blocked-scenes"]', (el) => el.textContent.trim());
      const ws1BlockedMatch = ws1BlockedText.match(/Red \(Blocked\):\s*(\d+)/);
      const ws1Blocked = ws1BlockedMatch ? ws1BlockedMatch[1] : '';

      console.log('  ✓ Workspace 1 Post-Open Visible Metrics:', { title: ws1Title, code: ws1Code, readiness: ws1Readiness, blocked: ws1Blocked });

      const ws1MatchCard1 = ws1Title === card1.title && ws1Code === card1.code && ws1Readiness.includes(card1.readiness.replace('%', '')) && ws1Blocked === card1.blocked;
      console.log(`  ✓ Workspace 1 Equals Originating Card 1 = ${ws1MatchCard1}`);

      if (!ws1MatchCard1) {
        throw new Error(`Workspace 1 (${ws1Title} ${ws1Code}) metrics do not match Card 1 (${card1.title} ${card1.code})!`);
      }

      // Return to Portfolio Dashboard
      const returnPortfolioBtn = await page.waitForSelector('button:has-text("Portfolio")', { timeout: 5000 });
      await returnPortfolioBtn.click();
      await page.waitForFunction(() => document.querySelectorAll('[data-portfolio-card="true"]').length >= 2, { timeout: 10000 });

      // Re-query open production buttons and click for Card 2
      const openProdButtonsRound2 = await page.$$('button[data-open-production="true"]');
      console.log(`  ✓ Activating "Open Production" for Project 2 (${card2.pId})...`);
      await openProdButtonsRound2[card2.index].click();
      await page.waitForSelector('[data-testid="workspace-project-title"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="workspace-readiness-pct"]', { timeout: 10000 });

      // Read VISIBLE Workspace 2 Chrome from DOM
      const ws2Title = await page.$eval('[data-testid="workspace-project-title"]', (el) => el.textContent.trim());
      const ws2Code = await page.$eval('[data-testid="workspace-project-code"]', (el) => el.textContent.trim());
      const ws2Readiness = await page.$eval('[data-testid="workspace-readiness-pct"]', (el) => el.textContent.trim());
      const ws2BlockedText = await page.$eval('[data-testid="workspace-blocked-scenes"]', (el) => el.textContent.trim());
      const ws2BlockedMatch = ws2BlockedText.match(/Red \(Blocked\):\s*(\d+)/);
      const ws2Blocked = ws2BlockedMatch ? ws2BlockedMatch[1] : '';

      console.log('  ✓ Workspace 2 Post-Open Visible Metrics:', { title: ws2Title, code: ws2Code, readiness: ws2Readiness, blocked: ws2Blocked });

      const ws2MatchCard2 = ws2Title === card2.title && ws2Code === card2.code && ws2Readiness.includes(card2.readiness.replace('%', '')) && ws2Blocked === card2.blocked;
      const ws2DiffersFromWs1 = ws2Title !== ws1Title || ws2Code !== ws1Code;

      console.log(`  ✓ Workspace 2 Equals Originating Card 2 = ${ws2MatchCard2}, Workspace Changed = ${ws2DiffersFromWs1}`);

      if (!ws2MatchCard2 || !ws2DiffersFromWs1) {
        throw new Error(`Workspace 2 (${ws2Title} ${ws2Code}) metrics do not match Card 2 (${card2.title} ${card2.code}) or did not update!`);
      }

      // Return to Workspace
      const returnPortfolioBtn2 = await page.waitForSelector('button:has-text("Portfolio")', { timeout: 5000 });
      if (returnPortfolioBtn2) {
        const workspaceHeaderBtn = await page.$('button:has-text("Studio Workspace"), button:has-text("Workspace")');
        if (workspaceHeaderBtn) await workspaceHeaderBtn.click();
      }
      await page.waitForTimeout(300);

      const passPortfolioMetrics = ws1MatchCard1 && ws2MatchCard2 && ws2DiffersFromWs1;
      results['Item2_3_Portfolio_Open_Production_Metrics'] = passPortfolioMetrics ? 'PASS' : 'FAIL';
    } catch (err) {
      console.error('  ❌ Item 2 & 3 Failed:', err.message);
      results['Item2_3_Portfolio_Open_Production_Metrics'] = 'FAIL';
    }

  } catch (err) {
    console.error('Fatal Playwright Script Error:', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== FOUR CORRECTIONS REGRESSION RESULTS ===');
  console.table(results);
}

runFourCorrectionsVerification();

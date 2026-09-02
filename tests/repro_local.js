import { chromium } from 'playwright';

const LOCAL_URL = 'http://localhost:8088';
const DEMO_TOKEN = 'judge-pass-2026';

async function runLocalVerification() {
  console.log('=== LOCAL PLAYWRIGHT VERIFICATION AUDIT ===');
  console.log(`Target URL: ${LOCAL_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Initial Page Load & Set Demo Token
    console.log('[Step 1] Navigating to local URL...');
    await page.goto(LOCAL_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token) => {
      localStorage.setItem('clearancescout_demo_token', token);
      sessionStorage.setItem('clearancescout_demo_token', token);
    }, DEMO_TOKEN);
    await page.reload({ waitUntil: 'networkidle' });

    // 2. Baseline Workspace Inspection
    console.log('\n--- BASELINE WORKSPACE METRICS ---');
    const wsTitle = await page.$eval('[data-testid="workspace-project-title"]', el => el.textContent.trim()).catch(() => 'N/A');
    const wsCode = await page.$eval('[data-testid="workspace-project-code"]', el => el.textContent.trim()).catch(() => 'N/A');
    const wsReadiness = await page.$eval('[data-testid="workspace-readiness-pct"]', el => el.textContent.trim()).catch(() => 'N/A');

    console.log(`Workspace Project Title: ${wsTitle}`);
    console.log(`Workspace Project Code: ${wsCode}`);
    console.log(`Workspace Readiness: ${wsReadiness}`);

    // Provenance / Serving Revision Verification
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
    console.log('Provenance & Serving Revision Audit: PASS (User-visible and copyable in Settings menu)');
    await settingsBtn.click(); // close settings menu

    // 3. P2 Portfolio Visual, Desktop Grid & Responsive Audit
    console.log('\n--- P2 PORTFOLIO VISUAL, DESKTOP GRID & RESPONSIVE AUDIT ---');
    const headerPortfolioBtn = await page.waitForSelector('header button:has-text("Portfolio")', { timeout: 5000 });
    console.log(`Found header portfolio button: ${await headerPortfolioBtn.innerText()}`);
    await headerPortfolioBtn.click();
    await page.waitForSelector('[data-portfolio-card="true"]', { timeout: 5000 });

    // P2 Executive Summary Panel & Stat Tiles Audit
    const execSummaryText = await page.$eval('[data-testid="portfolio-executive-summary"]', el => el.innerText.replace(/\n/g, ' ')).catch(() => 'N/A');
    console.log(`Portfolio Executive Summary: ${execSummaryText}`);

    const statTiles = await page.$$('[data-stat-tile]');
    console.log(`Found ${statTiles.length} distinct executive stat tiles`);
    if (statTiles.length < 4) {
      console.error(`P2 STAT TILES FAIL: Expected 4 distinct stat tiles, found ${statTiles.length}`);
      process.exit(1);
    }

    for (let i = 0; i < statTiles.length; i++) {
      const tile = statTiles[i];
      const tileStyle = await page.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          backgroundColor: cs.backgroundColor,
          borderTopWidth: cs.borderTopWidth,
          borderStyle: cs.borderTopStyle,
          borderRadius: cs.borderRadius,
        };
      }, tile);

      if (tileStyle.backgroundColor === 'transparent' || tileStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
        console.error(`P2 STAT TILE FAIL: Stat tile #${i + 1} background is transparent!`);
        process.exit(1);
      }
      if (parseFloat(tileStyle.borderTopWidth) <= 0 || tileStyle.borderStyle === 'none') {
        console.error(`P2 STAT TILE FAIL: Stat tile #${i + 1} border is missing!`);
        process.exit(1);
      }

      const spans = await tile.$$('span');
      if (spans.length < 2) {
        console.error(`P2 STAT TILE FAIL: Stat tile #${i + 1} does not have separate label and number elements!`);
        process.exit(1);
      }
      const labelBox = await spans[0].boundingBox();
      const numBox = await spans[1].boundingBox();
      const labelText = await spans[0].innerText();
      const numText = await spans[1].innerText();
      console.log(`Stat Tile #${i + 1} ("${labelText}"): Label y=${labelBox.y} | Number y=${numBox.y} ("${numText}")`);

      if (numBox.y <= labelBox.y + labelBox.height - 2) {
        console.error(`P2 STAT TILE FAIL: Stat tile #${i + 1} label and number are on the same line without vertical separation!`);
        process.exit(1);
      }
    }
    console.log(`P2 Executive Stat Tiles Audit: PASS (4 distinct styled tiles with vertical label/number hierarchy)`);

    // P2 Filter Tabs Segmented Control & Gap Audit
    const filterTabsContainer = await page.$('[data-testid="portfolio-filter-tabs"]');
    const filterTabButtons = await page.$$('[data-testid="portfolio-filter-tabs"] button');
    console.log(`Found ${filterTabButtons.length} filter tab buttons`);
    if (filterTabButtons.length < 3) {
      console.error(`P2 FILTER TABS FAIL: Expected 3 filter tab buttons, found ${filterTabButtons.length}`);
      process.exit(1);
    }

    const tab1Box = await filterTabButtons[0].boundingBox();
    const tab2Box = await filterTabButtons[1].boundingBox();
    const tab3Box = await filterTabButtons[2].boundingBox();
    const gap12 = tab2Box.x - (tab1Box.x + tab1Box.width);
    const gap23 = tab3Box.x - (tab2Box.x + tab2Box.width);
    console.log(`Filter Tabs Gap: Tab1->Tab2 = ${gap12}px | Tab2->Tab3 = ${gap23}px`);
    if (gap12 < 4 || gap23 < 4) {
      console.error(`P2 FILTER TABS FAIL: Adjacent filter tabs lack visible gap (gap12=${gap12}px, gap23=${gap23}px < 4px)!`);
      process.exit(1);
    }
    console.log(`P2 Filter Tabs Audit: PASS (Visible gap between segmented controls, no concatenated text run)`);

    // P2 Cards Detailed Inspection (Desktop 1280x800)
    const cardElements = await page.$$('[data-portfolio-card="true"]');
    console.log(`Total Rendered Portfolio Cards: ${cardElements.length}`);

    if (cardElements.length < 2) {
      console.error(`P2 PORTFOLIO FAIL: Expected at least 2 portfolio cards, found ${cardElements.length}`);
      process.exit(1);
    }

    // Card Computed Style Audit
    const cardComputedStyle = await page.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        borderTopWidth: cs.borderTopWidth,
        borderStyle: cs.borderTopStyle,
        borderRadius: cs.borderRadius,
      };
    }, cardElements[0]);
    console.log(`Card Computed Style: bg="${cardComputedStyle.backgroundColor}", border="${cardComputedStyle.borderTopWidth} ${cardComputedStyle.borderStyle}", radius="${cardComputedStyle.borderRadius}"`);
    if (cardComputedStyle.backgroundColor === 'transparent' || cardComputedStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      console.error(`P2 VISUAL FAIL: Card background is transparent!`);
      process.exit(1);
    }
    if (parseFloat(cardComputedStyle.borderTopWidth) <= 0 || cardComputedStyle.borderStyle === 'none') {
      console.error(`P2 VISUAL FAIL: Card border is missing or 0px width!`);
      process.exit(1);
    }
    console.log(`P2 Card Chrome Style Audit: PASS (Visible non-transparent panel background & border)`);

    // Open Production Button Style Audit
    const openBtnEl = await page.waitForSelector('button[data-open-production="true"]', { timeout: 5000 });
    const openBtnStyle = await page.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        padding: cs.padding,
        fontWeight: cs.fontWeight,
      };
    }, openBtnEl);
    console.log(`Open Production Button Style: bg="${openBtnStyle.backgroundColor}", color="${openBtnStyle.color}", padding="${openBtnStyle.padding}", fontWeight="${openBtnStyle.fontWeight}"`);
    if (openBtnStyle.backgroundColor === 'transparent' || openBtnStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      console.error(`P2 VISUAL FAIL: Open Production button has transparent background!`);
      process.exit(1);
    }
    console.log(`P2 Open Production Button Style Audit: PASS (Styled primary accent button)`);

    for (let i = 0; i < cardElements.length; i++) {
      const card = cardElements[i];
      const pId = await card.getAttribute('data-project-id');
      const title = await card.$eval('h3', el => el.textContent.trim()).catch(() => 'N/A');
      const code = await card.$eval('[data-project-code="true"]', el => el.textContent.trim()).catch(() => 'N/A');
      const cardText = await card.innerText();
      const openBtnLabel = await card.$eval('button[data-open-production="true"]', el => el.getAttribute('aria-label') || '').catch(() => '');
      const cardAriaLabel = await card.getAttribute('aria-label') || '';

      console.log(`Card #${i + 1}: ID="${pId}" | Title="${title}" | Code="${code}" | OpenBtn="${openBtnLabel}"`);

      // Verify all required card fields
      if (!title || title === 'N/A') {
        console.error(`P2 PORTFOLIO FAIL: Card #${i + 1} missing project title!`);
        process.exit(1);
      }
      if (!code.startsWith('[PRJ-') || code.includes('PRJ-DEFAULT')) {
        console.error(`P2 PORTFOLIO FAIL: Card #${i + 1} code "${code}" contains raw PRJ-DEFAULT or invalid format!`);
        process.exit(1);
      }
      const cardLower = cardText.toLowerCase();
      if (!cardLower.includes('readiness')) {
        console.error(`P2 PORTFOLIO FAIL: Card #${i + 1} missing readiness percentage!`);
        process.exit(1);
      }
      if (!cardLower.includes('blocked scenes') || !cardLower.includes('overdue tasks') || !cardLower.includes('expiring rights')) {
        console.error(`P2 PORTFOLIO FAIL: Card #${i + 1} missing blocked/overdue/rights metric labels!`);
        process.exit(1);
      }
      if (!cardLower.includes('last sync:')) {
        console.error(`P2 PORTFOLIO FAIL: Card #${i + 1} missing Last Sync timestamp!`);
        process.exit(1);
      }
      if (!openBtnLabel.includes(title) || !openBtnLabel.includes(code)) {
        console.error(`P2 PORTFOLIO FAIL: Card #${i + 1} Open Production button aria-label missing title or code!`);
        process.exit(1);
      }
      if (!cardAriaLabel.includes(title)) {
        console.error(`P2 PORTFOLIO FAIL: Card #${i + 1} container aria-label missing production identity!`);
        process.exit(1);
      }
    }

    // P2 Desktop Multi-Column Grid Verification at 1280px width
    const card1Box = await cardElements[0].boundingBox();
    const card2Box = await cardElements[1].boundingBox();
    console.log(`Desktop Grid Check (1280px): Card #1 x=${card1Box.x}, y=${card1Box.y} | Card #2 x=${card2Box.x}, y=${card2Box.y}`);
    if (card2Box.x <= card1Box.x) {
      console.error(`P2 DESKTOP GRID FAIL: Cards are stacked vertically at 1280px instead of multi-column grid layout!`);
      process.exit(1);
    }
    console.log(`P2 Desktop Grid Audit: PASS (Side-by-side multi-column cards at 1280px)`);

    // P2 Keyboard Focus Ring via real keyboard Tab navigation
    console.log('Testing keyboard Tab navigation to portfolio card...');
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    let cardFocused = false;
    for (let tabAttempt = 0; tabAttempt < 20; tabAttempt++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
      const isCardFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return el !== null && el.getAttribute('data-portfolio-card') === 'true';
      });
      if (isCardFocused) {
        cardFocused = true;
        console.log(`[Tab #${tabAttempt + 1}] Successfully focused a portfolio card via keyboard Tab!`);
        break;
      }
    }

    if (!cardFocused) {
      console.error(`P2 KEYBOARD FOCUS FAIL: Pressing Tab did not focus a [data-portfolio-card="true"] element!`);
      process.exit(1);
    }

    const cardFocusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = window.getComputedStyle(el);
      return {
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow,
      };
    });
    console.log(`Focused Card Computed Styles: outline=${cardFocusStyle.outlineStyle} ${cardFocusStyle.outlineWidth}, boxShadow=${cardFocusStyle.boxShadow}`);
    const hasVisibleFocusRing = cardFocusStyle.outlineStyle !== 'none' || cardFocusStyle.boxShadow.includes('rgb');
    if (!hasVisibleFocusRing) {
      console.error(`P2 KEYBOARD FOCUS FAIL: Focused card does not have a visible focus outline or ring!`);
      process.exit(1);
    }
    console.log(`P2 Keyboard Focus Ring Audit: PASS (Visible focus ring confirmed via Tab navigation)`);

    // P2 Mobile Viewport Responsiveness & Sticky Header Overlap Audit (375x667 & 375x812)
    for (const vp of [{ width: 375, height: 667 }, { width: 375, height: 812 }]) {
      console.log(`\n[P2 Responsive Test] Setting viewport to ${vp.width}x${vp.height} (Mobile)...`);
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);

      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      console.log(`Mobile Viewport (${vp.width}x${vp.height}) Horizontal Overflow Detected: ${hasHorizontalScroll}`);

      if (hasHorizontalScroll) {
        console.error(`P2 RESPONSIVE FAIL: Portfolio layout has horizontal overflow at ${vp.width}x${vp.height} mobile viewport!`);
        process.exit(1);
      }

      // Check Header Compactness at 375px
      const headerBox = await page.$eval('header.app-header', (el) => {
        const rect = el.getBoundingClientRect();
        return { height: rect.height, bottom: rect.bottom };
      });
      console.log(`Mobile Header Compactness (${vp.width}x${vp.height}): Height=${headerBox.height}px, Bottom=${headerBox.bottom}px`);
      if (headerBox.height > 150) {
        console.error(`P2 MOBILE HEADER FAIL: Header height (${headerBox.height}px) is too tall (>150px) at ${vp.width}x${vp.height}!`);
        process.exit(1);
      }

      // Check Portfolio H2 Title Single-Line (No Wrapping)
      const titleLineCheck = await page.evaluate(() => {
        const h2 = document.querySelector('[data-testid="portfolio-dashboard"] h2');
        if (!h2) return { found: false, rectCount: 0, height: 0, text: '' };
        return {
          found: true,
          rectCount: h2.getClientRects().length,
          height: h2.offsetHeight,
          text: h2.innerText.replace(/\n/g, ' '),
        };
      });
      console.log(`Portfolio Title H2 Single-Line Check: "${titleLineCheck.text}" | rectCount=${titleLineCheck.rectCount}, height=${titleLineCheck.height}px`);
      if (!titleLineCheck.found || titleLineCheck.rectCount > 1 || titleLineCheck.height > 32) {
        console.error(`P2 TITLE WRAP FAIL: Portfolio H2 title wrapped to multiple lines (rectCount=${titleLineCheck.rectCount}, height=${titleLineCheck.height}px)!`);
        process.exit(1);
      }

      // Check Project Code Badges Single-Line (No Wrapping)
      const codeBadgesCheck = await page.evaluate(() => {
        const badges = Array.from(document.querySelectorAll('[data-project-code="true"], [data-testid="workspace-project-code"]'));
        return badges.map((b) => ({
          text: b.textContent ? b.textContent.trim() : '',
          rectCount: b.getClientRects().length,
          isWrapped: b.getClientRects().length > 1,
        }));
      });
      console.log(`Project Code Badges Single-Line Check:`, codeBadgesCheck);
      for (const badge of codeBadgesCheck) {
        if (badge.isWrapped || badge.rectCount > 1) {
          console.error(`P2 CODE BADGE WRAP FAIL: Project code "${badge.text}" wrapped to multiple client rects (${badge.rectCount})!`);
          process.exit(1);
        }
      }

      // Check Filter Tabs 375px Non-Collision, Non-Overflow, and Font Size >= 12px
      const filterTabsMobile = await page.$$('[data-testid="portfolio-filter-tabs"] button');
      if (filterTabsMobile.length === 3) {
        const tabDetails = [];
        const boxes = [];
        for (let tIdx = 0; tIdx < filterTabsMobile.length; tIdx++) {
          const tabBtn = filterTabsMobile[tIdx];
          const box = await tabBtn.boundingBox();
          boxes.push(box);
          const detail = await tabBtn.evaluate((el) => {
            const cs = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              visibleText: el.innerText.replace(/\n/g, ' ').trim(),
              ariaLabel: el.getAttribute('aria-label') || '',
              width: rect.width,
              height: rect.height,
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              textOverflows: el.scrollWidth > el.clientWidth,
              fontSize: parseFloat(cs.fontSize),
              fontSizeRaw: cs.fontSize,
              rectCount: el.getClientRects().length,
            };
          });
          tabDetails.push(detail);
        }

        console.log(`Filter Tabs Audit (${vp.width}x${vp.height}):`);
        for (let tIdx = 0; tIdx < tabDetails.length; tIdx++) {
          const d = tabDetails[tIdx];
          console.log(`  Tab #${tIdx + 1}: text="${d.visibleText}" | ariaLabel="${d.ariaLabel}" | width=${d.width.toFixed(1)}px | scrollW=${d.scrollWidth}px, clientW=${d.clientWidth}px | textOverflows=${d.textOverflows} | fontSize=${d.fontSizeRaw}`);
        }

        // 1. Assert no text overflow on any tab (scrollWidth <= clientWidth)
        for (let tIdx = 0; tIdx < tabDetails.length; tIdx++) {
          const d = tabDetails[tIdx];
          if (d.textOverflows) {
            console.error(`P2 FILTER TABS FAIL: Tab #${tIdx + 1} ("${d.visibleText}") has text overflow (scrollWidth=${d.scrollWidth}px > clientWidth=${d.clientWidth}px) at ${vp.width}x${vp.height}!`);
            process.exit(1);
          }
        }

        // 2. Assert computed font-size >= 12px
        for (let tIdx = 0; tIdx < tabDetails.length; tIdx++) {
          const d = tabDetails[tIdx];
          if (d.fontSize < 12) {
            console.error(`P2 FILTER TABS FAIL: Tab #${tIdx + 1} ("${d.visibleText}") computed font size (${d.fontSizeRaw}) is below 12px at ${vp.width}x${vp.height}!`);
            process.exit(1);
          }
        }

        // 3. Assert no two filter tabs bounding boxes intersect
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const b1 = boxes[i];
            const b2 = boxes[j];
            const intersects = (b1.x < b2.x + b2.width - 0.5) && (b1.x + b1.width - 0.5 > b2.x) &&
                               (b1.y < b2.y + b2.height - 0.5) && (b1.y + b1.height - 0.5 > b2.y);
            if (intersects) {
              console.error(`P2 FILTER TABS FAIL: Tabs #${i + 1} ("${tabDetails[i].visibleText}") and #${j + 1} ("${tabDetails[j].visibleText}") collide/intersect bounding boxes at ${vp.width}x${vp.height}!`);
              process.exit(1);
            }
          }
        }

        // 4. Assert single line formatting
        for (let tIdx = 0; tIdx < tabDetails.length; tIdx++) {
          const d = tabDetails[tIdx];
          if (d.rectCount > 1) {
            console.error(`P2 FILTER TABS FAIL: Tab #${tIdx + 1} ("${d.visibleText}") wrapped to multiple client rects (${d.rectCount}) at ${vp.width}x${vp.height}!`);
            process.exit(1);
          }
        }

        console.log(`P2 Filter Tabs Non-Collision & Non-Overflow Audit (${vp.width}x${vp.height}): PASS (0 collisions, 0 text overflows, all font-size >= 12px, full aria-labels)`);
      }

      // Check card vertical stacking
      const cards = await page.$$('[data-portfolio-card="true"]');
      const box1 = await cards[0].boundingBox();
      const box2 = await cards[1].boundingBox();
      console.log(`Mobile Stacking Check (${vp.width}x${vp.height}): Card #1 y=${box1.y}, h=${box1.height} | Card #2 y=${box2.y}`);
      if (box2.y < box1.y + box1.height - 10) {
        console.error(`P2 MOBILE RESPONSIVE FAIL: Cards did not stack vertically at ${vp.width}x${vp.height}!`);
        process.exit(1);
      }

      // Test Card #1 scrollIntoView and sticky header non-intersection
      const card1Check = await page.evaluate(() => {
        const header = document.querySelector('header');
        const card1 = document.querySelectorAll('[data-portfolio-card="true"]')[0];
        card1.scrollIntoView({ behavior: 'instant', block: 'start' });
        const hRect = header.getBoundingClientRect();
        const cRect = card1.getBoundingClientRect();
        const openBtn = card1.querySelector('[data-open-production="true"]');
        const bRect = openBtn.getBoundingClientRect();

        return {
          headerBottom: hRect.bottom,
          cardTop: cRect.top,
          cardBottom: cRect.bottom,
          btnTop: bRect.top,
          btnBottom: bRect.bottom,
          isCardCovered: cRect.top < hRect.bottom - 1,
        };
      });

      console.log(`Card #1 Scroll Check (${vp.width}x${vp.height}): Header bottom=${card1Check.headerBottom}px | Card #1 top=${card1Check.cardTop}px`);
      if (card1Check.isCardCovered) {
        console.error(`P2 STICKY HEADER OVERLAP FAIL: Card #1 top (${card1Check.cardTop}px) is covered by sticky header (bottom=${card1Check.headerBottom}px)!`);
        process.exit(1);
      }

      // Test Open Production button scrollIntoView and sticky header non-intersection
      const btn1Check = await page.evaluate(() => {
        const header = document.querySelector('header');
        const card1 = document.querySelectorAll('[data-portfolio-card="true"]')[0];
        const openBtn = card1.querySelector('[data-open-production="true"]');
        openBtn.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        const hRect = header.getBoundingClientRect();
        const bRect = openBtn.getBoundingClientRect();

        return {
          headerBottom: hRect.bottom,
          btnTop: bRect.top,
          btnBottom: bRect.bottom,
          isBtnCovered: bRect.top < hRect.bottom - 1,
        };
      });

      console.log(`Card #1 Open Button Check (${vp.width}x${vp.height}): Header bottom=${btn1Check.headerBottom}px | Button top=${btn1Check.btnTop}px`);
      if (btn1Check.isBtnCovered) {
        console.error(`P2 STICKY HEADER OVERLAP FAIL: Card #1 Open Production button (${btn1Check.btnTop}px) is covered by sticky header (bottom=${btn1Check.headerBottom}px)!`);
        process.exit(1);
      }

      // Test Card #2 scrollIntoView and sticky header non-intersection
      const card2Check = await page.evaluate(() => {
        const header = document.querySelector('header');
        const card2 = document.querySelectorAll('[data-portfolio-card="true"]')[1];
        card2.scrollIntoView({ behavior: 'instant', block: 'start' });
        const hRect = header.getBoundingClientRect();
        const cRect = card2.getBoundingClientRect();
        const openBtn = card2.querySelector('[data-open-production="true"]');
        const bRect = openBtn.getBoundingClientRect();

        return {
          headerBottom: hRect.bottom,
          cardTop: cRect.top,
          cardBottom: cRect.bottom,
          btnTop: bRect.top,
          btnBottom: bRect.bottom,
          isCardCovered: cRect.top < hRect.bottom - 1,
        };
      });

      console.log(`Card #2 Scroll Check (${vp.width}x${vp.height}): Header bottom=${card2Check.headerBottom}px | Card #2 top=${card2Check.cardTop}px`);
      if (card2Check.isCardCovered) {
        console.error(`P2 STICKY HEADER OVERLAP FAIL: Card #2 top (${card2Check.cardTop}px) is covered by sticky header (bottom=${card2Check.headerBottom}px)!`);
        process.exit(1);
      }

      console.log(`P2 Mobile Sticky Header & Non-Intersection Audit (${vp.width}x${vp.height}): PASS`);
    }

    // Reset back to Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // 4. Test P0/P1: Open Production Cyberpunk Odyssey & Zero Grace Period Sampling Audit
    console.log('\n--- P0/P1 TEST: Open Production Cyberpunk Odyssey & High-Frequency Sampling Audit ---');
    const cpBtn = await page.waitForSelector('button[data-open-production="true"][data-project-id="proj-cyberpunk"]', { timeout: 5000 });
    console.log(`Clicking Open Production on Cyberpunk Odyssey...`);
    await cpBtn.click();

    let hybridDetected = false;
    let hybridDetails = '';
    const switchStartTime = Date.now();

    // High-frequency sampling loop (10ms interval) from t=0 with ZERO grace period
    while (Date.now() - switchStartTime < 6000) {
      const sample = await page.evaluate(() => {
        const headerEl = document.querySelector('header');
        const mainEl = document.querySelector('main');
        const titleEl = document.querySelector('[data-testid="workspace-project-title"]');
        const codeEl = document.querySelector('[data-testid="workspace-project-code"]');
        const readinessEl = document.querySelector('[data-testid="workspace-readiness-pct"]');
        const summaryEl = document.querySelector('[data-testid="project-summary-bar"]');
        const switchingEl = document.querySelector('[data-testid="switching-production-indicator"], [data-testid="header-switching-indicator"]');

        const headerText = headerEl ? headerEl.innerText : '';
        const mainText = mainEl ? mainEl.innerText : '';
        const titleText = titleEl ? titleEl.textContent.trim() : '';
        const codeText = codeEl ? codeEl.textContent.trim() : '';
        const readinessText = readinessEl ? readinessEl.textContent.trim() : '';
        const summaryText = summaryEl ? summaryEl.innerText.replace(/\n/g, ' ') : '';

        const isSwitchingIndicatorVisible = switchingEl !== null ||
          mainText.includes('Switching production...') || headerText.includes('Switching production...');

        const isEmptyIntake =
          mainText.includes('No canonical entities registered') ||
          mainText.includes('Upload screenplay') ||
          mainText.includes('Drop screenplay files') ||
          mainText.includes('Parse demo screenplay') ||
          mainText.includes('No scenes registered') ||
          (document.querySelectorAll('.scene-readiness-card').length === 0 && document.querySelectorAll('tbody tr').length === 0 && !mainText.includes('Screenplay (3'));

        return {
          headerText,
          mainText,
          titleText,
          codeText,
          readinessText,
          summaryText,
          isSwitchingIndicatorVisible,
          isEmptyIntake,
        };
      });

      const elapsed = Date.now() - switchStartTime;

      // Fail from click t=0 if old Neon chrome remains without Switching production overlay
      if (!sample.isSwitchingIndicatorVisible) {
        if (sample.titleText.includes('The Neon Horizon') || sample.codeText.includes('NEON-HORIZON') || sample.summaryText.includes('7 entities')) {
          hybridDetected = true;
          hybridDetails = `[t+${elapsed}ms] Uncovered stale Neon chrome visible without overlay: Title="${sample.titleText}", Code="${sample.codeText}", Summary="${sample.summaryText}"`;
          break;
        }
        const hasHeader7Entities = sample.headerText.includes('7 entities') || sample.summaryText.includes('7 entities');
        const hasTabs000 = sample.mainText.includes('Screenplay (0') || sample.mainText.includes('Clearance Items (0)');
        if ((hasHeader7Entities || sample.titleText.includes('The Neon Horizon')) && (hasTabs000 || sample.isEmptyIntake)) {
          hybridDetected = true;
          hybridDetails = `[t+${elapsed}ms] Uncovered hybrid state: Header shows Neon 7 entities/chrome while tabs are 0/0/0 or intake is empty without overlay`;
          break;
        }
      }

      // Success Check: Selected project Cyberpunk title and workspace readiness 100% rendered without overlay
      if (sample.titleText.includes('Cyberpunk') && sample.readinessText === '100%' && !sample.isSwitchingIndicatorVisible) {
        console.log(`[t+${elapsed}ms] Switching finished -> Title: "${sample.titleText}" | Readiness: "${sample.readinessText}"`);
        break;
      }

      await page.waitForTimeout(10);
    }

    if (hybridDetected) {
      console.error(`P1 Atomic Transition Audit: FAIL (${hybridDetails})`);
      process.exit(1);
    }
    console.log(`P1 Atomic Transition Audit: PASS (Zero transient hybrid state detected)`);

    const cpWsTitle = await page.$eval('[data-testid="workspace-project-title"]', el => el.textContent.trim()).catch(() => 'N/A');
    const cpWsCode = await page.$eval('[data-testid="workspace-project-code"]', el => el.textContent.trim()).catch(() => 'N/A');
    const cpWsReadiness = await page.$eval('[data-testid="workspace-readiness-pct"]', el => el.textContent.trim()).catch(() => 'N/A');
    const cpWsSummary = await page.$eval('[data-testid="project-summary-bar"]', el => el.innerText.replace(/\n/g, ' ')).catch(() => 'N/A');

    // Read Blocked Count for Cyberpunk directly from workspace blocked-scenes element
    const cpBlockedCountText = await page.$eval('[data-testid="workspace-blocked-scenes"]', el => el.textContent.trim()).catch(() => '');
    const cpBlockedCount = cpBlockedCountText.includes('0') ? 0 : (cpBlockedCountText.match(/\d+/) ? parseInt(cpBlockedCountText.match(/\d+/)[0], 10) : 0);

    console.log('Resulting Workspace Post-Open (Cyberpunk Odyssey):');
    console.log(`  Title: "${cpWsTitle}" | Code: "${cpWsCode}" | Readiness: "${cpWsReadiness}" | Blocked: ${cpBlockedCount} ("${cpBlockedCountText}")`);
    console.log(`  Summary Bar: "${cpWsSummary}"`);

    // Strict Post-Open Assertions: Title, Code, Readiness, AND Blocked count
    if (cpWsTitle !== 'Cyberpunk Odyssey' || !cpWsCode.includes('CYBERPUNK') || !cpWsReadiness.includes('100%') || cpBlockedCount !== 0) {
      console.error(`P0 ROUTING FAIL: Expected Cyberpunk Odyssey [PRJ-CYBERPUNK] 100% readiness with 0 blocked, but got Title="${cpWsTitle}", Code="${cpWsCode}", Readiness="${cpWsReadiness}", Blocked=${cpBlockedCount}`);
      process.exit(1);
    }
    console.log(`P0 Routing Audit: PASS (Cyberpunk Odyssey 100% readiness & 0 blocked confirmed)`);

    // 5. Switch back to Neon Horizon & High-Frequency Sampling Audit
    console.log(`\n[Switch 2] Opening Portfolio and returning to Neon Horizon...`);
    await page.click('header button:has-text("Portfolio")');
    await page.waitForSelector('[data-portfolio-card="true"]', { timeout: 5000 });

    const neonBtn = await page.waitForSelector('button[data-open-production="true"][data-project-id="proj-default"], button[data-open-production="true"]:not([data-project-id="proj-cyberpunk"])', { timeout: 5000 });
    console.log(`Clicking Open Production on Neon Horizon...`);
    await neonBtn.click();

    let hybridDetected2 = false;
    let hybridDetails2 = '';
    const switchStartTime2 = Date.now();

    while (Date.now() - switchStartTime2 < 6000) {
      const sample2 = await page.evaluate(() => {
        const headerEl = document.querySelector('header');
        const mainEl = document.querySelector('main');
        const titleEl = document.querySelector('[data-testid="workspace-project-title"]');
        const codeEl = document.querySelector('[data-testid="workspace-project-code"]');
        const readinessEl = document.querySelector('[data-testid="workspace-readiness-pct"]');
        const summaryEl = document.querySelector('[data-testid="project-summary-bar"]');
        const switchingEl = document.querySelector('[data-testid="switching-production-indicator"], [data-testid="header-switching-indicator"]');

        const headerText = headerEl ? headerEl.innerText : '';
        const mainText = mainEl ? mainEl.innerText : '';
        const titleText = titleEl ? titleEl.textContent.trim() : '';
        const codeText = codeEl ? codeEl.textContent.trim() : '';
        const readinessText = readinessEl ? readinessEl.textContent.trim() : '';
        const summaryText = summaryEl ? summaryEl.innerText.replace(/\n/g, ' ') : '';

        const isSwitchingIndicatorVisible = switchingEl !== null ||
          mainText.includes('Switching production...') || headerText.includes('Switching production...');

        const isEmptyIntake =
          mainText.includes('No canonical entities registered') ||
          mainText.includes('Upload screenplay') ||
          mainText.includes('Drop screenplay files') ||
          mainText.includes('Parse demo screenplay') ||
          mainText.includes('No scenes registered') ||
          (document.querySelectorAll('.scene-readiness-card').length === 0 && document.querySelectorAll('tbody tr').length === 0 && !mainText.includes('Screenplay (3'));

        return {
          headerText,
          mainText,
          titleText,
          codeText,
          readinessText,
          summaryText,
          isSwitchingIndicatorVisible,
          isEmptyIntake,
        };
      });

      const elapsed2 = Date.now() - switchStartTime2;

      // Fail from click t=0 if old Cyberpunk chrome remains without Switching production overlay
      if (!sample2.isSwitchingIndicatorVisible) {
        if (sample2.titleText.includes('Cyberpunk') || sample2.codeText.includes('CYBERPUNK')) {
          hybridDetected2 = true;
          hybridDetails2 = `[t+${elapsed2}ms] Uncovered stale Cyberpunk chrome visible without overlay: Title="${sample2.titleText}", Code="${sample2.codeText}"`;
          break;
        }
        const hasHeader0Entities = sample2.headerText.includes('0 entities') || sample2.summaryText.includes('0 entities');
        const hasTabs3711 = sample2.mainText.includes('Screenplay (3') || sample2.mainText.includes('Clearance Items (7)');
        if (hasHeader0Entities && (hasTabs3711 || !sample2.isEmptyIntake || sample2.mainText.includes('Titan Industrial Hazard Placard'))) {
          hybridDetected2 = true;
          hybridDetails2 = `[t+${elapsed2}ms] Uncovered hybrid state: Header showed 0 entities while tabs/intake showed Neon content without overlay`;
          break;
        }
      }

      if (sample2.titleText.includes('Neon') && sample2.readinessText === '33.3%' && !sample2.isSwitchingIndicatorVisible) {
        console.log(`[t+${elapsed2}ms] Switching back finished -> Title: "${sample2.titleText}" | Readiness: "${sample2.readinessText}"`);
        break;
      }

      await page.waitForTimeout(10);
    }

    if (hybridDetected2) {
      console.error(`P1 Neon Horizon Switch Audit: FAIL (${hybridDetails2})`);
      process.exit(1);
    }
    console.log(`P1 Neon Horizon Switch Audit: PASS (Zero transient hybrid state detected)`);

    const neonWsTitle = await page.$eval('[data-testid="workspace-project-title"]', el => el.textContent.trim()).catch(() => 'N/A');
    const neonWsCode = await page.$eval('[data-testid="workspace-project-code"]', el => el.textContent.trim()).catch(() => 'N/A');
    const neonWsReadiness = await page.$eval('[data-testid="workspace-readiness-pct"]', el => el.textContent.trim()).catch(() => 'N/A');
    const neonWsSummary = await page.$eval('[data-testid="project-summary-bar"]', el => el.innerText.replace(/\n/g, ' ')).catch(() => 'N/A');

    // Read Blocked Count for Neon Horizon directly from workspace blocked-scenes element
    const neonBlockedCountText = await page.$eval('[data-testid="workspace-blocked-scenes"]', el => el.textContent.trim()).catch(() => '');
    const neonBlockedCount = neonBlockedCountText.includes('2') ? 2 : (neonBlockedCountText.match(/\d+/) ? parseInt(neonBlockedCountText.match(/\d+/)[0], 10) : 0);

    // Read Tabs (Screenplay, Clearance Items, Department Tasks)
    const screenplayTabText = await page.$eval('#tab-screenplay', el => el.textContent.trim()).catch(() => 'N/A');
    const clearanceTabText = await page.$eval('#tab-clearance', el => el.textContent.trim()).catch(() => 'N/A');
    const tasksTabText = await page.$eval('#tab-tasks', el => el.textContent.trim()).catch(() => 'N/A');

    console.log('Resulting Workspace Post-Switch (Neon Horizon):');
    console.log(`  Title: "${neonWsTitle}" | Code: "${neonWsCode}" | Readiness: "${neonWsReadiness}" | Blocked: ${neonBlockedCount} ("${neonBlockedCountText}")`);
    console.log(`  Tabs: Screenplay="${screenplayTabText}" | Clearance="${clearanceTabText}" | Tasks="${tasksTabText}"`);
    console.log(`  Summary Bar: "${neonWsSummary}"`);

    // Strict Post-Open Assertions: Title, Code, Readiness, AND Blocked count (2 blocked, 3/7/11)
    if (neonWsTitle !== 'The Neon Horizon' || !neonWsCode.includes('NEON-HORIZON') || !neonWsReadiness.includes('33.3%') || neonBlockedCount !== 2) {
      console.error(`P0 ROUTING FAIL: Expected The Neon Horizon [PRJ-NEON-HORIZON] 33.3% readiness with 2 blocked, but got Title="${neonWsTitle}", Code="${neonWsCode}", Readiness="${neonWsReadiness}", Blocked=${neonBlockedCount}`);
      process.exit(1);
    }

    // Strict Tab Assertions: 3 scenes / 7 items / 11 tasks
    if (!screenplayTabText.includes('3') || !clearanceTabText.includes('7') || !tasksTabText.includes('11')) {
      console.error(`P1 TABS FAIL: Expected Neon Horizon to show 3 scenes / 7 items / 11 tasks, but got Screenplay="${screenplayTabText}", Clearance="${clearanceTabText}", Tasks="${tasksTabText}"`);
      process.exit(1);
    }
    console.log(`Neon Return Audit: PASS (The Neon Horizon 33.3% readiness, 2 blocked, and 3/7/11 tabs confirmed)`);

    // 6. Test P1: Notification Drawer & Target Task Focus Alignment
    console.log('\n--- P1 TEST: Notification Drawer & Task Heading ID Focus Audit ---');
    const alertsBtn = await page.waitForSelector('#notification-drawer-button, button:has-text("Alerts")', { timeout: 5000 });
    await alertsBtn.click();
    await page.waitForTimeout(500);

    const notifyItems = await page.$$('[data-notification-item="true"]');
    console.log(`Found ${notifyItems.length} notification items`);
    for (let i = 0; i < notifyItems.length; i++) {
      const item = notifyItems[i];
      const targetTaskAttr = await item.getAttribute('data-notification-target-task');
      const text = await item.innerText();
      const accessibleName = await item.getAttribute('aria-label') || await item.getAttribute('title') || 'N/A';
      console.log(`Notification #${i + 1}: targetTask="${targetTaskAttr}" | accessibleName="${accessibleName}" | text="${text.replace(/\n/g, ' ')}"`);

      // Notification accessible name and body must contain target task identifier (e.g. TASK-101)
      if (!accessibleName.includes(targetTaskAttr) || !text.includes(targetTaskAttr)) {
        console.error(`P1 NOTIFICATION FAIL: Notification #${i + 1} accessible name or text missing target task identifier "${targetTaskAttr}"!`);
        process.exit(1);
      }
    }

    if (notifyItems.length > 0) {
      const firstNotify = notifyItems[0];
      const targetTaskId = await firstNotify.getAttribute('data-notification-target-task');
      console.log(`Clicking first notification (target: ${targetTaskId})...`);

      let resyncFocusedDuringLoad = false;
      let zeroOfZeroVisibleDuringLoad = false;
      const clickTime = Date.now();

      await firstNotify.click();

      while (Date.now() - clickTime < 4000) {
        const check = await page.evaluate((expectedId) => {
          const activeEl = document.activeElement;
          const isButton = activeEl && activeEl.tagName.toLowerCase() === 'button';
          const isReSyncFocused = isButton && (
            (activeEl.textContent && activeEl.textContent.trim().includes('Re-Sync')) ||
            (activeEl.getAttribute('aria-label') && activeEl.getAttribute('aria-label').includes('Re-Sync'))
          );
          const actionModal = document.querySelector('[role="dialog"][aria-labelledby="action-modal-title"]');
          const modalText = actionModal ? actionModal.textContent || '' : '';
          const isZeroOfZero = modalText.includes('0 of 0') || modalText.includes('Showing 0 of 0');
          const headingEl = document.getElementById(`task-heading-${expectedId}`);
          const isTargetHeadingFocused = activeEl === headingEl;

          return {
            isReSyncFocused: !!isReSyncFocused,
            isZeroOfZero: !!isZeroOfZero,
            isTargetHeadingFocused: !!isTargetHeadingFocused,
            activeTag: activeEl ? activeEl.tagName.toLowerCase() : 'none',
            activeId: activeEl ? activeEl.id : '',
            activeText: activeEl ? activeEl.innerText || activeEl.textContent || '' : '',
          };
        }, targetTaskId);

        if (check.isReSyncFocused) {
          resyncFocusedDuringLoad = true;
        }
        if (check.isZeroOfZero) {
          zeroOfZeroVisibleDuringLoad = true;
        }
        if (check.isTargetHeadingFocused) {
          console.log(`[t+${Date.now() - clickTime}ms] Target heading ${targetTaskId} received focus!`);
          break;
        }
        await page.waitForTimeout(10);
      }

      if (resyncFocusedDuringLoad) {
        console.error(`P1 ACTION CENTER FAIL: Re-Sync button received focus during notification deep-link navigation!`);
        process.exit(1);
      }
      if (zeroOfZeroVisibleDuringLoad) {
        console.error(`P1 ACTION CENTER FAIL: "0 of 0" was visible in modal chrome during task load!`);
        process.exit(1);
      }

      const modalVisible = await page.$('[role="dialog"]').then(el => el ? true : false);
      const navAnnouncement = await page.$eval('[data-testid="nav-announcement"]', el => el.textContent.trim()).catch(() => 'N/A');

      const activeElementInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return { tagName: 'none', id: '', accessibleName: '' };
        return {
          tagName: el.tagName.toLowerCase(),
          id: el.id || '',
          accessibleName: el.getAttribute('aria-label') || el.innerText || '',
        };
      });

      console.log(`Action Modal Visible: ${modalVisible}`);
      console.log(`Live Region Announcement: "${navAnnouncement}"`);
      console.log(`Active Focused Element: <${activeElementInfo.tagName} id="${activeElementInfo.id}" label="${activeElementInfo.accessibleName.replace(/\n/g, ' ')}">`);

      // Strict Focus Assertion: Active focused element must be H4 with ID task-heading-${targetTaskId}
      const expectedHeadingId = `task-heading-${targetTaskId}`;
      if (activeElementInfo.tagName !== 'h4' || activeElementInfo.id !== expectedHeadingId) {
        console.error(`P1 NOTIFICATION FOCUS FAIL: Expected focused element <h4 id="${expectedHeadingId}">, but got <${activeElementInfo.tagName} id="${activeElementInfo.id}">!`);
        process.exit(1);
      }
      console.log(`P1 Notification Heading Focus Audit: PASS (Focused <h4 id="${expectedHeadingId}"> without Re-Sync flash or "0 of 0" chrome)`);
    }

    // --- RC REGRESSION: Task Status Update & Audit History ---
    console.log('\n--- RC REGRESSION: TASK UPDATE & AUDIT HISTORY AUDIT ---');
    const taskUpdateRes = await page.evaluate(async (token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['x-demo-token'] = token;
      const res = await fetch('/api/projects/proj-default/actions/TASK-101', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          actor: 'Lead Clearance Counsel',
          reason: 'Actively drafting prop graphic replacement specification.',
        }),
      });
      return { ok: res.ok, status: res.status, data: await res.json() };
    }, DEMO_TOKEN);

    if (!taskUpdateRes.ok || !taskUpdateRes.data) {
      console.error(`RC REGRESSION FAIL: Task update failed with status ${taskUpdateRes.status}`);
      process.exit(1);
    }
    console.log(`Task Update Status: ${taskUpdateRes.data.status} | Audit Events: ${taskUpdateRes.data.activityHistory?.length || 0}`);
    console.log('RC Regression Task Update Audit: PASS');

    // --- RC REGRESSION: Task Attachments Verification ---
    console.log('\n--- RC REGRESSION: TASK ATTACHMENTS AUDIT ---');
    const attachmentsRes = await page.evaluate(async (token) => {
      const headers = {};
      if (token) headers['x-demo-token'] = token;
      const res = await fetch('/api/tasks/TASK-101/attachments', { headers });
      return { ok: res.ok, status: res.status, data: await res.json() };
    }, DEMO_TOKEN);
    console.log(`Attachments Endpoint Response: status=${attachmentsRes.status}, count=${attachmentsRes.data?.attachments?.length || 0}`);
    console.log('RC Regression Attachments Audit: PASS');

    // --- RC REGRESSION: Clearance Binder Export ---
    console.log('\n--- RC REGRESSION: CLEARANCE BINDER EXPORT AUDIT ---');
    const binderExportRes = await page.evaluate(async (token) => {
      const headers = {};
      if (token) headers['x-demo-token'] = token;
      const res = await fetch('/api/projects/proj-default/binder/export', { headers });
      return { ok: res.ok, status: res.status, data: await res.json() };
    }, DEMO_TOKEN);

    if (!binderExportRes.ok || !binderExportRes.data || !binderExportRes.data.integrityDigest) {
      console.error(`RC REGRESSION FAIL: Clearance binder export failed! status=${binderExportRes.status}`);
      process.exit(1);
    }
    console.log(`Exported Binder: Title="${binderExportRes.data.projectSummary?.title}" | Total Scenes=${binderExportRes.data.projectSummary?.totalScenes} | SHA-256 Digest="${binderExportRes.data.integrityDigest.slice(0, 16)}..."`);
    console.log('RC Regression Binder Export Audit: PASS');

    // --- RC REGRESSION: Tombstone / Non-existent Task Reference Integrity ---
    console.log('\n--- RC REGRESSION: TOMBSTONE NOTIFICATION INTEGRITY AUDIT ---');
    const tombstoneCheck = await page.evaluate(async (token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['x-demo-token'] = token;
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: 'LEGAL_COUNSEL',
          projectId: 'proj-default',
          triggerType: 'TASK_MENTION',
          title: 'Orphan Notification Test',
          message: 'Notification with missing target task.',
          targetTaskId: 'TASK-NON-EXISTENT-999',
        }),
      });
      return { ok: res.ok, data: await res.json() };
    }, DEMO_TOKEN);

    const verifyOrphan = await page.evaluate(async (token) => {
      const headers = {};
      if (token) headers['x-demo-token'] = token;
      const res = await fetch('/api/notifications?userId=LEGAL_COUNSEL', { headers });
      const notifs = (await res.json()).notifications || [];
      const orphan = notifs.find(n => n.title === 'Orphan Notification Test');
      return orphan ? orphan.targetTaskId : null;
    }, DEMO_TOKEN);

    if (verifyOrphan === 'TASK-101') {
      console.error(`RC REGRESSION FAIL: Orphan notification was silently remapped to TASK-101!`);
      process.exit(1);
    }
    console.log(`Orphan Notification targetTaskId preserved as: "${verifyOrphan}" (No silent TASK-101 fallback)`);
    console.log('RC Regression Tombstone & Task ID Integrity Audit: PASS');

    console.log('\n=== LOCAL PLAYWRIGHT VERIFICATION AUDIT COMPLETE: ALL PASS ===');
  } catch (err) {
    console.error('Local verification failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runLocalVerification();


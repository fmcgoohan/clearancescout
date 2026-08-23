import { chromium } from 'playwright';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';

(async () => {
  console.log(`=======================================================`);
  console.log(`Reproducing Demo Token Modal Bug against ${TARGET_URL}`);
  console.log(`=======================================================\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

  // Click "Demo Token" button in header
  console.log(`Clicking "Demo Token" header button...`);
  const tokenBtn = page.getByRole('button', { name: /Configure Demo Access Token|Demo Token/i });
  await tokenBtn.click();
  await page.waitForTimeout(500);

  // Inspect Modal DOM & Style metrics
  const modalAudit = await page.evaluate(() => {
    const backdrop = document.querySelector('[role="dialog"]');
    if (!backdrop) {
      return { found: false, error: 'No element with role="dialog" found in DOM' };
    }

    const modalBox = backdrop.querySelector('.glass-panel') || backdrop.firstElementChild;
    const backdropStyle = window.getComputedStyle(backdrop);
    const modalStyle = modalBox ? window.getComputedStyle(modalBox) : null;

    const backdropRect = backdrop.getBoundingClientRect();
    const modalRect = modalBox ? modalBox.getBoundingClientRect() : null;

    const activeElement = document.activeElement;
    const activeInfo = activeElement ? {
      tagName: activeElement.tagName,
      text: activeElement.textContent?.trim(),
      ariaLabel: activeElement.getAttribute('aria-label'),
      id: activeElement.id
    } : null;

    // Check sibling aria-hidden attribute (inertness)
    const bodySiblings = Array.from(document.body.children).map(child => ({
      tagName: child.tagName,
      id: child.id,
      className: child.className,
      ariaHidden: child.getAttribute('aria-hidden')
    }));

    return {
      found: true,
      backdrop: {
        zIndex: backdropStyle.zIndex,
        position: backdropStyle.position,
        display: backdropStyle.display,
        visibility: backdropStyle.visibility,
        opacity: backdropStyle.opacity,
        rect: {
          x: backdropRect.x,
          y: backdropRect.y,
          width: backdropRect.width,
          height: backdropRect.height
        }
      },
      modalBox: modalRect ? {
        zIndex: modalStyle?.zIndex,
        display: modalStyle?.display,
        visibility: modalStyle?.visibility,
        opacity: modalStyle?.opacity,
        rect: {
          x: modalRect.x,
          y: modalRect.y,
          width: modalRect.width,
          height: modalRect.height
        }
      } : null,
      activeInfo,
      bodySiblings
    };
  });

  console.log(`Modal DOM & Style Audit Results:`);
  console.log(JSON.stringify(modalAudit, null, 2));

  // Test Escape key dismissal
  console.log(`\nTesting Escape key dismissal...`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const closedAfterEscape = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
  console.log(`Closed after Escape key: ${closedAfterEscape}`);

  await browser.close();
})();

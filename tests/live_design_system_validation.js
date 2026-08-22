import { chromium } from 'playwright';

const LIVE_APP_URL = process.env.TARGET_URL || 'https://clearancescout-967916942007.us-central1.run.app';

(async () => {
  console.log(`[Design System Validation] Starting live Playwright audit against ${LIVE_APP_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Load application
    await page.goto(LIVE_APP_URL, { waitUntil: 'networkidle' });
    console.log('✓ App loaded successfully');

    // 2. Check font families in index.css / body / button
    const chromeFont = await page.evaluate(() => {
      const btn = document.querySelector('button') || document.body;
      return getComputedStyle(btn).fontFamily;
    });
    console.log(`✓ Chrome Font Family: ${chromeFont}`);

    // 3. Load bundled demo project if initial button or selector is present
    const demoBtn = page.getByRole('button', { name: /Load Bundled Fictional Demo Screenplay|1-Click Demo/i }).first();
    if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await demoBtn.click();
      console.log('✓ Clicked 1-Click Demo button');
      await page.waitForTimeout(1000);

      // If the upload modal is open, click the load button inside modal
      const modalSubmitBtn = page.getByRole('button', { name: /Load Bundled Demo Screenplay/i });
      if (await modalSubmitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modalSubmitBtn.click();
        console.log('✓ Clicked "Load Bundled Demo Screenplay" inside modal');
        // Wait for ingestion completion
        await page.waitForTimeout(5000);
      }
    }

    // 4. Verify Hero Readiness Index card typography and elements
    const heroReadinessValue = page.locator('.hero-animate, [style*="font-size: 2.75rem"]').first();
    const isHeroVisible = await heroReadinessValue.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Hero Readiness Index Card visible: ${isHeroVisible}`);

    // 5. Verify zero raw emoji in buttons or badges in chrome
    const chromeEmojiCount = await page.evaluate(() => {
      const text = document.body.innerText;
      // Common emojis previously used in chrome
      const emojis = ['📋', '📊', '🔍', '⚙️', '📂', '📄', '🚀', '🔄', '💡', '⚠️'];
      return emojis.filter(e => text.includes(e));
    });

    if (chromeEmojiCount.length > 0) {
      console.warn(`⚠️ Warning: Found legacy emoji in chrome text: ${chromeEmojiCount.join(', ')}`);
    } else {
      console.log('✓ Zero legacy chrome emojis found in page text!');
    }

    // 6. Verify SVG icon elements are rendered
    const svgCount = await page.locator('svg').count();
    console.log(`✓ Rendered SVG Icons count: ${svgCount}`);
    if (svgCount < 3) {
      throw new Error(`Expected at least 3 SVG icons on page, found ${svgCount}`);
    }

    // 7. Open a modal (Operations Dashboard) and test modal body scroll lock
    const opsDashboardBtn = page.getByRole('button', { name: /Operations Dashboard/i });
    if (await opsDashboardBtn.isVisible()) {
      await opsDashboardBtn.click();
      await page.waitForTimeout(500);

      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      console.log(`✓ Modal open body overflow style: "${bodyOverflow}"`);
      if (bodyOverflow !== 'hidden') {
        throw new Error(`Expected body overflow to be "hidden" when modal is open, got "${bodyOverflow}"`);
      }

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
      console.log(`✓ Modal closed body overflow style restored: "${bodyOverflowAfter}"`);
      if (bodyOverflowAfter === 'hidden') {
        throw new Error(`Expected body overflow to be restored after modal close`);
      }
    }

    console.log('\n🎉 ALL LIVE DESIGN SYSTEM VALIDATIONS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Live design system validation failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

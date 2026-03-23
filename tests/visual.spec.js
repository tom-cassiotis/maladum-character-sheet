// @ts-check
const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// A fixed selection: skills 0 (Acrobatics, all 3 levels), 1 (Combat Arts, 2 levels),
// 2 (Fleet of Foot, 1 level) + icons first_strike, parry, poison
const TEST_HASH = '#s=0:3,1:2,2:1&i=first_strike,parry,poison';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  // Navigate with the selection pre-loaded via URL hash
  await page.goto('/' + TEST_HASH);
  // Wait for skills table to be visible (data loaded and rendered)
  await page.waitForSelector('.skills-table', { timeout: 5000 });
});

// ── Desktop ───────────────────────────────────────────────────────────────────
test('desktop – selector panel and reference table', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'desktop.png'),
    fullPage: true,
  });
});

// ── Mobile – selector tab ─────────────────────────────────────────────────────
test('mobile – selector panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // The selector tab is active by default on mobile
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'mobile-selector.png'),
    fullPage: true,
  });
});

// ── Mobile – preview tab ──────────────────────────────────────────────────────
test('mobile – reference preview', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('[data-panel="preview"]');
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'mobile-preview.png'),
    fullPage: true,
  });
});

// ── Print media ───────────────────────────────────────────────────────────────
test('print media emulation', async ({ page }) => {
  await page.setViewportSize({ width: 794, height: 1123 }); // A4 @ 96dpi
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'print.png'),
    fullPage: true,
  });
});

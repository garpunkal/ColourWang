import { test, expect } from '@playwright/test';

// Avatar is rendered as <img>, not inline SVG. Only the 2 chevron buttons have SVG children.
// 32 avatar colour buttons, each with a title= attribute.
// JOIN button has class "btn".
// Error modal uses .fixed.inset-0.z-50

test.describe('Visual and Component Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');
  });

  test('should render the name and code input fields', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await expect(nameInput).toBeVisible();
    await expect(codeInput).toBeVisible();
    // No explicit type attribute — defaults to text input behaviour
    await expect(nameInput).toBeEditable();
  });

  test('should render the avatar preview as an img element', async ({ page }) => {
    await expect(page.locator('img[alt*="avatar" i]').first()).toBeVisible();
  });

  test('should render the two chevron style buttons with SVG icons', async ({ page }) => {
    const svgButtons = page.getByRole('button').filter({ has: page.locator('svg') });
    await expect(svgButtons.first()).toBeVisible();
    await expect(svgButtons.nth(1)).toBeVisible();
  });

  test('should render exactly 32 avatar colour buttons', async ({ page }) => {
    expect(await page.locator('button[title]').count()).toBe(32);
  });

  test('should render labels with text content', async ({ page }) => {
    const labels = page.locator('label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 4); i++) {
      await expect(labels.nth(i)).toBeVisible();
      expect(await labels.nth(i).textContent()).toBeTruthy();
    }
  });

  test('should render the JOIN button with a "btn" class', async ({ page }) => {
    const joinBtn = page.locator('button').filter({ hasText: /^JOIN$/i });
    await expect(joinBtn).toBeVisible();
    expect(await joinBtn.getAttribute('class')).toContain('btn');
  });

  test('should display the correct input placeholders', async ({ page }) => {
    expect(await page.locator('input[placeholder*="ENTER NAME" i]').getAttribute('placeholder')).toMatch(/NAME/i);
    expect(await page.locator('input[placeholder*="CODE" i]').getAttribute('placeholder')).toBeTruthy();
  });

  test('should render the avatar drop-shadow container', async ({ page }) => {
    await expect(page.locator('[class*="drop-shadow"]').first()).toBeVisible();
  });

  test('should render the error modal on top (high z-index) when triggered', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    const zIndex = await page.locator('.fixed.inset-0.z-50').evaluate(
      el => window.getComputedStyle(el).zIndex
    );
    expect(Number(zIndex)).toBeGreaterThan(0);
  });

  test('should have responsive elements with md: classes', async ({ page }) => {
    expect(await page.locator('[class*="md:"]').count()).toBeGreaterThan(0);
  });

  test('should apply max-width centering container', async ({ page }) => {
    expect(await page.locator('[class*="max-w"][class*="mx-auto"]').count()).toBeGreaterThan(0);
  });
});

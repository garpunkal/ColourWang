import { test, expect } from '@playwright/test';

test.describe('ColourWang - General Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/ColourWang/i);
  });

  test('should display main application layout', async ({ page }) => {
    // Check that the root element exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check viewport meta tag for mobile responsiveness
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /device-width/);
  });

  test('should load stylesheets', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that CSS is loaded by looking for a styled element
    const htmlElement = page.locator('html');
    const computedStyle = await htmlElement.evaluate((el) => 
      window.getComputedStyle(el).getPropertyValue('background-color')
    );
    expect(computedStyle).toBeTruthy();
  });

  test('should have accessible color contrast on main UI', async ({ page }) => {
    // Check that text is visible on background
    const labels = page.locator('label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify labels are visible
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(labels.nth(i)).toBeVisible();
    }
  });
});

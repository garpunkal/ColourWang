import { test, expect } from '@playwright/test';

// The app shows a landing page at '/' with HOST and JOIN cards.
// Clicking the JOIN card navigates to the PlayerJoinScreen.

test.describe('General Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).waitFor();
  });

  test('should load with the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/ColourWang/i);
  });

  test('should render the root element', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should have a viewport meta tag', async ({ page }) => {
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /device-width/);
  });

  test('should show the JOIN card on the landing page', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: 'JOIN NOW' })).toBeVisible();
  });

  test('should navigate to the player join form when the JOIN card is clicked', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await expect(page.locator('input[placeholder*="ENTER NAME" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="CODE" i]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^JOIN$/i })).toBeVisible();
  });
});

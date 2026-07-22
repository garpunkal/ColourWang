import { test, expect } from '@playwright/test';

// Error modal selector: .fixed.inset-0.z-50  (connection overlay uses z-9999, not z-50)
// Error messages: "Please enter a codename!"  /  "Please enter a valid 4-character room code!"
// Dismiss modal: click top-left corner at (10,10) — backdrop click propagates; inner card stops propagation.

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click({ force: true });
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');
  });

  test('should show "no codename" error when name is blank', async ({ page }) => {
    const joinButton = page.locator('button').filter({ hasText: /^JOIN$/i });
    const modal = page.locator('.fixed.inset-0.z-50');
    await page.locator('input[placeholder*="CODE" i]').fill('ABCD');
    await joinButton.click({ force: true });
    await page.waitForTimeout(100);
    if (!(await modal.isVisible())) {
      await joinButton.click({ force: true });
    }
    await expect(modal).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /codename/i })).toBeVisible();
  });

  test('should show "4-character code" error when code is too short', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('PLAYER1');
    await page.locator('input[placeholder*="CODE" i]').fill('AB');
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click({ force: true });
    await page.waitForSelector('.fixed.inset-0.z-50');
    await expect(page.locator('p').filter({ hasText: /4-character/i })).toBeVisible();
  });

  test('should show "no codename" error when both fields are blank', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click({ force: true });
    await page.waitForSelector('.fixed.inset-0.z-50');
    await expect(page.locator('p').filter({ hasText: /codename/i })).toBeVisible();
  });

  test('should dismiss the error modal by clicking the backdrop', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click({ force: true });
    await page.waitForSelector('.fixed.inset-0.z-50');
    await page.mouse.click(10, 10);
    await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();
  });

  test('should not close the modal when clicking inside the modal card', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    await page.locator('.fixed.inset-0.z-50').locator('h3').click({ force: true });
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
  });

  test('should show validation error for a 3-character code', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('PLAYER1');
    await page.locator('input[placeholder*="CODE" i]').fill('ABC');
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click({ force: true });
    await page.waitForSelector('.fixed.inset-0.z-50');
    await expect(page.locator('p').filter({ hasText: /4-character/i })).toBeVisible();
  });

  test('should handle special characters in name without crashing', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('P@#$!%');
    const value = await page.locator('input[placeholder*="ENTER NAME" i]').inputValue();
    expect(value.length).toBeLessThanOrEqual(10);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should not crash with maximum-length inputs', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('VERYLONGNAME1234567890');
    await page.locator('input[placeholder*="CODE" i]').fill('12345678');
    const nameLen = (await page.locator('input[placeholder*="ENTER NAME" i]').inputValue()).length;
    const codeLen = (await page.locator('input[placeholder*="CODE" i]').inputValue()).length;
    expect(nameLen).toBeLessThanOrEqual(10);
    expect(codeLen).toBeLessThanOrEqual(4);
    await expect(page.locator('#root')).toBeVisible();
  });
});

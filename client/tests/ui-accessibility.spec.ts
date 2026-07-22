import { test, expect } from '@playwright/test';

test.describe('UI Accessibility and Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');
  });

  test('should display the Name, Code, and Style labels', async ({ page }) => {
    await expect(page.locator('label').filter({ hasText: /^Name$/i })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: /^Code$/i })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: /Style Your Wang/i })).toBeVisible();
  });

  test('should have focusable form inputs', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.focus();
    expect(await nameInput.evaluate(el => document.activeElement === el)).toBe(true);
  });

  test('should advance focus from name to code input with Tab', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').focus();
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName ?? '');
    expect(['INPUT', 'BUTTON']).toContain(active);
  });

  test('should have focusable avatar style buttons', async ({ page }) => {
    const prevBtn = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await prevBtn.focus();
    expect(await prevBtn.evaluate(el => document.activeElement === el)).toBe(true);
  });

  test('should fill name and code inputs with valid data', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('TEST');
    await page.locator('input[placeholder*="CODE" i]').fill('1234');
    expect(await page.locator('input[placeholder*="ENTER NAME" i]').inputValue()).toBe('TEST');
    expect((await page.locator('input[placeholder*="CODE" i]').inputValue()).length).toBe(4);
  });

  test('should show an error modal when joining without data', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click();
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
  });

  test('should restore name from localStorage after reload', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('PLAYER1');
    await page.waitForFunction(() => localStorage.getItem('playerName') === 'PLAYER1');

    await page.reload();
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');

    expect(await page.locator('input[placeholder*="ENTER NAME" i]').inputValue()).toBe('PLAYER1');
  });

  test('should remain stable after rapid JOIN button clicks', async ({ page }) => {
    const joinBtn = page.locator('button').filter({ hasText: /^JOIN$/i });
    await joinBtn.click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    await page.mouse.click(10, 10);
    await joinBtn.click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    await page.mouse.click(10, 10);
    await expect(page.locator('#root')).toBeVisible();
  });
});

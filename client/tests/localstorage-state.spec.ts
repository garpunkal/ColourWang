import { test, expect } from '@playwright/test';

// localStorage keys (no cw_ prefix): playerName, playerAvatar, playerAvatarStyle
// Code is NOT persisted to localStorage — do not test for cw_gameCode.
// After a reload the app returns to the landing page; re-navigate to the join form.

test.describe('LocalStorage and State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');
  });

  test('should start with empty localStorage after clearing', async ({ page }) => {
    const playerName = await page.evaluate(() => localStorage.getItem('playerName'));
    const playerAvatar = await page.evaluate(() => localStorage.getItem('playerAvatar'));
    expect(playerName).toBeNull();
    expect(playerAvatar).toBeNull();
  });

  test('should persist player name to localStorage on input', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('TESTNAME');
    await page.waitForFunction(() => localStorage.getItem('playerName') === 'TESTNAME');
    expect(await page.evaluate(() => localStorage.getItem('playerName'))).toBe('TESTNAME');
  });

  test('should restore player name from localStorage after reload', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('TESTNAME');
    await page.waitForFunction(() => localStorage.getItem('playerName') === 'TESTNAME');

    await page.reload();
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');

    expect(await page.locator('input[placeholder*="ENTER NAME" i]').inputValue()).toBe('TESTNAME');
  });

  test('should persist avatar style to localStorage when cycling', async ({ page }) => {
    await page.getByRole('button').filter({ has: page.locator('svg') }).nth(1).click();
    await page.waitForFunction(() => !!localStorage.getItem('playerAvatarStyle'));
    const stored = await page.evaluate(() => localStorage.getItem('playerAvatarStyle'));
    expect(stored).toBeTruthy();
  });

  test('should restore avatar style from localStorage after reload', async ({ page }) => {
    await page.getByRole('button').filter({ has: page.locator('svg') }).nth(1).click();
    await page.waitForFunction(() => !!localStorage.getItem('playerAvatarStyle'));
    const before = await page.evaluate(() => localStorage.getItem('playerAvatarStyle'));

    await page.reload();
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');

    expect(await page.evaluate(() => localStorage.getItem('playerAvatarStyle'))).toBe(before);
  });

  test('should persist avatar colour selection to localStorage', async ({ page }) => {
    await page.locator('button[title="NEON PINK"]').click();
    await page.waitForFunction(() => localStorage.getItem('playerAvatar') === 'neon-pink');
    expect(await page.evaluate(() => localStorage.getItem('playerAvatar'))).toBe('neon-pink');
  });

  test('should update localStorage as player name changes', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('A');
    await page.waitForFunction(() => localStorage.getItem('playerName') === 'A');
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('ALICE');
    await page.waitForFunction(() => localStorage.getItem('playerName') === 'ALICE');
    expect(await page.evaluate(() => localStorage.getItem('playerName'))).toBe('ALICE');
  });

  test('should handle empty localStorage values gracefully', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('playerName', '');
      localStorage.setItem('playerAvatar', '');
      localStorage.setItem('playerAvatarStyle', '');
    });
    await page.reload();
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');
    await expect(page.locator('#root')).toBeVisible();
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('NEWNAME');
    expect(await page.locator('input[placeholder*="ENTER NAME" i]').inputValue()).toBe('NEWNAME');
  });

  test('should clear localStorage explicitly', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('TESTDATA');
    await page.waitForFunction(() => localStorage.getItem('playerName') === 'TESTDATA');
    await page.evaluate(() => localStorage.clear());
    expect(await page.evaluate(() => localStorage.getItem('playerName'))).toBeNull();
  });
});

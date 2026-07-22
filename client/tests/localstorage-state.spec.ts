import { test, expect } from '@playwright/test';

test.describe('LocalStorage and State Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should initialize with empty localStorage values', async ({ page }) => {
    // After reload, localStorage should be empty or have defaults
    const playerName = await page.evaluate(() => localStorage.getItem('playerName'));
    const playerAvatar = await page.evaluate(() => localStorage.getItem('playerAvatar'));

    // These can be empty or have defaults, just check they don't throw errors
    expect(typeof playerName).toBe('string');
    expect(typeof playerAvatar).toBe('string');
  });

  test('should persist player name across reloads', async ({ page }) => {
    // Enter a name
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('TESTNAME');

    // Check localStorage
    let storedName = await page.evaluate(() => localStorage.getItem('playerName'));
    expect(storedName).toBe('TESTNAME');

    // Reload page
    await page.reload();

    // Name should be restored
    const newNameValue = await nameInput.inputValue();
    expect(newNameValue).toBe('TESTNAME');
  });

  test('should persist player avatar style across reloads', async ({ page }) => {
    // Cycle to a different style
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await nextButton.click();
    await page.waitForTimeout(200);

    // Get stored style
    const storedStyle = await page.evaluate(() => localStorage.getItem('playerAvatarStyle'));
    expect(storedStyle).toBeTruthy();

    // Reload page
    await page.reload();

    // Style should be the same
    const newStyle = await page.evaluate(() => localStorage.getItem('playerAvatarStyle'));
    expect(newStyle).toBe(storedStyle);
  });

  test('should handle malformed localStorage data gracefully', async ({ page, context }) => {
    // Set invalid localStorage data
    await page.evaluate(() => {
      localStorage.setItem('playerName', '');
      localStorage.setItem('playerAvatar', '');
      localStorage.setItem('playerAvatarStyle', '');
    });

    // Reload page
    await page.reload();

    // Page should still work
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Should be able to enter data
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('NEWNAME');
    expect(await nameInput.inputValue()).toBe('NEWNAME');
  });

  test('should update localStorage on input change', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    
    // Type first character
    await nameInput.fill('A');
    let stored = await page.evaluate(() => localStorage.getItem('playerName'));
    expect(stored).toBe('A');

    // Type more characters
    await nameInput.fill('ALICE');
    stored = await page.evaluate(() => localStorage.getItem('playerName'));
    expect(stored).toBe('ALICE');
  });

  test('should preserve localStorage during navigation', async ({ page }) => {
    // Set some data
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('PLAYER');

    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await codeInput.fill('TEST');

    // Get stored values
    const name = await page.evaluate(() => localStorage.getItem('playerName'));
    const code = await page.evaluate(() => localStorage.getItem('cw_gameCode'));

    // Navigate to same page
    await page.goto('/');

    // Values should persist
    const nameAfter = await page.evaluate(() => localStorage.getItem('playerName'));
    expect(nameAfter).toBe('PLAYER');
  });

  test('should handle rapid localStorage updates', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    
    // Rapidly update input
    const names = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE'];
    for (const name of names) {
      await nameInput.fill(name);
      await page.waitForTimeout(50);
    }

    // Final value should be correct
    const stored = await page.evaluate(() => localStorage.getItem('playerName'));
    expect(stored).toBe('ABCDE');
  });

  test('should restore full state on page reload', async ({ page }) => {
    // Set up complete state
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('FULLNAME');

    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await codeInput.fill('1234');

    // Select an avatar
    const avatarButtons = page.locator('button[title*="MIDNIGHT" i]');
    if (await avatarButtons.count() > 0) {
      const firstButton = avatarButtons.first();
      const isDisabled = await firstButton.evaluate(el => (el as HTMLButtonElement).disabled);
      if (!isDisabled) {
        await firstButton.click();
      }
    }

    // Get state
    const beforeReloadName = await nameInput.inputValue();
    const beforeReloadCode = await codeInput.inputValue();

    // Reload
    await page.reload();

    // Check state
    const afterReloadName = await nameInput.inputValue();
    const afterReloadCode = await codeInput.inputValue();

    expect(afterReloadName).toBe(beforeReloadName);
    expect(afterReloadCode).toBe(beforeReloadCode);
  });

  test('should clear localStorage when explicitly cleared', async ({ page }) => {
    // Set data
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('TESTDATA');

    // Verify it's stored
    let stored = await page.evaluate(() => localStorage.getItem('playerName'));
    expect(stored).toBe('TESTDATA');

    // Clear localStorage
    await page.evaluate(() => localStorage.clear());

    // Verify it's gone
    stored = await page.evaluate(() => localStorage.getItem('playerName'));
    expect(stored).toBeNull();
  });
});

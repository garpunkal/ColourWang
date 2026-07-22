import { test, expect } from '@playwright/test';

// Avatar button titles come from getAvatarName(id), e.g. "MIDNIGHT BLACK", "NEON PINK".
// button[title] matches only avatar grid buttons — the JOIN and chevron buttons have no title.
// There are 32 colours in config/avatars.json, so 32 avatar buttons.

test.describe('Avatar Colour Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('button[title]');
  });

  test('should display all 32 avatar colour buttons', async ({ page }) => {
    expect(await page.locator('button[title]').count()).toBe(32);
  });

  test('should show a ring indicator on the selected avatar', async ({ page }) => {
    const btn = page.locator('button[title="NEON PINK"]');
    await btn.click();
    expect(await btn.getAttribute('class')).toContain('ring');
  });

  test('should deselect the previous avatar when a new one is chosen', async ({ page }) => {
    await page.locator('button[title="NEON PINK"]').click();
    await page.locator('button[title="CYBER BLUE"]').click();
    expect(await page.locator('button[title="NEON PINK"]').getAttribute('class')).not.toContain('ring');
    expect(await page.locator('button[title="CYBER BLUE"]').getAttribute('class')).toContain('ring');
  });

  test('should persist the avatar selection in localStorage', async ({ page }) => {
    await page.locator('button[title="NEON PINK"]').click();
    await page.waitForFunction(() => localStorage.getItem('playerAvatar') === 'neon-pink');
    expect(await page.evaluate(() => localStorage.getItem('playerAvatar'))).toBe('neon-pink');
  });

  test('should restore the avatar selection from localStorage on reload', async ({ page }) => {
    await page.locator('button[title="CYBER BLUE"]').click();
    await page.waitForFunction(() => localStorage.getItem('playerAvatar') === 'cyber-blue');

    await page.reload();
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('button[title]');

    expect(await page.locator('button[title="CYBER BLUE"]').getAttribute('class')).toContain('ring');
  });

  test('should handle rapid avatar selection without crashing', async ({ page }) => {
    for (const title of ['MIDNIGHT BLACK', 'IRON GRAY', 'CRIMSON RED', 'NEON PINK', 'CYBER BLUE']) {
      await page.locator(`button[title="${title}"]`).click();
    }
    await expect(page.locator('#root')).toBeVisible();
    expect(await page.locator('button[title="CYBER BLUE"]').getAttribute('class')).toContain('ring');
  });
});

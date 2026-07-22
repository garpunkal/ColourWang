import { test, expect } from '@playwright/test';

// Helper: navigate from landing page to the player join form.
async function goToJoinScreen(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
  await page.waitForSelector('input[placeholder*="ENTER NAME" i]');
}

test.describe('PlayerJoinScreen - Join Flow', () => {
  test.beforeEach(async ({ page }) => {
    await goToJoinScreen(page);
  });

  test('should display all join screen elements', async ({ page }) => {
    await expect(page.locator('input[placeholder*="ENTER NAME" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="CODE" i]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^JOIN$/i })).toBeVisible();
  });

  test('should show an error when name is missing', async ({ page }) => {
    await page.locator('input[placeholder*="CODE" i]').fill('TEST');
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click();
    await expect(page.locator('h3').filter({ hasText: /Oops/i })).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /codename/i })).toBeVisible();
  });

  test('should show an error when code is shorter than 4 characters', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('PLAYER1');
    await page.locator('input[placeholder*="CODE" i]').fill('AB');
    await page.locator('button').filter({ hasText: /^JOIN$/i }).click();
    await expect(page.locator('h3').filter({ hasText: /Oops/i })).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /4-character/i })).toBeVisible();
  });

  test('should persist player name in localStorage', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('TESTPLAYER');
    await page.waitForFunction(() => localStorage.getItem('playerName') === 'TESTPLAYER');
    expect(await page.evaluate(() => localStorage.getItem('playerName'))).toBe('TESTPLAYER');
  });

  test('should enforce a max name length of 10 characters', async ({ page }) => {
    await page.locator('input[placeholder*="ENTER NAME" i]').fill('THISISLONGERTHANTENCHARACTERS');
    expect((await page.locator('input[placeholder*="ENTER NAME" i]').inputValue()).length).toBeLessThanOrEqual(10);
  });

  test('should display avatar style cycling buttons', async ({ page }) => {
    const svgButtons = page.getByRole('button').filter({ has: page.locator('svg') });
    await expect(svgButtons.first()).toBeVisible();
    await expect(svgButtons.nth(1)).toBeVisible();
  });

  test('should display all 32 avatar colour buttons', async ({ page }) => {
    expect(await page.locator('button[title]').count()).toBe(32);
  });

  test('should allow selecting an avatar', async ({ page }) => {
    // NEON PINK is not the default selection so this click switches to it
    const btn = page.locator('button[title="NEON PINK"]');
    await btn.click();
    expect(await btn.getAttribute('class')).toContain('ring');
  });

  test('should be responsive on a mobile screen size', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobilePage = await ctx.newPage();
    await mobilePage.goto('/');
    await mobilePage.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await mobilePage.waitForSelector('input[placeholder*="ENTER NAME" i]');
    await expect(mobilePage.locator('input[placeholder*="ENTER NAME" i]')).toBeVisible();
    await expect(mobilePage.locator('button').filter({ hasText: /^JOIN$/i })).toBeVisible();
    await ctx.close();
  });
});

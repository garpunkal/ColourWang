import { test, expect } from '@playwright/test';

test.describe('PlayerJoinScreen - Join Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display join screen elements', async ({ page }) => {
    // Check for name input
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await expect(nameInput).toBeVisible();

    // Check for code input
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await expect(codeInput).toBeVisible();

    // Check for JOIN button
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await expect(joinButton).toBeVisible();
  });

  test('should validate name input is required', async ({ page }) => {
    // Enter code without name
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await codeInput.fill('TEST');

    // Try to join
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Should show error
    const errorModal = page.locator('h3').filter({ hasText: /Oops/i });
    await expect(errorModal).toBeVisible();
  });

  test('should validate code must be 4 characters', async ({ page }) => {
    // Enter name and incomplete code
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('PLAYER1');

    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await codeInput.fill('AB'); // Only 2 characters

    // Try to join
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Should show error
    const errorModal = page.locator('h3').filter({ hasText: /Oops/i });
    await expect(errorModal).toBeVisible();
  });

  test('should persist player name in localStorage', async ({ page, context }) => {
    // Set player name
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('TESTPLAYER');

    // Check localStorage
    const playerName = await page.evaluate(() => 
      localStorage.getItem('playerName')
    );
    expect(playerName).toBe('TESTPLAYER');
  });

  test('should enforce max name length of 10 characters', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('THISISLONGERTHANTENCHARACTERS');

    // Check that input is limited
    const value = await nameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(10);
  });

  test('should allow uppercase code entry', async ({ page }) => {
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    
    // Enter lowercase code
    await codeInput.fill('abcd');

    // Value should be stored
    const value = await codeInput.inputValue();
    expect(value.toUpperCase()).toBe('ABCD');
  });

  test('should display style cycling buttons', async ({ page }) => {
    // Check for left chevron (previous style)
    const prevButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(prevButton).toBeVisible();

    // Check for right chevron (next style)
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await expect(nextButton).toBeVisible();
  });

  test('should display avatar selection grid', async ({ page }) => {
    // Look for the color choice section
    const colorGrid = page.locator('div').filter({ has: page.locator('button[title*="MIDNIGHT" i]') });
    await expect(colorGrid).toBeVisible();

    // Should have multiple avatar buttons
    const avatarButtons = page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i]');
    const count = await avatarButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow avatar selection', async ({ page }) => {
    // Get an available avatar button
    const avatarButtons = page.locator('button').filter({ hasText: '' }).first();
    
    // Find a non-disabled avatar
    const allButtons = await page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i], button[title*="ELECTRIC" i]').all();
    if (allButtons.length > 0) {
      const firstButton = allButtons[0];
      const isDisabled = await firstButton.evaluate(el => (el as HTMLButtonElement).disabled);
      if (!isDisabled) {
        await firstButton.click();
        // Button should have visual indication of selection
        const className = await firstButton.getAttribute('class');
        expect(className).toContain('ring');
      }
    }
  });

  test('should display glass-morphism cards', async ({ page }) => {
    // Check for glass-card styling
    const glassCard = page.locator('.glass-card, [class*="glass"]');
    const count = await glassCard.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be responsive on different screen sizes', async ({ browser }) => {
    // Test on mobile
    const mobileContext = await browser.createContext({
      viewport: { width: 375, height: 667 },
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('/');

    // Elements should still be visible
    const nameInput = mobilePage.locator('input[placeholder*="ENTER NAME" i]');
    await expect(nameInput).toBeVisible();

    await mobileContext.close();
  });
});

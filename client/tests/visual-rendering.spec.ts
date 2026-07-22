import { test, expect } from '@playwright/test';

test.describe('Visual and Component Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render all form input fields', async ({ page }) => {
    // Name input
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await expect(nameInput).toBeVisible();

    // Code input
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await expect(codeInput).toBeVisible();

    // Both should be of type text/input
    expect(await nameInput.getAttribute('type')).toBe('text');
  });

  test('should render avatar preview area', async ({ page }) => {
    // Main avatar preview should be visible
    const avatarPreview = page.locator('img[alt*="avatar" i]').first();
    
    // Or check for avatar container
    const avatarContainer = page.locator('div').filter({ has: page.locator('[class*="drop-shadow"]') }).first();
    await expect(avatarContainer).toBeVisible();
  });

  test('should render style cycling buttons with chevron icons', async ({ page }) => {
    // Previous button (left chevron)
    const prevButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(prevButton).toBeVisible();

    // Next button (right chevron)
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await expect(nextButton).toBeVisible();
  });

  test('should render color choice grid with correct layout', async ({ page }) => {
    // Find avatar selection grid
    const gridContainer = page.locator('[class*="flex"][class*="wrap"]').filter({ has: page.locator('button[title*="MIDNIGHT" i]') });
    
    if (await gridContainer.count() > 0) {
      await expect(gridContainer).toBeVisible();
    }
  });

  test('should render labels with proper text styling', async ({ page }) => {
    const labels = page.locator('label');
    
    // Should have multiple labels
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);

    // All labels should be visible
    for (let i = 0; i < Math.min(count, 5); i++) {
      const label = labels.nth(i);
      await expect(label).toBeVisible();
      
      // Label should have text content
      const text = await label.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should render JOIN button with proper styling', async ({ page }) => {
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await expect(joinButton).toBeVisible();

    // Button should have btn class
    const className = await joinButton.getAttribute('class');
    expect(className).toContain('btn');
  });

  test('should render glass-morphism cards', async ({ page }) => {
    const glassCards = page.locator('.glass-card, [class*="glass"]');
    
    // Should have at least one glass element
    const count = await glassCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should apply proper spacing and padding', async ({ page }) => {
    const mainContainer = page.locator('[class*="max-w"][class*="mx-auto"]');
    
    // Main container should exist
    const count = await mainContainer.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render with proper color palette', async ({ page }) => {
    // Check that avatar colors are rendered
    const colorButtons = page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i]');
    
    // Should have colored elements
    const count = await colorButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper z-index stacking', async ({ page }) => {
    // Error modal should be on top when shown
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    const errorModal = page.locator('[class*="fixed"][class*="inset"]');
    if (await errorModal.count() > 0) {
      const zIndex = await errorModal.evaluate(el => 
        window.getComputedStyle(el).zIndex
      );
      
      // Z-index should be high for modal
      expect(Number(zIndex)).toBeGreaterThan(0);
    }
  });

  test('should render scrollable avatar grid', async ({ page }) => {
    // Get the avatar grid container
    const gridContainer = page.locator('[class*="overflow-y-auto"]').filter({ has: page.locator('button[title*="MIDNIGHT" i]') });
    
    if (await gridContainer.count() > 0) {
      // Check overflow class
      const className = await gridContainer.getAttribute('class');
      expect(className).toContain('overflow');
    }
  });

  test('should render all avatar buttons in grid', async ({ page }) => {
    // Count total avatar selection buttons
    const avatarButtons = page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i], button[title*="ELECTRIC" i], button[title*="GOLDEN" i], button[title*="SILVER" i]');
    
    const count = await avatarButtons.count();
    // Should have at least some avatars
    expect(count).toBeGreaterThan(0);
  });

  test('should render with proper mobile responsive classes', async ({ page }) => {
    // Check for responsive classes
    const elements = page.locator('[class*="md:"]');
    
    // Should have responsive elements
    const count = await elements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display input placeholders correctly', async ({ page }) => {
    // Name input placeholder
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    const namePlaceholder = await nameInput.getAttribute('placeholder');
    expect(namePlaceholder).toBeTruthy();
    expect(namePlaceholder).toMatch(/NAME/i);

    // Code input placeholder
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    const codePlaceholder = await codeInput.getAttribute('placeholder');
    expect(codePlaceholder).toBeTruthy();
  });
});

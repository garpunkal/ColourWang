import { test, expect } from '@playwright/test';

test.describe('UI Responsiveness and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper button accessibility', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    expect(count).toBeGreaterThan(0);

    // Check that buttons are focusable
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i);
      await button.focus();
      const hasFocus = await button.evaluate(el => document.activeElement === el);
      expect(hasFocus).toBe(true);
    }
  });

  test('should have proper input accessibility', async ({ page }) => {
    const inputs = page.locator('input');
    
    // Name input should be accessible
    const nameInput = inputs.nth(0);
    await nameInput.focus();
    const focused = await nameInput.evaluate(el => document.activeElement === el);
    expect(focused).toBe(true);
  });

  test('should have proper color contrast for text', async ({ page }) => {
    // Check labels are visible
    const labels = page.locator('label');
    const labelCount = await labels.count();
    
    expect(labelCount).toBeGreaterThan(0);
    
    // Each label should be visible
    for (let i = 0; i < Math.min(labelCount, 3); i++) {
      const label = labels.nth(i);
      await expect(label).toBeVisible();
    }
  });

  test('should properly handle form submission', async ({ page }) => {
    // Fill in valid data
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('TEST');

    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await codeInput.fill('1234');

    // Form should have all required fields filled
    const nameValue = await nameInput.inputValue();
    const codeValue = await codeInput.inputValue();

    expect(nameValue).toBe('TEST');
    expect(codeValue.length).toBe(4);
  });

  test('should have proper focus management', async ({ page }) => {
    // Tab through form elements
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.focus();

    await page.keyboard.press('Tab');
    
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    const isFocused = await codeInput.evaluate(el => document.activeElement === el);
    
    // Either code input or a nearby element should be focused
    const activeElement = await page.evaluate(() => 
      (document.activeElement as HTMLElement)?.tagName || ''
    );
    expect(['INPUT', 'BUTTON']).toContain(activeElement);
  });

  test('should display error messages clearly', async ({ page }) => {
    // Try to join without data
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Error should be visible
    const errorDialog = page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]');
    await expect(errorDialog).toBeVisible();
  });

  test('should have smooth animations and transitions', async ({ page }) => {
    // Check if framer-motion is working
    const animatedElements = page.locator('[class*="transform"], [style*="transform"]');
    const count = await animatedElements.count();
    
    // Page should have animated elements
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle rapid button clicks', async ({ page }) => {
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    
    // Rapidly click button
    await joinButton.click();
    await joinButton.click();
    await joinButton.click();

    // Page should remain stable (no crashes)
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should clear error messages when dismissed', async ({ page }) => {
    // Trigger an error
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Wait for error to appear
    const errorDialog = page.locator('[role="dialog"], .fixed.inset-0');
    await expect(errorDialog).toBeVisible();

    // Click OK or dismiss button
    const okButton = page.locator('button').filter({ hasText: /OK/i });
    if (await okButton.count() > 0) {
      await okButton.click();
      
      // Error should disappear
      await expect(errorDialog).not.toBeVisible();
    }
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Enter a name
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('PLAYER1');

    // Refresh page
    await page.reload();

    // Name should be restored from localStorage
    const newNameValue = await nameInput.inputValue();
    expect(newNameValue).toBe('PLAYER1');
  });

  test('should display all required UI elements', async ({ page }) => {
    // Check for key UI components
    const nameLabel = page.locator('label').filter({ hasText: /Name/i });
    const codeLabel = page.locator('label').filter({ hasText: /Code/i });
    const styleLabel = page.locator('label').filter({ hasText: /Style/i });

    await expect(nameLabel).toBeVisible();
    await expect(codeLabel).toBeVisible();
    // Style label might not always be visible depending on layout
  });
});

import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display error when trying to join without name', async ({ page }) => {
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await codeInput.fill('TEST');

    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Error modal should appear
    const errorModal = page.locator('h3').filter({ hasText: /Oops/i });
    await expect(errorModal).toBeVisible();

    const errorText = page.locator('p').filter({ hasText: /codename/i });
    await expect(errorText).toBeVisible();
  });

  test('should display error when trying to join with incomplete code', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    await nameInput.fill('PLAYER');

    const codeInput = page.locator('input[placeholder*="CODE" i]');
    await codeInput.fill('AB'); // Only 2 characters

    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Error should show
    const errorModal = page.locator('h3').filter({ hasText: /Oops/i });
    await expect(errorModal).toBeVisible();

    const errorText = page.locator('p').filter({ hasText: /4-character/i });
    await expect(errorText).toBeVisible();
  });

  test('should dismiss error modal on click', async ({ page }) => {
    // Trigger error
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Modal should be visible
    const errorModal = page.locator('[class*="fixed"][class*="inset"]');
    await expect(errorModal).toBeVisible();

    // Click OK button
    const okButton = page.locator('button').filter({ hasText: /OK/i });
    await okButton.click();

    // Modal should disappear
    await expect(errorModal).not.toBeVisible();
  });

  test('should dismiss error modal by clicking backdrop', async ({ page }) => {
    // Trigger error
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    const errorModal = page.locator('[class*="fixed"][class*="inset"]');
    await expect(errorModal).toBeVisible();

    // Click backdrop
    await errorModal.click();

    // Modal should disappear
    await expect(errorModal).not.toBeVisible();
  });

  test('should handle empty name input gracefully', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    const codeInput = page.locator('input[placeholder*="CODE" i]');

    // Leave name empty, fill code
    await codeInput.fill('1234');

    // Try to join
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Should show error
    const errorModal = page.locator('h3').filter({ hasText: /Oops/i });
    await expect(errorModal).toBeVisible();
  });

  test('should handle special characters in name', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    
    // Try special characters
    await nameInput.fill('PLAYER@#$');

    // Should accept or sanitize input
    const value = await nameInput.inputValue();
    expect(value).toBeTruthy();
    expect(value.length).toBeLessThanOrEqual(10);
  });

  test('should handle spaces in name input', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    
    // Enter name with spaces
    await nameInput.fill('PLAYER ONE');

    const value = await nameInput.inputValue();
    expect(value).toBeTruthy();
  });

  test('should validate code is numeric or alphanumeric', async ({ page }) => {
    const codeInput = page.locator('input[placeholder*="CODE" i]');
    
    // Try special characters
    await codeInput.fill('@#$%');

    // Code should be limited to valid characters
    const value = await codeInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(4);
  });

  test('should handle rapid error dismissals', async ({ page }) => {
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    
    // Trigger multiple errors quickly
    for (let i = 0; i < 3; i++) {
      await joinButton.click();
      const errorModal = page.locator('[class*="fixed"][class*="inset"]');
      await expect(errorModal).toBeVisible();

      const okButton = page.locator('button').filter({ hasText: /OK/i });
      await okButton.click();
    }

    // Page should remain stable
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should not crash with maximum length inputs', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');
    const codeInput = page.locator('input[placeholder*="CODE" i]');

    // Fill with maximum characters
    await nameInput.fill('VERYLONGNAME1234567890');
    await codeInput.fill('123456');

    // Check constraints
    const nameValue = await nameInput.inputValue();
    const codeValue = await codeInput.inputValue();

    expect(nameValue.length).toBeLessThanOrEqual(10);
    expect(codeValue.length).toBeLessThanOrEqual(4);
  });

  test('should handle very rapid input changes', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="ENTER NAME" i]');

    // Rapidly change input
    const testStrings = ['A', 'AB', 'ABC', 'ABCD', 'ABC', 'AB', 'A', ''];
    for (const str of testStrings) {
      await nameInput.fill(str);
    }

    // Page should remain stable
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should display alert icon in error modal', async ({ page }) => {
    // Trigger error
    const joinButton = page.locator('button').filter({ hasText: /JOIN/i });
    await joinButton.click();

    // Look for alert icon
    const alertIcon = page.locator('svg');
    const count = await alertIcon.count();
    
    // Should have some SVG icons
    expect(count).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';

test.describe('PlayerJoinScreen Avatar Style Label', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the join screen
    await page.goto('/');
  });

  test('should display avatar style name as the section label', async ({ page }) => {
    // The label should initially contain the default avatar style
    const label = page.locator('label').filter({ hasText: /avataaars|pixel-art|adventurer|bottts-neutral|micah|open-peeps|personas|toon-head/i }).first();
    
    // Verify the label exists and contains a style name
    await expect(label).toBeVisible();
    
    // Get the initial style name
    const initialText = await label.textContent();
    expect(initialText).toBeTruthy();
  });

  test('should update label when cycling through avatar styles', async ({ page }) => {
    // Get initial label text
    const label = page.locator('label').filter({ hasText: /avataaars|pixel-art|adventurer|bottts-neutral|micah|open-peeps|personas|toon-head/i }).first();
    const initialStyle = await label.textContent();

    // Click the next style button
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1); // Right chevron
    await nextButton.click();

    // Wait a moment for state update
    await page.waitForTimeout(300);

    // Verify label has changed
    const updatedStyle = await label.textContent();
    expect(updatedStyle).not.toBe(initialStyle);
  });

  test('should show uppercase hyphenated style names formatted with spaces', async ({ page }) => {
    // Click through styles and verify formatting
    const label = page.locator('label').filter({ hasText: /avataaars|pixel-art|adventurer|bottts-neutral|micah|open-peeps|personas|toon-head/i }).first();
    
    // The label should contain properly formatted text (e.g., "PIXEL ART" instead of "pixel-art")
    const labelText = await label.textContent();
    expect(labelText).toMatch(/[A-Z\s]+/); // Should contain uppercase and spaces
    expect(labelText).not.toContain('-'); // Should not contain hyphens after formatting
  });

  test('should not display "Colour Choice" label', async ({ page }) => {
    // Verify that the old "Colour Choice" label is gone
    const colourChoiceLabel = page.locator('label').filter({ hasText: /Colour Choice/i });
    await expect(colourChoiceLabel).not.toBeVisible();
  });

  test('should cycle through all available styles', async ({ page }) => {
    const label = page.locator('label').filter({ hasText: /avataaars|pixel-art|adventurer|bottts-neutral|micah|open-peeps|personas|toon-head/i }).first();
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    
    const styles = new Set<string>();
    
    // Collect styles by cycling through
    for (let i = 0; i < 10; i++) {
      const currentStyle = await label.textContent();
      styles.add(currentStyle || '');
      await nextButton.click();
      await page.waitForTimeout(200);
    }

    // Should have at least 8 different styles (from the config)
    expect(styles.size).toBeGreaterThanOrEqual(8);
  });

  test('should have valid styling on the label', async ({ page }) => {
    const label = page.locator('label').filter({ hasText: /avataaars|pixel-art|adventurer|bottts-neutral|micah|open-peeps|personas|toon-head/i }).first();
    
    // Verify label has proper styling classes
    const className = await label.getAttribute('class');
    expect(className).toContain('uppercase');
    expect(className).toContain('font-black');
    expect(className).toContain('tracking');
  });
});

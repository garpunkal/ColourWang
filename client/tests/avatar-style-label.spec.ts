import { test, expect } from '@playwright/test';

// Labels in PlayerJoinScreen DOM order:
//   0: "Name"  1: "Code"  2: "Style Your Wang"  3: <current style name>
// The style name is avatarStyle.replace('-', ' ') — lowercase text, CSS handles uppercase.
// There are 12 available styles in config/avatars.json.

test.describe('Avatar Style Label', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click();
    await page.waitForSelector('input[placeholder*="ENTER NAME" i]');
  });

  test('should display the default style name as a label', async ({ page }) => {
    // Default style is "avataaars" → displayed as "avataaars" (CSS uppercases it visually)
    const styleLabel = page.locator('label').nth(3);
    await expect(styleLabel).toBeVisible();
    expect((await styleLabel.textContent())?.trim()).toBe('avataaars');
  });

  test('should update the label when cycling to the next style', async ({ page }) => {
    const styleLabel = page.locator('label').nth(3);
    const initial = (await styleLabel.textContent())?.trim();
    await page.getByRole('button').filter({ has: page.locator('svg') }).nth(1).click();
    await page.waitForTimeout(200);
    expect((await styleLabel.textContent())?.trim()).not.toBe(initial);
  });

  test('should display style names with spaces instead of hyphens', async ({ page }) => {
    const styleLabel = page.locator('label').nth(3);
    const nextBtn = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1);
    for (let i = 0; i < 12; i++) {
      expect(await styleLabel.textContent()).not.toContain('-');
      await nextBtn.click();
      await page.waitForTimeout(100);
    }
  });

  test('should not display a "Colour Choice" label', async ({ page }) => {
    await expect(page.locator('label').filter({ hasText: /Colour Choice/i })).not.toBeVisible();
  });

  test('should cycle through all 12 available styles', async ({ page }) => {
    const styleLabel = page.locator('label').nth(3);
    const nextBtn = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1);
    const styles = new Set<string>();

    styles.add((await styleLabel.textContent())?.trim() || '');
    for (let i = 0; i < 12; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
      styles.add((await styleLabel.textContent())?.trim() || '');
    }
    expect(styles.size).toBe(12);
  });
});

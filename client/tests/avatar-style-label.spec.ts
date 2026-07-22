import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

const avatarConfig = JSON.parse(
  readFileSync(new URL('../../config/avatars.json', import.meta.url), 'utf8'),
) as { styles: { available: string[] } };

// Labels in PlayerJoinScreen DOM order:
//   0: "Name"  1: "Code"  2: "Style Your Wang"  3: <current style name>
// The style name is avatarStyle.replace('-', ' ') — lowercase text, CSS handles uppercase.

const totalStyles = avatarConfig.styles.available.length;

test.describe('Avatar Style Label', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.locator('button').filter({ hasText: 'JOIN NOW' }).click({ force: true });
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
    await page.getByRole('button').filter({ has: page.locator('svg') }).nth(1).click({ force: true });
    await page.waitForFunction(
      (prev) => (document.querySelectorAll('label')[3] as HTMLElement)?.textContent?.trim() !== prev,
      initial,
    );
    expect((await styleLabel.textContent())?.trim()).not.toBe(initial);
  });

  test('should display style names with spaces instead of hyphens', async ({ page }) => {
    const styleLabel = page.locator('label').nth(3);
    const nextBtn = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1);
    for (let i = 0; i < totalStyles; i++) {
      const current = (await styleLabel.textContent())?.trim() ?? '';
      expect(current).not.toContain('-');
      await nextBtn.click({ force: true });
      await page.waitForTimeout(75);
    }
  });

  test('should not display a "Colour Choice" label', async ({ page }) => {
    await expect(page.locator('label').filter({ hasText: /Colour Choice/i })).not.toBeVisible();
  });

  test('should cycle through all available styles', async ({ page }) => {
    const styleLabel = page.locator('label').nth(3);
    const nextBtn = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1);
    const initialStyle = (await styleLabel.textContent())?.trim() || '';

    for (let i = 0; i < totalStyles; i++) {
      await nextBtn.click({ force: true });
      await page.waitForTimeout(75);
    }
    expect((await styleLabel.textContent())?.trim()).toBe(initialStyle);
  });
});

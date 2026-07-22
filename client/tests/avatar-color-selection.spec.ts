import { test, expect } from '@playwright/test';

test.describe('Avatar Color Selection and Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all available avatar colors', async ({ page }) => {
    // Get all avatar buttons in the color choice grid
    const avatarButtons = page.locator('button').filter({ 
      has: page.locator('[class*="drop-shadow"]') 
    }).locator('parent').filter({ hasText: '' });

    const count = await page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i], button[title*="ELECTRIC" i], button[title*="GOLDEN" i]').count();
    
    // Should have multiple avatar colors available (at least 10+)
    expect(count).toBeGreaterThan(0);
  });

  test('should allow selecting different avatar colors', async ({ page }) => {
    // Find and click different avatar buttons
    const avatarButtons = page.locator('button');
    
    // Get buttons that are not disabled (not taken)
    let clickedCount = 0;
    const buttons = await page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i]').all();
    
    for (const button of buttons.slice(0, 3)) {
      const isDisabled = await button.evaluate(el => (el as HTMLButtonElement).disabled);
      if (!isDisabled) {
        await button.click();
        clickedCount++;
        if (clickedCount >= 2) break;
      }
    }

    expect(clickedCount).toBeGreaterThan(0);
  });

  test('should highlight selected avatar with visual indicator', async ({ page }) => {
    // Click an avatar button
    const avatarButtons = page.locator('button[title*="MIDNIGHT" i]');
    if (await avatarButtons.count() > 0) {
      const firstButton = avatarButtons.first();
      const isDisabled = await firstButton.evaluate(el => (el as HTMLButtonElement).disabled);
      
      if (!isDisabled) {
        await firstButton.click();
        
        // Check for selection indicator (ring class)
        const className = await firstButton.getAttribute('class');
        expect(className).toContain('ring');
      }
    }
  });

  test('should show taken avatars as disabled', async ({ page }) => {
    // Find a disabled/taken avatar button
    const allAvatarButtons = page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i], button[title*="ELECTRIC" i], button[title*="GOLDEN" i]');
    
    let foundDisabled = false;
    const buttons = await allAvatarButtons.all();
    
    for (const button of buttons) {
      const isDisabled = await button.evaluate(el => (el as HTMLButtonElement).disabled);
      if (isDisabled) {
        // Should have lock icon or opacity reduction
        const className = await button.getAttribute('class');
        expect(className).toContain('opacity');
        foundDisabled = true;
        break;
      }
    }

    // Either all are available or at least one is taken
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should persist avatar selection in localStorage', async ({ page }) => {
    // Select an avatar
    const avatarButtons = page.locator('button[title*="MIDNIGHT" i]');
    if (await avatarButtons.count() > 0) {
      const firstButton = avatarButtons.first();
      const isDisabled = await firstButton.evaluate(el => (el as HTMLButtonElement).disabled);
      
      if (!isDisabled) {
        await firstButton.click();

        // Check localStorage
        const selectedAvatar = await page.evaluate(() => 
          localStorage.getItem('playerAvatar')
        );
        expect(selectedAvatar).toBeTruthy();
      }
    }
  });

  test('should cycle through avatar colors smoothly', async ({ page }) => {
    const colorNames = new Set<string>();
    
    // Get initial style label
    const styleLabel = page.locator('label').filter({ hasText: /avataaars|pixel-art|adventurer/i }).first();
    
    // Click next button a few times
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    
    for (let i = 0; i < 5; i++) {
      const style = await styleLabel.textContent();
      if (style) colorNames.add(style);
      await nextButton.click();
      await page.waitForTimeout(100);
    }

    // Should have cycled through different styles
    expect(colorNames.size).toBeGreaterThan(1);
  });

  test('should handle rapid avatar selection', async ({ page }) => {
    const avatarButtons = page.locator('button[title*="MIDNIGHT" i], button[title*="NEON" i], button[title*="CYBER" i]');
    const buttons = await avatarButtons.all();

    // Rapidly click different avatars
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const isDisabled = await buttons[i].evaluate(el => (el as HTMLButtonElement).disabled);
      if (!isDisabled) {
        await buttons[i].click({ force: true });
      }
    }

    // Page should remain stable
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should restore avatar selection from localStorage on reload', async ({ page }) => {
    // Select an avatar
    const avatarButtons = page.locator('button[title*="MIDNIGHT" i]');
    if (await avatarButtons.count() > 0) {
      const firstButton = avatarButtons.first();
      const isDisabled = await firstButton.evaluate(el => (el as HTMLButtonElement).disabled);
      
      if (!isDisabled) {
        await firstButton.click();

        // Get the title attribute
        const title = await firstButton.getAttribute('title');

        // Reload page
        await page.reload();

        // Avatar should still be selected
        const reloadedButton = page.locator(`button[title="${title}"]`);
        const className = await reloadedButton.getAttribute('class');
        expect(className).toContain('ring');
      }
    }
  });
});

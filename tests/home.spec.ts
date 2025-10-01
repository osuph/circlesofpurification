import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page with quests', async ({ page }) => {
    await page.goto('/');

    // Wait for tasks to load
    await page.waitForSelector('.stamp-card-grid', { timeout: 10000 });

    // Check if the page title is visible
    await expect(page.locator('h1')).toContainText('Welcome! Your Adventure Awaits!');

    // Check if stamp status is visible
    const stampStatus = page.locator('.stamp-status');
    await expect(stampStatus).toBeVisible();

    // Verify that quest cards are displayed
    const stampItems = page.locator('.stamp-item');
    await expect(stampItems).not.toHaveCount(0);
  });

  test('should open challenge card when clicking on a quest', async ({ page }) => {
    await page.goto('/');

    // Wait for tasks to load
    await page.waitForSelector('.stamp-card-grid', { timeout: 10000 });

    // Click on the first quest
    const firstQuest = page.locator('.stamp-item').first();
    await firstQuest.click();

    // Verify challenge card is displayed
    const challengeCard = page.locator('challenge-card');
    await expect(challengeCard).toBeVisible();

    // Verify challenge card has the quest name
    const questName = await firstQuest.locator('span').textContent();
    await expect(page.locator('h2')).toContainText(questName || '');

    // Close the challenge card
    const dismissButton = page.locator('sl-button[variant="neutral"]').first();
    await dismissButton.click();

    // Verify challenge card is closed
    await expect(challengeCard).not.toBeAttached();
  });

  test('should show loading state when tasks are not loaded', async ({ page }) => {
    // Go to page before tasks load by intercepting the request
    await page.route('**/tasks.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      route.abort();
    });

    await page.goto('/');

    // Check for loading message
    const loadingMessage = page.locator('.loading-message');
    await expect(loadingMessage).toContainText('Loading quests...');
  });
});

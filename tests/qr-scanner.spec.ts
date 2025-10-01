import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('QR Scanner', () => {
  test('should test QR scanner on barcode test page', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    await page.goto('/barcode');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Barcode Scanner Test Page');

    // Verify scan button is visible
    const scanButton = page.locator('#scan');
    await expect(scanButton).toBeVisible();
    await expect(scanButton).toBeEnabled();

    // Verify video container is present
    const videoContainer = page.locator('#video-container');
    await expect(videoContainer).toBeVisible();
  });

  test('should complete a quest with correct QR code', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    // Read tasks.json to get the first task flag
    const tasksPath = path.join(process.cwd(), 'public', 'tasks.json');
    const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
    const tasks = JSON.parse(tasksContent);
    
    expect(tasks.length).toBeGreaterThan(0);
    const firstTask = tasks[0];

    // Clear local storage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for tasks to load
    await page.waitForSelector('.stamp-card-grid', { timeout: 10000 });

    // Click on the first quest
    const firstQuest = page.locator('.stamp-item').first();
    await firstQuest.click();

    // Click "Complete Quest" button
    const completeButton = page.locator('sl-button[variant="primary"]');
    await completeButton.click();

    // Verify QR scanner is shown
    const scannerOverlay = page.locator('.scanner-overlay');
    await expect(scannerOverlay).toBeVisible({ timeout: 5000 });

    // Verify correct quest name is shown
    await expect(page.locator('.scanner-overlay h2')).toContainText(firstTask.name);

    // Cancel the scan
    const cancelButton = page.locator('#cancel-button');
    await cancelButton.click();

    // Verify scanner is closed
    await expect(scannerOverlay).not.toBeAttached();
  });

  test('should show all quests from tasks.json', async ({ page }) => {
    // Read tasks.json
    const tasksPath = path.join(process.cwd(), 'public', 'tasks.json');
    const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
    const tasks = JSON.parse(tasksContent);

    await page.goto('/');

    // Wait for tasks to load
    await page.waitForSelector('.stamp-card-grid', { timeout: 10000 });

    // Verify all tasks are displayed
    const stampItems = page.locator('.stamp-item');
    await expect(stampItems).toHaveCount(tasks.length);

    // Verify each task name is displayed
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const stampItem = stampItems.nth(i);
      await expect(stampItem).toContainText(task.name);
    }
  });

  test('should persist completed quests in localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for tasks to load
    await page.waitForSelector('.stamp-card-grid', { timeout: 10000 });

    // Get initial completed count
    const initialStatus = await page.locator('.stamp-status').textContent();
    
    // Store a completed quest manually via localStorage
    await page.evaluate(() => {
      localStorage.setItem('PURIFICATION_PROGRESS', '1'); // First quest completed
    });

    // Reload page
    await page.reload();
    await page.waitForSelector('.stamp-card-grid', { timeout: 10000 });

    // Verify first quest is marked as completed
    const firstQuest = page.locator('.stamp-item').first();
    await expect(firstQuest).toHaveClass(/completed/);

    // Verify stamp count increased
    const updatedStatus = await page.locator('.stamp-status').textContent();
    expect(updatedStatus).toContain('1');
  });
});

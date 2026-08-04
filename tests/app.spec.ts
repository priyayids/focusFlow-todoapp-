import { test, expect } from '@playwright/test';

test.describe('FocusFlow Application', () => {
  test('should load the dashboard and verify key elements', async ({ page }) => {
    // Navigate to the local server
    await page.goto('http://localhost:3000');
    
    // Check for the main title in the sidebar
    await expect(page.locator('h1')).toHaveText('FocusFlow');
    
    // Check that the Dashboard tab is active by default
    const dashboardTab = page.locator('.nav-item.active');
    await expect(dashboardTab).toContainText('Dashboard');
    
    // Verify pinned notes section exists
    await expect(page.locator('h3', { hasText: 'Pinned Notes' })).toBeVisible();
    
    // Verify recent tasks section exists
    await expect(page.locator('h3', { hasText: 'Recent Tasks' })).toBeVisible();
    
    // Navigate to Notes tab
    await page.locator('.nav-item:has-text("Notes")').click();
    await expect(page.locator('.header h2')).toHaveText('Notes');
    
    // Ensure the note input exists
    await expect(page.locator('input[placeholder="Type a note..."]')).toBeVisible();
  });
});

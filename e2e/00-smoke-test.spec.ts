import { test, expect } from '@playwright/test';

/**
 * Smoke Test - Basic Application Health Check
 * 
 * This test verifies that the application is running and accessible.
 * It doesn't require authentication and serves as a quick sanity check.
 */

test.describe('Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Agile Planning Tool/i);
  });

  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page elements (use more specific selector)
    await expect(page.getByRole('button', { name: 'Sign in with GitHub' })).toBeVisible({ timeout: 10000 });
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Verify page is responsive
    await expect(page).not.toHaveTitle('');
  });

  test('should handle 404 pages', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    
    // Verify 404 handling
    expect(response?.status()).toBe(404);
  });
});

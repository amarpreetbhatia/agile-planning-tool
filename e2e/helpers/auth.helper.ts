import { Page, BrowserContext } from '@playwright/test';

/**
 * Helper functions for authentication in E2E tests
 * 
 * NOTE: These tests require a mock authentication setup or real GitHub OAuth credentials.
 * For now, we'll use session storage to bypass authentication for demo purposes.
 */

/**
 * Mock authentication by setting session storage directly
 * This bypasses the GitHub OAuth flow for testing purposes
 */
export async function setupMockAuth(page: Page) {
  // Create a mock session token
  const mockSession = {
    user: {
      id: 'test-user-id',
      githubId: 'test-github-id',
      username: 'test-user',
      email: 'test@example.com',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      accessToken: 'mock-access-token',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Set the session in localStorage/cookies
  await page.goto('/');
  
  await page.evaluate((session) => {
    // Store mock session data
    localStorage.setItem('next-auth.session-token', JSON.stringify(session));
    
    // Set a mock cookie for NextAuth
    document.cookie = `next-auth.session-token=${JSON.stringify(session)}; path=/; max-age=86400`;
  }, mockSession);
}

/**
 * Login with GitHub OAuth (requires real credentials or mock server)
 */
export async function loginWithGitHub(page: Page, username: string = 'testuser') {
  // Navigate to login page
  await page.goto('/login');
  
  // For real GitHub OAuth, you would:
  // 1. Click the GitHub login button
  // 2. Fill in GitHub credentials on GitHub's page
  // 3. Handle the OAuth callback
  
  // For now, we'll use mock auth
  await setupMockAuth(page);
  
  // Navigate to the app
  await page.goto('/projects');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page) {
  try {
    // Click user menu
    await page.click('[data-testid="user-menu"]', { timeout: 5000 });
    
    // Click logout
    await page.click('button:has-text("Logout")');
    
    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
  } catch (error) {
    console.log('Logout failed, clearing session manually');
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
    await page.goto('/login');
  }
}

/**
 * Setup authenticated session for tests
 * This can be used in beforeEach hooks
 */
export async function setupAuthenticatedSession(page: Page) {
  // Use mock authentication for testing
  await setupMockAuth(page);
  
  // Navigate to projects page
  await page.goto('/projects');
  
  // Wait for page to be ready
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Save authentication state to reuse across tests
 * This improves test performance by avoiding repeated logins
 */
export async function saveAuthState(context: BrowserContext, path: string = 'playwright/.auth/user.json') {
  await context.storageState({ path });
}

/**
 * Load saved authentication state
 */
export async function loadAuthState(path: string = 'playwright/.auth/user.json') {
  return path;
}

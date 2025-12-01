# Authentication Setup for E2E Tests

## Current Status

⚠️ **The E2E tests currently use mock authentication** because GitHub OAuth requires real credentials or a mock OAuth server.

## Why Tests Are Failing

The tests are failing because:
1. GitHub OAuth authentication requires real GitHub credentials
2. The application redirects to GitHub for authentication
3. Tests timeout waiting for the OAuth flow to complete

## Solutions

### Option 1: Mock Authentication (Current - Needs Backend Support)

The `auth.helper.ts` currently tries to mock authentication by setting session storage, but this requires the backend to accept mock sessions.

**To make this work:**

1. Add a test mode to your application that bypasses GitHub OAuth
2. Set an environment variable: `TEST_MODE=true`
3. Modify `lib/auth.ts` to accept mock sessions in test mode

```typescript
// In lib/auth.ts
if (process.env.TEST_MODE === 'true') {
  // Accept mock sessions for testing
  callbacks: {
    async session({ session, token }) {
      // Allow test sessions
      if (token.sub === 'test-user-id') {
        return {
          ...session,
          user: {
            id: 'test-user-id',
            githubId: 'test-github-id',
            username: 'test-user',
            email: 'test@example.com',
            avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
          },
        };
      }
      return session;
    },
  },
}
```

### Option 2: Use Real GitHub OAuth (Recommended for CI/CD)

Create a test GitHub account and use real OAuth flow.

**Steps:**

1. Create a test GitHub account (e.g., `agile-planning-test`)
2. Create a GitHub OAuth App for testing
3. Store credentials in environment variables:

```bash
# .env.test
GITHUB_TEST_USERNAME=agile-planning-test
GITHUB_TEST_PASSWORD=your-test-password
GITHUB_CLIENT_ID=your-test-client-id
GITHUB_CLIENT_SECRET=your-test-client-secret
```

4. Update `auth.helper.ts` to use real OAuth:

```typescript
export async function loginWithGitHub(page: Page) {
  await page.goto('/login');
  await page.click('button:has-text("Sign in with GitHub")');
  
  // Wait for GitHub login page
  await page.waitForURL(/github\.com\/login/);
  
  // Fill in credentials
  await page.fill('input[name="login"]', process.env.GITHUB_TEST_USERNAME!);
  await page.fill('input[name="password"]', process.env.GITHUB_TEST_PASSWORD!);
  await page.click('input[type="submit"]');
  
  // Wait for redirect back to app
  await page.waitForURL('/projects');
}
```

### Option 3: Use Playwright's Storage State (Best for Speed)

Authenticate once and reuse the session across all tests.

**Steps:**

1. Create a setup script that logs in once:

```typescript
// e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Perform login
  await page.goto('http://localhost:3000/login');
  // ... login steps ...
  
  // Save authentication state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
```

2. Update `playwright.config.ts`:

```typescript
export default defineConfig({
  globalSetup: require.resolve('./e2e/global-setup'),
  use: {
    storageState: 'playwright/.auth/user.json',
  },
});
```

### Option 4: API-Based Authentication

Create an API endpoint that generates test sessions.

**Steps:**

1. Add a test-only API endpoint:

```typescript
// app/api/test/auth/route.ts
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'test') {
    return new Response('Not allowed', { status: 403 });
  }
  
  // Create test session
  const session = await createTestSession();
  return Response.json({ session });
}
```

2. Use it in tests:

```typescript
export async function setupAuthenticatedSession(page: Page) {
  // Get test session from API
  const response = await page.request.post('/api/test/auth');
  const { session } = await response.json();
  
  // Set session cookie
  await page.context().addCookies([{
    name: 'next-auth.session-token',
    value: session.token,
    domain: 'localhost',
    path: '/',
  }]);
  
  await page.goto('/projects');
}
```

## Recommended Approach

For your use case, I recommend **Option 3 (Storage State)** because:
- ✅ Fast (authenticate once, reuse everywhere)
- ✅ Realistic (uses real OAuth flow)
- ✅ Secure (credentials not in code)
- ✅ CI/CD friendly

## Quick Fix for Now

To get tests running immediately without authentication:

1. **Skip authentication-required tests**:

```typescript
test.skip('should create project', async ({ page }) => {
  // This test requires auth
});
```

2. **Run only smoke tests**:

```bash
npx playwright test 00-smoke-test
```

3. **Test UI components directly**:

Create tests that don't require full authentication:

```typescript
test('should render login page correctly', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('button:has-text("Sign in with GitHub")')).toBeVisible();
});
```

## Next Steps

1. Choose an authentication strategy from above
2. Implement the chosen strategy
3. Update `e2e/helpers/auth.helper.ts`
4. Re-run tests: `npm run test:e2e`

## Testing Without Authentication

You can still test many features without full authentication:

- ✅ Page rendering
- ✅ UI components
- ✅ Client-side validation
- ✅ Responsive design
- ✅ Navigation
- ✅ Error pages

Example:

```typescript
test('should validate form inputs', async ({ page }) => {
  await page.goto('/login');
  
  // Test client-side validation
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Required')).toBeVisible();
});
```

## Support

For questions:
- Review Playwright auth docs: https://playwright.dev/docs/auth
- Check NextAuth.js testing: https://next-auth.js.org/getting-started/client#testing
- See this guide for implementation details

---

**Status**: ⚠️ Authentication setup required  
**Priority**: High  
**Estimated Time**: 1-2 hours depending on chosen approach

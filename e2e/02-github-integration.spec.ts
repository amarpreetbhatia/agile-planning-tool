import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers/auth.helper';
import { generateProjectName, generateSessionName, TEST_GITHUB_REPO } from './helpers/test-data.helper';

/**
 * E2E Test Scenario 2: GitHub Integration Workflow
 * 
 * Business Value:
 * - Demonstrates seamless integration with existing GitHub workflows
 * - Shows how teams can import issues directly from GitHub Projects
 * - Validates that estimates sync back to GitHub
 * 
 * User Story:
 * As a Product Owner, I want to import user stories from GitHub Issues,
 * so that I can estimate them without manual data entry and keep GitHub updated.
 */

test.describe('GitHub Integration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test('should import stories from GitHub and sync estimates back', async ({ page }) => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();

    // Step 1: Create project with GitHub integration
    await test.step('Create project', async () => {
      await page.goto('/projects');
      await page.click('button:has-text("New Project")');
      
      await page.fill('input[name="name"]', projectName);
      await page.fill('textarea[name="description"]', 'Project with GitHub integration');
      
      await page.click('button[type="submit"]:has-text("Create Project")');
      await expect(page.locator(`text=${projectName}`)).toBeVisible();
    });

    // Step 2: Create session
    await test.step('Create session', async () => {
      await page.click(`text=${projectName}`);
      await page.click('button:has-text("New Session")');
      
      await page.fill('input[name="sessionName"]', sessionName);
      await page.click('button[type="submit"]:has-text("Create Session")');
      
      await expect(page.locator(`h1:has-text("${sessionName}")`)).toBeVisible();
    });

    // Step 3: Connect to GitHub
    await test.step('Connect GitHub repository', async () => {
      await page.click('button:has-text("GitHub Integration")');
      
      // Select repository
      await page.click('button:has-text("Select Repository")');
      await page.fill('input[placeholder="Search repositories"]', TEST_GITHUB_REPO.repo);
      await page.click(`text=${TEST_GITHUB_REPO.owner}/${TEST_GITHUB_REPO.repo}`);
      
      // Verify connection success
      await expect(page.locator('text=Connected to')).toBeVisible();
      await expect(page.locator(`text=${TEST_GITHUB_REPO.repo}`)).toBeVisible();
    });

    // Step 4: Import issues from GitHub
    await test.step('Import GitHub issues', async () => {
      await page.click('button:has-text("Import Issues")');
      
      // Select issues to import
      for (const issue of TEST_GITHUB_REPO.issues) {
        await page.click(`[data-testid="github-issue-${issue.number}"] input[type="checkbox"]`);
      }
      
      await page.click('button:has-text("Import Selected")');
      
      // Verify issues were imported
      for (const issue of TEST_GITHUB_REPO.issues) {
        await expect(page.locator(`text=${issue.title}`)).toBeVisible();
      }
      
      // Verify GitHub issue numbers are displayed
      await expect(page.locator('text=#1')).toBeVisible();
      await expect(page.locator('text=#2')).toBeVisible();
    });

    // Step 5: Estimate imported story
    await test.step('Estimate GitHub issue', async () => {
      const firstIssue = TEST_GITHUB_REPO.issues[0];
      
      // Select first issue for estimation
      await page.click(`[data-testid="story-${firstIssue.title}"] button:has-text("Estimate")`);
      
      // Verify GitHub issue details are displayed
      await expect(page.locator('.current-story')).toContainText(firstIssue.title);
      await expect(page.locator('.current-story')).toContainText(`#${firstIssue.number}`);
      
      // Cast vote
      await page.click('[data-testid="poker-card-5"]');
      
      // Reveal and finalize
      await page.click('button:has-text("Reveal Estimates")');
      await page.click('button:has-text("Finalize Estimate")');
      await page.fill('input[name="finalEstimate"]', '5');
      await page.click('button[type="submit"]:has-text("Finalize")');
      
      // Verify estimate is marked for GitHub sync
      await expect(page.locator('[data-testid="github-sync-status"]')).toContainText('Syncing to GitHub');
      
      // Wait for sync to complete
      await expect(page.locator('[data-testid="github-sync-status"]')).toContainText('Synced', { timeout: 5000 });
    });

    // Step 6: Verify GitHub comment was added
    await test.step('Verify GitHub integration', async () => {
      // Click on story to view details
      await page.click(`text=${TEST_GITHUB_REPO.issues[0].title}`);
      
      // Verify GitHub link is present
      await expect(page.locator(`a[href*="github.com"][href*="${TEST_GITHUB_REPO.issues[0].number}"]`)).toBeVisible();
      
      // Verify sync status
      await expect(page.locator('text=Estimate synced to GitHub')).toBeVisible();
    });
  });

  test('should handle GitHub Projects V2 integration', async ({ page }) => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();

    // Create project and session
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', projectName);
    await page.click('button[type="submit"]:has-text("Create Project")');
    
    await page.click(`text=${projectName}`);
    await page.click('button:has-text("New Session")');
    await page.fill('input[name="sessionName"]', sessionName);
    await page.click('button[type="submit"]:has-text("Create Session")');

    // Connect to GitHub Projects
    await test.step('Connect GitHub Project', async () => {
      await page.click('button:has-text("GitHub Integration")');
      await page.click('button:has-text("Select Repository")');
      await page.fill('input[placeholder="Search repositories"]', TEST_GITHUB_REPO.repo);
      await page.click(`text=${TEST_GITHUB_REPO.owner}/${TEST_GITHUB_REPO.repo}`);
      
      // Select GitHub Project
      await page.click('button:has-text("Select Project")');
      await page.click('text=Sprint Planning Board');
      
      // Verify project connection
      await expect(page.locator('text=Connected to Sprint Planning Board')).toBeVisible();
    });

    // Import project items
    await test.step('Import project items', async () => {
      await page.click('button:has-text("Import from Project")');
      
      // Filter by status
      await page.selectOption('select[name="status"]', 'Ready for Estimation');
      
      // Select all items
      await page.click('input[type="checkbox"][name="select-all"]');
      await page.click('button:has-text("Import Selected")');
      
      // Verify items were imported with project metadata
      await expect(page.locator('[data-testid="project-item"]')).toHaveCount(3);
      await expect(page.locator('text=Ready for Estimation')).toBeVisible();
    });
  });

  test('should handle GitHub API errors gracefully', async ({ page }) => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();

    // Create project and session
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', projectName);
    await page.click('button[type="submit"]:has-text("Create Project")');
    
    await page.click(`text=${projectName}`);
    await page.click('button:has-text("New Session")');
    await page.fill('input[name="sessionName"]', sessionName);
    await page.click('button[type="submit"]:has-text("Create Session")');

    // Attempt to connect with invalid repository
    await test.step('Handle invalid repository', async () => {
      await page.click('button:has-text("GitHub Integration")');
      await page.click('button:has-text("Select Repository")');
      await page.fill('input[placeholder="Search repositories"]', 'nonexistent-repo-12345');
      
      // Verify error message
      await expect(page.locator('text=No repositories found')).toBeVisible();
      
      // Verify user can retry
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    });

    // Test rate limit handling
    await test.step('Handle rate limit', async () => {
      // This would require mocking the GitHub API response
      // In a real test, you would intercept the API call and return a 429 status
      
      // Verify rate limit message is displayed
      // await expect(page.locator('text=GitHub API rate limit exceeded')).toBeVisible();
      // await expect(page.locator('text=Please try again later')).toBeVisible();
    });
  });
});

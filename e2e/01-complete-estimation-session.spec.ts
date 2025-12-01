import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers/auth.helper';
import { generateProjectName, generateSessionName, generateStoryTitle, generateStoryDescription, getRandomFibonacciValue } from './helpers/test-data.helper';

/**
 * E2E Test Scenario 1: Complete Estimation Session Flow
 * 
 * Business Value:
 * - Demonstrates the core planning poker functionality
 * - Shows how teams can estimate stories collaboratively
 * - Validates the entire user journey from project creation to estimate finalization
 * 
 * User Story:
 * As a Scrum Master, I want to conduct a planning poker session with my team,
 * so that we can estimate user stories collaboratively and reach consensus.
 */

test.describe('Complete Estimation Session Flow', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Setup authentication - see e2e/AUTHENTICATION_SETUP.md
    // await setupAuthenticatedSession(page);
  });

  test.skip('should complete full estimation workflow from project creation to finalized estimate', async ({ page }) => {
    // SKIPPED: Requires authentication setup
    // See e2e/AUTHENTICATION_SETUP.md for setup instructions
    const projectName = generateProjectName();
    const sessionName = generateSessionName();
    const storyTitle = generateStoryTitle();
    const storyDescription = generateStoryDescription();
    const estimateValue = getRandomFibonacciValue();

    // Step 1: Create a new project
    await test.step('Create new project', async () => {
      await page.goto('/projects');
      await page.click('button:has-text("New Project")');
      
      await page.fill('input[name="name"]', projectName);
      await page.fill('textarea[name="description"]', 'E2E Test Project for Planning Poker');
      
      await page.click('button[type="submit"]:has-text("Create Project")');
      
      // Verify project was created
      await expect(page.locator(`text=${projectName}`)).toBeVisible();
    });

    // Step 2: Create a new estimation session
    await test.step('Create estimation session', async () => {
      await page.click(`text=${projectName}`);
      await page.click('button:has-text("New Session")');
      
      await page.fill('input[name="sessionName"]', sessionName);
      await page.selectOption('select[name="votingMode"]', 'anonymous');
      
      await page.click('button[type="submit"]:has-text("Create Session")');
      
      // Verify session was created and we're on session page
      await expect(page.locator(`h1:has-text("${sessionName}")`)).toBeVisible();
      await expect(page.locator('text=Session ID:')).toBeVisible();
    });

    // Step 3: Add a story manually
    await test.step('Add story to session', async () => {
      await page.click('button:has-text("Add Story")');
      
      await page.fill('input[name="title"]', storyTitle);
      await page.fill('textarea[name="description"]', storyDescription);
      
      await page.click('button[type="submit"]:has-text("Add")');
      
      // Verify story appears in backlog
      await expect(page.locator(`text=${storyTitle}`)).toBeVisible();
    });

    // Step 4: Select story for estimation
    await test.step('Select story for estimation', async () => {
      await page.click(`[data-testid="story-${storyTitle}"] button:has-text("Estimate")`);
      
      // Verify story is displayed for estimation
      await expect(page.locator('.current-story')).toContainText(storyTitle);
      await expect(page.locator('.current-story')).toContainText(storyDescription);
    });

    // Step 5: Cast a vote
    await test.step('Cast vote for story', async () => {
      // Click on poker card with the estimate value
      await page.click(`[data-testid="poker-card-${estimateValue}"]`);
      
      // Verify vote was cast (card should be highlighted)
      await expect(page.locator(`[data-testid="poker-card-${estimateValue}"]`)).toHaveClass(/selected|active/);
      
      // Verify voting status shows user has voted
      await expect(page.locator('[data-testid="voting-status"]')).toContainText('1 of 1 voted');
    });

    // Step 6: Reveal estimates
    await test.step('Reveal estimates', async () => {
      await page.click('button:has-text("Reveal Estimates")');
      
      // Verify results are displayed
      await expect(page.locator('[data-testid="estimate-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-estimate"]')).toContainText(estimateValue.toString());
    });

    // Step 7: Finalize estimate
    await test.step('Finalize estimate', async () => {
      await page.click('button:has-text("Finalize Estimate")');
      
      // Confirm the consensus value
      await page.fill('input[name="finalEstimate"]', estimateValue.toString());
      await page.click('button[type="submit"]:has-text("Finalize")');
      
      // Verify confetti animation appears (success indicator)
      await expect(page.locator('[data-testid="confetti"]')).toBeVisible({ timeout: 2000 });
      
      // Verify story is marked as estimated
      await expect(page.locator(`[data-testid="story-${storyTitle}"]`)).toContainText('Estimated');
      await expect(page.locator(`[data-testid="story-${storyTitle}"]`)).toContainText(estimateValue.toString());
    });

    // Step 8: End session
    await test.step('End session', async () => {
      await page.click('button:has-text("End Session")');
      await page.click('button:has-text("Confirm")');
      
      // Verify redirect to session summary
      await expect(page).toHaveURL(/\/sessions\/.*\/summary/);
      await expect(page.locator('h1:has-text("Session Summary")')).toBeVisible();
    });

    // Step 9: Verify session history
    await test.step('Verify session in history', async () => {
      await page.goto('/history');
      
      // Verify session appears in history
      await expect(page.locator(`text=${sessionName}`)).toBeVisible();
      await expect(page.locator(`text=${storyTitle}`)).toBeVisible();
      await expect(page.locator(`text=${estimateValue}`)).toBeVisible();
    });
  });

  test.skip('should handle multiple stories in a session', async ({ page }) => {
    // SKIPPED: Requires authentication setup
    const projectName = generateProjectName();
    const sessionName = generateSessionName();
    const stories = [
      { title: 'Story 1', description: 'First story', estimate: 3 },
      { title: 'Story 2', description: 'Second story', estimate: 5 },
      { title: 'Story 3', description: 'Third story', estimate: 8 },
    ];

    // Create project and session
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', projectName);
    await page.click('button[type="submit"]:has-text("Create Project")');
    
    await page.click(`text=${projectName}`);
    await page.click('button:has-text("New Session")');
    await page.fill('input[name="sessionName"]', sessionName);
    await page.click('button[type="submit"]:has-text("Create Session")');

    // Add and estimate multiple stories
    for (const story of stories) {
      // Add story
      await page.click('button:has-text("Add Story")');
      await page.fill('input[name="title"]', story.title);
      await page.fill('textarea[name="description"]', story.description);
      await page.click('button[type="submit"]:has-text("Add")');
      
      // Estimate story
      await page.click(`[data-testid="story-${story.title}"] button:has-text("Estimate")`);
      await page.click(`[data-testid="poker-card-${story.estimate}"]`);
      await page.click('button:has-text("Reveal Estimates")');
      await page.click('button:has-text("Finalize Estimate")');
      await page.fill('input[name="finalEstimate"]', story.estimate.toString());
      await page.click('button[type="submit"]:has-text("Finalize")');
      
      // Wait for finalization to complete
      await page.waitForTimeout(1000);
    }

    // Verify all stories are estimated
    for (const story of stories) {
      await expect(page.locator(`[data-testid="story-${story.title}"]`)).toContainText('Estimated');
      await expect(page.locator(`[data-testid="story-${story.title}"]`)).toContainText(story.estimate.toString());
    }

    // Verify total story points
    const totalPoints = stories.reduce((sum, story) => sum + story.estimate, 0);
    await expect(page.locator('[data-testid="total-story-points"]')).toContainText(totalPoints.toString());
  });
});

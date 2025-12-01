import { test, expect, Download } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers/auth.helper';
import { generateProjectName, generateSessionName, generateStoryTitle } from './helpers/test-data.helper';

/**
 * E2E Test Scenario 5: Session History & Export
 * 
 * Business Value:
 * - Demonstrates reporting and analytics capabilities
 * - Shows how teams can track estimation history over time
 * - Validates data export for external analysis
 * 
 * User Story:
 * As a Project Manager, I want to view historical estimation data and export it,
 * so that I can analyze team velocity and improve future planning.
 */

test.describe('Session History & Export', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test('should view session history with detailed statistics', async ({ page }) => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();
    const stories = [
      { title: 'Story 1', estimate: 3 },
      { title: 'Story 2', estimate: 5 },
      { title: 'Story 3', estimate: 8 },
    ];

    // Step 1: Create and complete a session
    await test.step('Create and complete session', async () => {
      // Create project
      await page.goto('/projects');
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', projectName);
      await page.click('button[type="submit"]:has-text("Create Project")');
      
      // Create session
      await page.click(`text=${projectName}`);
      await page.click('button:has-text("New Session")');
      await page.fill('input[name="sessionName"]', sessionName);
      await page.click('button[type="submit"]:has-text("Create Session")');
      
      // Add and estimate stories
      for (const story of stories) {
        await page.click('button:has-text("Add Story")');
        await page.fill('input[name="title"]', story.title);
        await page.fill('textarea[name="description"]', `Description for ${story.title}`);
        await page.click('button[type="submit"]:has-text("Add")');
        
        await page.click(`[data-testid="story-${story.title}"] button:has-text("Estimate")`);
        await page.click(`[data-testid="poker-card-${story.estimate}"]`);
        await page.click('button:has-text("Reveal Estimates")');
        await page.click('button:has-text("Finalize Estimate")');
        await page.fill('input[name="finalEstimate"]', story.estimate.toString());
        await page.click('button[type="submit"]:has-text("Finalize")');
        await page.waitForTimeout(500);
      }
      
      // End session
      await page.click('button:has-text("End Session")');
      await page.click('button:has-text("Confirm")');
    });

    // Step 2: View session history
    await test.step('View session in history', async () => {
      await page.goto('/history');
      
      // Verify session appears in history
      await expect(page.locator(`text=${sessionName}`)).toBeVisible();
      await expect(page.locator(`text=${projectName}`)).toBeVisible();
      
      // Verify session statistics
      const totalPoints = stories.reduce((sum, story) => sum + story.estimate, 0);
      await expect(page.locator(`[data-testid="session-${sessionName}"]`)).toContainText(`${totalPoints} points`);
      await expect(page.locator(`[data-testid="session-${sessionName}"]`)).toContainText(`${stories.length} stories`);
    });

    // Step 3: View detailed session summary
    await test.step('View detailed session summary', async () => {
      await page.click(`[data-testid="session-${sessionName}"]`);
      
      // Verify session details
      await expect(page.locator('h1')).toContainText('Session Summary');
      await expect(page.locator('h2')).toContainText(sessionName);
      
      // Verify all stories are listed
      for (const story of stories) {
        await expect(page.locator('[data-testid="estimated-stories"]')).toContainText(story.title);
        await expect(page.locator('[data-testid="estimated-stories"]')).toContainText(story.estimate.toString());
      }
      
      // Verify statistics
      await expect(page.locator('[data-testid="total-story-points"]')).toContainText('16');
      await expect(page.locator('[data-testid="average-estimate"]')).toContainText('5.3');
      await expect(page.locator('[data-testid="stories-estimated"]')).toContainText('3');
    });

    // Step 4: View vote history for a story
    await test.step('View vote history', async () => {
      await page.click(`[data-testid="story-${stories[0].title}"] button:has-text("View Details")`);
      
      // Verify vote details
      await expect(page.locator('[data-testid="vote-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="vote-history"]')).toContainText('Round 1');
      await expect(page.locator('[data-testid="vote-history"]')).toContainText(stories[0].estimate.toString());
      
      // Verify participant votes
      await expect(page.locator('[data-testid="vote-history"]')).toContainText('test-host');
    });
  });

  test('should export session data in multiple formats', async ({ page }) => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();
    const stories = [
      { title: 'Export Story 1', estimate: 5 },
      { title: 'Export Story 2', estimate: 8 },
    ];

    // Create and complete session
    await test.step('Setup session with data', async () => {
      await page.goto('/projects');
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', projectName);
      await page.click('button[type="submit"]:has-text("Create Project")');
      
      await page.click(`text=${projectName}`);
      await page.click('button:has-text("New Session")');
      await page.fill('input[name="sessionName"]', sessionName);
      await page.click('button[type="submit"]:has-text("Create Session")');
      
      for (const story of stories) {
        await page.click('button:has-text("Add Story")');
        await page.fill('input[name="title"]', story.title);
        await page.fill('textarea[name="description"]', `Description for ${story.title}`);
        await page.click('button[type="submit"]:has-text("Add")');
        
        await page.click(`[data-testid="story-${story.title}"] button:has-text("Estimate")`);
        await page.click(`[data-testid="poker-card-${story.estimate}"]`);
        await page.click('button:has-text("Reveal Estimates")');
        await page.click('button:has-text("Finalize Estimate")');
        await page.fill('input[name="finalEstimate"]', story.estimate.toString());
        await page.click('button[type="submit"]:has-text("Finalize")');
        await page.waitForTimeout(500);
      }
      
      await page.click('button:has-text("End Session")');
      await page.click('button:has-text("Confirm")');
    });

    // Export as JSON
    await test.step('Export session as JSON', async () => {
      await page.goto('/history');
      await page.click(`[data-testid="session-${sessionName}"]`);
      
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export JSON")');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('.json');
      expect(download.suggestedFilename()).toContain(sessionName.replace(/\s+/g, '-'));
      
      // Save and verify content
      const path = await download.path();
      expect(path).toBeTruthy();
      
      // Read and parse JSON
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const data = JSON.parse(content);
      
      // Verify JSON structure
      expect(data.sessionName).toBe(sessionName);
      expect(data.projectName).toBe(projectName);
      expect(data.stories).toHaveLength(2);
      expect(data.totalStoryPoints).toBe(13);
      
      // Verify story data
      expect(data.stories[0].title).toBe(stories[0].title);
      expect(data.stories[0].finalEstimate).toBe(stories[0].estimate);
    });

    // Export as CSV
    await test.step('Export session as CSV', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export CSV")');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('.csv');
      
      // Save and verify content
      const path = await download.path();
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      
      // Verify CSV headers
      expect(content).toContain('Story Title');
      expect(content).toContain('Description');
      expect(content).toContain('Final Estimate');
      expect(content).toContain('Estimated At');
      
      // Verify CSV data
      expect(content).toContain(stories[0].title);
      expect(content).toContain(stories[0].estimate.toString());
      expect(content).toContain(stories[1].title);
      expect(content).toContain(stories[1].estimate.toString());
    });
  });

  test('should filter and search session history', async ({ page }) => {
    const projectName = generateProjectName();
    const sessions = [
      { name: 'Sprint 1 Planning', stories: 5 },
      { name: 'Sprint 2 Planning', stories: 3 },
      { name: 'Backlog Refinement', stories: 8 },
    ];

    // Create multiple sessions
    await test.step('Create multiple sessions', async () => {
      await page.goto('/projects');
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', projectName);
      await page.click('button[type="submit"]:has-text("Create Project")');
      
      await page.click(`text=${projectName}`);
      
      for (const session of sessions) {
        await page.click('button:has-text("New Session")');
        await page.fill('input[name="sessionName"]', session.name);
        await page.click('button[type="submit"]:has-text("Create Session")');
        
        // Add stories and end session
        for (let i = 0; i < session.stories; i++) {
          await page.click('button:has-text("Add Story")');
          await page.fill('input[name="title"]', `Story ${i + 1}`);
          await page.fill('textarea[name="description"]', 'Test story');
          await page.click('button[type="submit"]:has-text("Add")');
        }
        
        await page.click('button:has-text("End Session")');
        await page.click('button:has-text("Confirm")');
        await page.goto(`/projects/${projectName}`);
      }
    });

    // Test search functionality
    await test.step('Search sessions', async () => {
      await page.goto('/history');
      
      // Search by name
      await page.fill('input[placeholder="Search sessions"]', 'Sprint');
      
      // Verify filtered results
      await expect(page.locator('text=Sprint 1 Planning')).toBeVisible();
      await expect(page.locator('text=Sprint 2 Planning')).toBeVisible();
      await expect(page.locator('text=Backlog Refinement')).not.toBeVisible();
    });

    // Test date filtering
    await test.step('Filter by date range', async () => {
      await page.goto('/history');
      
      // Set date range to today
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[name="startDate"]', today);
      await page.fill('input[name="endDate"]', today);
      await page.click('button:has-text("Apply Filter")');
      
      // All sessions should be visible (created today)
      for (const session of sessions) {
        await expect(page.locator(`text=${session.name}`)).toBeVisible();
      }
    });

    // Test project filtering
    await test.step('Filter by project', async () => {
      await page.selectOption('select[name="projectFilter"]', projectName);
      
      // All sessions from this project should be visible
      for (const session of sessions) {
        await expect(page.locator(`text=${session.name}`)).toBeVisible();
      }
    });

    // Test sorting
    await test.step('Sort sessions', async () => {
      await page.selectOption('select[name="sortBy"]', 'date-desc');
      
      // Verify most recent session is first
      const firstSession = await page.locator('[data-testid="session-card"]').first();
      await expect(firstSession).toContainText(sessions[sessions.length - 1].name);
    });
  });

  test('should display velocity trends and analytics', async ({ page }) => {
    const projectName = generateProjectName();

    // Create project with multiple completed sessions
    await test.step('Setup project with historical data', async () => {
      await page.goto('/projects');
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', projectName);
      await page.click('button[type="submit"]:has-text("Create Project")');
      
      // Create 3 sessions with different story points
      const sessionData = [
        { name: 'Sprint 1', points: 21 },
        { name: 'Sprint 2', points: 26 },
        { name: 'Sprint 3', points: 24 },
      ];
      
      // This would require creating full sessions - simplified for demo
      // In real test, you would create and complete each session
    });

    // View analytics
    await test.step('View project analytics', async () => {
      await page.goto(`/projects/${projectName}/analytics`);
      
      // Verify velocity chart is displayed
      await expect(page.locator('[data-testid="velocity-chart"]')).toBeVisible();
      
      // Verify average velocity
      await expect(page.locator('[data-testid="average-velocity"]')).toContainText('23.7');
      
      // Verify trend indicator
      await expect(page.locator('[data-testid="velocity-trend"]')).toBeVisible();
    });

    // View estimation accuracy
    await test.step('View estimation accuracy metrics', async () => {
      // Verify estimation distribution chart
      await expect(page.locator('[data-testid="estimation-distribution"]')).toBeVisible();
      
      // Verify most common estimates
      await expect(page.locator('[data-testid="common-estimates"]')).toContainText('5');
      await expect(page.locator('[data-testid="common-estimates"]')).toContainText('8');
    });
  });
});

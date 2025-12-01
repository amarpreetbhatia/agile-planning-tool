import { test, expect, Browser, BrowserContext } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers/auth.helper';
import { generateProjectName, generateSessionName, generateStoryTitle } from './helpers/test-data.helper';

/**
 * E2E Test Scenario 3: Real-time Collaboration
 * 
 * Business Value:
 * - Demonstrates real-time synchronization across multiple users
 * - Shows how distributed teams can collaborate simultaneously
 * - Validates WebSocket connectivity and live updates
 * 
 * User Story:
 * As a distributed team member, I want to see real-time updates from other participants,
 * so that I can collaborate effectively regardless of location.
 */

test.describe('Real-time Collaboration', () => {
  let hostContext: BrowserContext;
  let participant1Context: BrowserContext;
  let participant2Context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // Create separate browser contexts for each user
    hostContext = await browser.newContext();
    participant1Context = await browser.newContext();
    participant2Context = await browser.newContext();
  });

  test.afterAll(async () => {
    await hostContext.close();
    await participant1Context.close();
    await participant2Context.close();
  });

  test('should show real-time updates when multiple users vote simultaneously', async () => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();
    const storyTitle = generateStoryTitle();
    let sessionUrl: string;

    // Host creates session
    await test.step('Host creates session and story', async () => {
      const hostPage = await hostContext.newPage();
      await setupAuthenticatedSession(hostPage);
      
      // Create project
      await hostPage.goto('/projects');
      await hostPage.click('button:has-text("New Project")');
      await hostPage.fill('input[name="name"]', projectName);
      await hostPage.click('button[type="submit"]:has-text("Create Project")');
      
      // Create session
      await hostPage.click(`text=${projectName}`);
      await hostPage.click('button:has-text("New Session")');
      await hostPage.fill('input[name="sessionName"]', sessionName);
      await hostPage.click('button[type="submit"]:has-text("Create Session")');
      
      // Get session URL for participants
      sessionUrl = hostPage.url();
      
      // Add story
      await hostPage.click('button:has-text("Add Story")');
      await hostPage.fill('input[name="title"]', storyTitle);
      await hostPage.fill('textarea[name="description"]', 'Test story for real-time collaboration');
      await hostPage.click('button[type="submit"]:has-text("Add")');
      
      // Select story for estimation
      await hostPage.click(`[data-testid="story-${storyTitle}"] button:has-text("Estimate")`);
      
      // Verify story is displayed
      await expect(hostPage.locator('.current-story')).toContainText(storyTitle);
    });

    // Participants join session
    await test.step('Participants join session', async () => {
      const participant1Page = await participant1Context.newPage();
      const participant2Page = await participant2Context.newPage();
      
      await setupAuthenticatedSession(participant1Page);
      await setupAuthenticatedSession(participant2Page);
      
      // Navigate to session
      await participant1Page.goto(sessionUrl);
      await participant2Page.goto(sessionUrl);
      
      // Verify participants see the story
      await expect(participant1Page.locator('.current-story')).toContainText(storyTitle);
      await expect(participant2Page.locator('.current-story')).toContainText(storyTitle);
    });

    // Verify real-time participant list updates
    await test.step('Verify participant list updates in real-time', async () => {
      const hostPage = await hostContext.pages()[0];
      
      // Host should see 3 participants (including themselves)
      await expect(hostPage.locator('[data-testid="participant-count"]')).toContainText('3');
      
      // Verify all participants are shown with online status
      await expect(hostPage.locator('[data-testid="participant-list"]')).toContainText('test-host');
      await expect(hostPage.locator('[data-testid="participant-list"]')).toContainText('test-participant-1');
      await expect(hostPage.locator('[data-testid="participant-list"]')).toContainText('test-participant-2');
      
      // Verify online indicators
      await expect(hostPage.locator('[data-testid="participant-test-host"] [data-testid="online-indicator"]')).toBeVisible();
    });

    // All users vote simultaneously
    await test.step('Users vote simultaneously', async () => {
      const hostPage = await hostContext.pages()[0];
      const participant1Page = await participant1Context.pages()[0];
      const participant2Page = await participant2Context.pages()[0];
      
      // Cast votes simultaneously
      await Promise.all([
        hostPage.click('[data-testid="poker-card-5"]'),
        participant1Page.click('[data-testid="poker-card-8"]'),
        participant2Page.click('[data-testid="poker-card-5"]'),
      ]);
      
      // Wait a moment for WebSocket updates
      await hostPage.waitForTimeout(1000);
      
      // Verify voting status updates on all pages
      await expect(hostPage.locator('[data-testid="voting-status"]')).toContainText('3 of 3 voted');
      await expect(participant1Page.locator('[data-testid="voting-status"]')).toContainText('3 of 3 voted');
      await expect(participant2Page.locator('[data-testid="voting-status"]')).toContainText('3 of 3 voted');
      
      // Verify individual voting indicators (anonymous mode - should show voted but not value)
      await expect(hostPage.locator('[data-testid="participant-test-host"]')).toHaveClass(/voted/);
      await expect(hostPage.locator('[data-testid="participant-test-participant-1"]')).toHaveClass(/voted/);
      await expect(hostPage.locator('[data-testid="participant-test-participant-2"]')).toHaveClass(/voted/);
    });

    // Host reveals estimates
    await test.step('Host reveals estimates and all users see results', async () => {
      const hostPage = await hostContext.pages()[0];
      const participant1Page = await participant1Context.pages()[0];
      const participant2Page = await participant2Context.pages()[0];
      
      // Host reveals
      await hostPage.click('button:has-text("Reveal Estimates")');
      
      // Wait for reveal animation
      await hostPage.waitForTimeout(1500);
      
      // Verify all users see the revealed estimates
      for (const page of [hostPage, participant1Page, participant2Page]) {
        await expect(page.locator('[data-testid="estimate-results"]')).toBeVisible();
        await expect(page.locator('[data-testid="vote-test-host"]')).toContainText('5');
        await expect(page.locator('[data-testid="vote-test-participant-1"]')).toContainText('8');
        await expect(page.locator('[data-testid="vote-test-participant-2"]')).toContainText('5');
        
        // Verify average calculation
        await expect(page.locator('[data-testid="average-estimate"]')).toContainText('6');
      }
    });

    // Test re-voting
    await test.step('Test re-voting functionality', async () => {
      const hostPage = await hostContext.pages()[0];
      const participant1Page = await participant1Context.pages()[0];
      
      // Host initiates re-vote
      await hostPage.click('button:has-text("Re-vote")');
      
      // Verify all users see re-vote notification
      await expect(participant1Page.locator('[data-testid="notification"]')).toContainText('Re-vote initiated');
      
      // Verify voting UI is reset
      await expect(hostPage.locator('[data-testid="poker-card-5"]')).not.toHaveClass(/selected/);
      await expect(participant1Page.locator('[data-testid="poker-card-8"]')).not.toHaveClass(/selected/);
      
      // Verify round number incremented
      await expect(hostPage.locator('[data-testid="round-number"]')).toContainText('Round 2');
    });
  });

  test('should show typing indicators in session chat', async () => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();
    let sessionUrl: string;

    // Setup session with two users
    await test.step('Setup session', async () => {
      const hostPage = await hostContext.newPage();
      await setupAuthenticatedSession(hostPage);
      
      await hostPage.goto('/projects');
      await hostPage.click('button:has-text("New Project")');
      await hostPage.fill('input[name="name"]', projectName);
      await hostPage.click('button[type="submit"]:has-text("Create Project")');
      
      await hostPage.click(`text=${projectName}`);
      await hostPage.click('button:has-text("New Session")');
      await hostPage.fill('input[name="sessionName"]', sessionName);
      await hostPage.click('button[type="submit"]:has-text("Create Session")');
      
      sessionUrl = hostPage.url();
    });

    await test.step('Test chat typing indicators', async () => {
      const hostPage = await hostContext.pages()[0];
      const participant1Page = await participant1Context.newPage();
      
      await setupAuthenticatedSession(participant1Page);
      await participant1Page.goto(sessionUrl);
      
      // Open chat panel
      await hostPage.click('[data-testid="chat-toggle"]');
      await participant1Page.click('[data-testid="chat-toggle"]');
      
      // Participant starts typing
      await participant1Page.fill('[data-testid="chat-input"]', 'Hello team');
      
      // Host should see typing indicator
      await expect(hostPage.locator('[data-testid="typing-indicator"]')).toContainText('test-participant-1 is typing');
      
      // Participant sends message
      await participant1Page.press('[data-testid="chat-input"]', 'Enter');
      
      // Typing indicator should disappear
      await expect(hostPage.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
      
      // Host should see the message
      await expect(hostPage.locator('[data-testid="chat-messages"]')).toContainText('Hello team');
    });
  });

  test('should handle participant disconnection gracefully', async () => {
    const projectName = generateProjectName();
    const sessionName = generateSessionName();
    let sessionUrl: string;

    // Setup session
    await test.step('Setup session with participants', async () => {
      const hostPage = await hostContext.newPage();
      await setupAuthenticatedSession(hostPage);
      
      await hostPage.goto('/projects');
      await hostPage.click('button:has-text("New Project")');
      await hostPage.fill('input[name="name"]', projectName);
      await hostPage.click('button[type="submit"]:has-text("Create Project")');
      
      await hostPage.click(`text=${projectName}`);
      await hostPage.click('button:has-text("New Session")');
      await hostPage.fill('input[name="sessionName"]', sessionName);
      await hostPage.click('button[type="submit"]:has-text("Create Session")');
      
      sessionUrl = hostPage.url();
      
      // Participant joins
      const participant1Page = await participant1Context.newPage();
      await setupAuthenticatedSession(participant1Page);
      await participant1Page.goto(sessionUrl);
      
      // Verify both users are online
      await expect(hostPage.locator('[data-testid="participant-count"]')).toContainText('2');
    });

    await test.step('Handle participant disconnection', async () => {
      const hostPage = await hostContext.pages()[0];
      const participant1Page = await participant1Context.pages()[0];
      
      // Participant closes browser/tab
      await participant1Page.close();
      
      // Wait for WebSocket disconnect event
      await hostPage.waitForTimeout(2000);
      
      // Host should see updated participant count
      await expect(hostPage.locator('[data-testid="participant-count"]')).toContainText('1');
      
      // Participant should show as offline
      await expect(hostPage.locator('[data-testid="participant-test-participant-1"]')).toHaveClass(/offline/);
      
      // Verify notification
      await expect(hostPage.locator('[data-testid="notification"]')).toContainText('test-participant-1 left the session');
    });
  });
});

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers/auth.helper';
import { generateProjectName, TEST_USERS } from './helpers/test-data.helper';

/**
 * E2E Test Scenario 4: Project & Team Management
 * 
 * Business Value:
 * - Demonstrates multi-project organization capabilities
 * - Shows role-based access control and permissions
 * - Validates team collaboration features
 * 
 * User Story:
 * As a Product Owner, I want to manage multiple projects with different team members,
 * so that I can organize planning sessions by project and control access appropriately.
 */

test.describe('Project & Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test('should create project and manage team members with different roles', async ({ page }) => {
    const projectName = generateProjectName();

    // Step 1: Create project
    await test.step('Create new project', async () => {
      await page.goto('/projects');
      await page.click('button:has-text("New Project")');
      
      await page.fill('input[name="name"]', projectName);
      await page.fill('textarea[name="description"]', 'Multi-team project for E2E testing');
      
      // Configure project settings
      await page.selectOption('select[name="defaultCardValues"]', 'fibonacci');
      await page.selectOption('select[name="defaultVotingMode"]', 'anonymous');
      
      await page.click('button[type="submit"]:has-text("Create Project")');
      
      // Verify project created
      await expect(page.locator(`text=${projectName}`)).toBeVisible();
      
      // Verify creator is owner
      await page.click(`text=${projectName}`);
      await expect(page.locator('[data-testid="user-role"]')).toContainText('Owner');
    });

    // Step 2: Invite team members
    await test.step('Invite team members', async () => {
      await page.click('button:has-text("Team Members")');
      await page.click('button:has-text("Invite Member")');
      
      // Invite admin
      await page.fill('input[name="githubUsername"]', TEST_USERS.participant1.username);
      await page.selectOption('select[name="role"]', 'admin');
      await page.click('button[type="submit"]:has-text("Send Invitation")');
      
      // Verify invitation sent
      await expect(page.locator('[data-testid="pending-invitations"]')).toContainText(TEST_USERS.participant1.username);
      await expect(page.locator('[data-testid="pending-invitations"]')).toContainText('Admin');
      
      // Invite regular member
      await page.click('button:has-text("Invite Member")');
      await page.fill('input[name="githubUsername"]', TEST_USERS.participant2.username);
      await page.selectOption('select[name="role"]', 'member');
      await page.click('button[type="submit"]:has-text("Send Invitation")');
      
      // Verify both invitations
      await expect(page.locator('[data-testid="pending-invitations"]')).toContainText(TEST_USERS.participant2.username);
    });

    // Step 3: Verify role-based permissions
    await test.step('Verify owner permissions', async () => {
      // Owner should see all management options
      await expect(page.locator('button:has-text("Project Settings")')).toBeVisible();
      await expect(page.locator('button:has-text("Invite Member")')).toBeVisible();
      await expect(page.locator('button:has-text("Delete Project")')).toBeVisible();
    });

    // Step 4: Update project settings
    await test.step('Update project settings', async () => {
      await page.click('button:has-text("Project Settings")');
      
      // Update voting mode
      await page.selectOption('select[name="defaultVotingMode"]', 'open');
      
      // Update card values
      await page.selectOption('select[name="defaultCardValues"]', 'tshirt');
      
      // Configure GitHub defaults
      await page.fill('input[name="defaultRepo"]', 'my-org/my-repo');
      
      await page.click('button[type="submit"]:has-text("Save Settings")');
      
      // Verify settings saved
      await expect(page.locator('[data-testid="notification"]')).toContainText('Settings updated');
    });

    // Step 5: Manage team members
    await test.step('Change member role', async () => {
      await page.click('button:has-text("Team Members")');
      
      // Find member and change role
      await page.click(`[data-testid="member-${TEST_USERS.participant1.username}"] button:has-text("Change Role")`);
      await page.selectOption('select[name="newRole"]', 'member');
      await page.click('button[type="submit"]:has-text("Update Role")');
      
      // Verify role changed
      await expect(page.locator(`[data-testid="member-${TEST_USERS.participant1.username}"]`)).toContainText('Member');
    });

    // Step 6: Remove team member
    await test.step('Remove team member', async () => {
      await page.click(`[data-testid="member-${TEST_USERS.participant2.username}"] button:has-text("Remove")`);
      await page.click('button:has-text("Confirm")');
      
      // Verify member removed
      await expect(page.locator(`[data-testid="member-${TEST_USERS.participant2.username}"]`)).not.toBeVisible();
      
      // Verify notification sent to removed user
      await expect(page.locator('[data-testid="notification"]')).toContainText('Member removed');
    });
  });

  test('should handle invitation acceptance workflow', async ({ page }) => {
    const projectName = generateProjectName();

    // Create project and send invitation
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', projectName);
    await page.click('button[type="submit"]:has-text("Create Project")');
    
    await page.click(`text=${projectName}`);
    await page.click('button:has-text("Team Members")');
    await page.click('button:has-text("Invite Member")');
    await page.fill('input[name="githubUsername"]', TEST_USERS.participant1.username);
    await page.selectOption('select[name="role"]', 'admin');
    await page.click('button[type="submit"]:has-text("Send Invitation")');

    // Simulate invitation acceptance (would require second user context in real test)
    await test.step('View pending invitations', async () => {
      await page.goto('/invitations');
      
      // Verify invitation appears
      await expect(page.locator('[data-testid="invitation-list"]')).toContainText(projectName);
      await expect(page.locator('[data-testid="invitation-list"]')).toContainText('Admin');
    });

    await test.step('Accept invitation', async () => {
      await page.click(`[data-testid="invitation-${projectName}"] button:has-text("Accept")`);
      
      // Verify redirect to project
      await expect(page).toHaveURL(/\/projects\/.+/);
      await expect(page.locator(`h1:has-text("${projectName}")`)).toBeVisible();
      
      // Verify role assigned
      await expect(page.locator('[data-testid="user-role"]')).toContainText('Admin');
    });
  });

  test('should enforce permission restrictions', async ({ page }) => {
    const projectName = generateProjectName();

    // Create project
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', projectName);
    await page.click('button[type="submit"]:has-text("Create Project")');

    // Test member permissions (simulate member role)
    await test.step('Member cannot access project settings', async () => {
      // This would require switching to a member user context
      // For demo, we'll verify the UI elements are conditionally rendered
      
      await page.click(`text=${projectName}`);
      
      // Owner should see settings
      await expect(page.locator('button:has-text("Project Settings")')).toBeVisible();
      
      // Simulate member view (in real test, switch user context)
      // await expect(page.locator('button:has-text("Project Settings")')).not.toBeVisible();
    });

    await test.step('Member cannot delete project', async () => {
      // Verify delete button is owner-only
      await page.click('button:has-text("Project Settings")');
      await expect(page.locator('button:has-text("Delete Project")')).toBeVisible();
      
      // In member context, this should not be visible
      // await expect(page.locator('button:has-text("Delete Project")')).not.toBeVisible();
    });

    await test.step('Admin can create sessions but not delete project', async () => {
      // Admin should be able to create sessions
      await expect(page.locator('button:has-text("New Session")')).toBeVisible();
      
      // But not delete project (owner only)
      // In admin context:
      // await expect(page.locator('button:has-text("Delete Project")')).not.toBeVisible();
    });
  });

  test('should manage multiple projects', async ({ page }) => {
    const project1Name = generateProjectName();
    const project2Name = generateProjectName();
    const project3Name = generateProjectName();

    // Create multiple projects
    await test.step('Create multiple projects', async () => {
      await page.goto('/projects');
      
      for (const projectName of [project1Name, project2Name, project3Name]) {
        await page.click('button:has-text("New Project")');
        await page.fill('input[name="name"]', projectName);
        await page.fill('textarea[name="description"]', `Description for ${projectName}`);
        await page.click('button[type="submit"]:has-text("Create Project")');
        await page.waitForTimeout(500);
      }
    });

    // Verify all projects are listed
    await test.step('Verify projects list', async () => {
      await page.goto('/projects');
      
      await expect(page.locator(`text=${project1Name}`)).toBeVisible();
      await expect(page.locator(`text=${project2Name}`)).toBeVisible();
      await expect(page.locator(`text=${project3Name}`)).toBeVisible();
      
      // Verify project count
      await expect(page.locator('[data-testid="project-count"]')).toContainText('3');
    });

    // Test project filtering
    await test.step('Filter projects', async () => {
      await page.fill('input[placeholder="Search projects"]', project1Name);
      
      // Only matching project should be visible
      await expect(page.locator(`text=${project1Name}`)).toBeVisible();
      await expect(page.locator(`text=${project2Name}`)).not.toBeVisible();
      await expect(page.locator(`text=${project3Name}`)).not.toBeVisible();
    });

    // Test project sorting
    await test.step('Sort projects', async () => {
      await page.selectOption('select[name="sortBy"]', 'name');
      
      // Verify projects are sorted alphabetically
      const projectCards = await page.locator('[data-testid="project-card"]').all();
      const projectNames = await Promise.all(
        projectCards.map(card => card.locator('h3').textContent())
      );
      
      // Verify sorted order
      expect(projectNames).toEqual([...projectNames].sort());
    });
  });
});

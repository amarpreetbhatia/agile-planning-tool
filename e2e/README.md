# End-to-End Tests for Agile Planning Tool

## Overview

This directory contains comprehensive end-to-end tests using Playwright that demonstrate the key business features of the Agile Planning Tool. These tests are designed to showcase functionality to business stakeholders and product owners.

## Test Scenarios

### 1. Complete Estimation Session Flow (`01-complete-estimation-session.spec.ts`)
**Business Value**: Demonstrates the core planning poker functionality

**What it tests**:
- Creating a project and estimation session
- Adding stories manually
- Selecting stories for estimation
- Casting votes with poker cards
- Revealing estimates with statistics
- Finalizing estimates with consensus
- Ending sessions and viewing history
- Handling multiple stories in sequence

**Key Features Demonstrated**:
- Full user journey from start to finish
- Fibonacci sequence voting
- Real-time voting status
- Confetti celebration on finalization
- Session history tracking

---

### 2. GitHub Integration Workflow (`02-github-integration.spec.ts`)
**Business Value**: Shows seamless integration with existing GitHub workflows

**What it tests**:
- Connecting to GitHub repositories
- Importing issues from GitHub
- Importing from GitHub Projects V2
- Estimating GitHub issues
- Syncing estimates back to GitHub
- Handling GitHub API errors gracefully

**Key Features Demonstrated**:
- Zero data entry for existing GitHub issues
- Bi-directional sync with GitHub
- GitHub Projects V2 support
- Error handling and retry logic

---

### 3. Real-time Collaboration (`03-real-time-collaboration.spec.ts`)
**Business Value**: Demonstrates distributed team collaboration capabilities

**What it tests**:
- Multiple users joining the same session
- Real-time participant list updates
- Simultaneous voting by multiple users
- Live voting status indicators
- Estimate reveal synchronization
- Re-voting functionality
- Chat typing indicators
- Handling participant disconnections

**Key Features Demonstrated**:
- WebSocket real-time updates
- Multi-user collaboration
- Online/offline status
- Session chat
- Graceful disconnection handling

---

### 4. Project & Team Management (`04-project-team-management.spec.ts`)
**Business Value**: Shows multi-project organization and access control

**What it tests**:
- Creating and configuring projects
- Inviting team members
- Role-based access control (Owner, Admin, Member)
- Managing team member roles
- Removing team members
- Invitation acceptance workflow
- Permission enforcement
- Managing multiple projects
- Project filtering and sorting

**Key Features Demonstrated**:
- Multi-project support
- Three-tier role system
- Team collaboration
- Project settings management
- Access control

---

### 5. Session History & Export (`05-session-history-export.spec.ts`)
**Business Value**: Demonstrates reporting and analytics capabilities

**What it tests**:
- Viewing session history
- Detailed session summaries
- Vote history for stories
- Exporting data as JSON
- Exporting data as CSV
- Filtering and searching history
- Date range filtering
- Project-based filtering
- Velocity trends and analytics
- Estimation accuracy metrics

**Key Features Demonstrated**:
- Historical data tracking
- Data export for analysis
- Search and filter capabilities
- Analytics and reporting
- Velocity tracking

## Running the Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Ensure your development server is configured (tests will start it automatically)

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
# Run only estimation session tests
npx playwright test 01-complete-estimation-session

# Run only GitHub integration tests
npx playwright test 02-github-integration

# Run only real-time collaboration tests
npx playwright test 03-real-time-collaboration

# Run only project management tests
npx playwright test 04-project-team-management

# Run only history and export tests
npx playwright test 05-session-history-export
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- See all tests
- Run tests individually
- Watch tests execute in real-time
- Debug failing tests
- View screenshots and videos

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### Run Tests in Specific Browser

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

### Generate Test Report

```bash
npx playwright show-report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries on CI, 0 locally
- **Timeout**: 30 seconds per test
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

## Test Data

Test data helpers are in `e2e/helpers/test-data.helper.ts`:

- Project names with timestamps
- Session names with timestamps
- Story titles and descriptions
- Fibonacci values
- Test user data
- Mock GitHub repository data

## Authentication

Authentication helpers are in `e2e/helpers/auth.helper.ts`:

- `setupAuthenticatedSession()` - Sets up authenticated user
- `loginWithGitHub()` - Simulates GitHub OAuth login
- `logout()` - Logs out current user

**Note**: In a production test environment, you would:
1. Use real GitHub OAuth test credentials
2. Or mock the OAuth flow
3. Or use pre-configured test sessions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### Writing Tests

1. **Use test.step()** for clear test organization
2. **Add descriptive test names** that explain business value
3. **Use data-testid attributes** for reliable selectors
4. **Wait for elements** before interacting
5. **Verify outcomes** with expect assertions
6. **Clean up after tests** (sessions, projects, etc.)

### Debugging Tests

1. **Use --debug flag** to step through tests
2. **Add page.pause()** to stop execution
3. **Check screenshots** in test-results folder
4. **Watch videos** of failed tests
5. **Use trace viewer** for detailed debugging

### Performance

1. **Reuse authentication** across tests
2. **Run tests in parallel** when possible
3. **Use beforeAll** for expensive setup
4. **Clean up test data** to avoid database bloat

## Demo Mode

For product demonstrations:

```bash
# Run tests with headed browser (visible)
npx playwright test --headed

# Run specific test for demo
npx playwright test 01-complete-estimation-session --headed --project=chromium

# Slow down execution for visibility
npx playwright test --headed --slow-mo=1000
```

## Troubleshooting

### Tests Failing Locally

1. Ensure dev server is running: `npm run dev`
2. Check database connection
3. Verify environment variables
4. Clear browser cache: `npx playwright clean`

### Flaky Tests

1. Increase timeouts if needed
2. Add explicit waits for animations
3. Check for race conditions
4. Verify WebSocket connections

### Authentication Issues

1. Check GitHub OAuth configuration
2. Verify test user credentials
3. Check session storage
4. Review auth helper implementation

## Reporting

Test reports are generated in:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots, videos, traces
- `test-results/results.json` - JSON report for CI

## Future Enhancements

Potential additions:
- Visual regression testing
- Performance testing
- Accessibility testing (a11y)
- API testing
- Load testing
- Cross-browser compatibility matrix
- Mobile device testing
- Internationalization testing

## Support

For questions or issues:
- Check Playwright docs: https://playwright.dev
- Review test examples in this directory
- Check test output and reports
- Enable debug mode for detailed logs

---

**Last Updated**: December 2024  
**Playwright Version**: Latest  
**Test Coverage**: 5 major business scenarios

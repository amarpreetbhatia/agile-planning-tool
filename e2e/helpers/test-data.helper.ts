/**
 * Test data generators and helpers
 */

export function generateProjectName(): string {
  return `Test Project ${Date.now()}`;
}

export function generateSessionName(): string {
  return `Planning Session ${Date.now()}`;
}

export function generateStoryTitle(): string {
  return `User Story ${Date.now()}`;
}

export function generateStoryDescription(): string {
  return `As a user, I want to test feature ${Date.now()}, so that I can verify functionality`;
}

export const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 21];

export function getRandomFibonacciValue(): number {
  return FIBONACCI_VALUES[Math.floor(Math.random() * FIBONACCI_VALUES.length)];
}

export const TEST_USERS = {
  host: {
    username: 'test-host',
    email: 'host@example.com',
  },
  participant1: {
    username: 'test-participant-1',
    email: 'participant1@example.com',
  },
  participant2: {
    username: 'test-participant-2',
    email: 'participant2@example.com',
  },
};

export const TEST_GITHUB_REPO = {
  owner: 'test-org',
  repo: 'test-repo',
  issues: [
    {
      number: 1,
      title: 'Implement user authentication',
      description: 'Add GitHub OAuth authentication',
    },
    {
      number: 2,
      title: 'Create dashboard UI',
      description: 'Build responsive dashboard with project cards',
    },
  ],
};

/**
 * Example usage of the GitHub Service
 * 
 * This file demonstrates how to use the GitHub integration service
 * in your API routes and server components.
 */

import { createGitHubService, validateGitHubToken } from './github';

// Example 1: Validate a GitHub token
async function exampleValidateToken(accessToken: string) {
  try {
    const isValid = await validateGitHubToken(accessToken);
    console.log('Token is valid:', isValid);
  } catch (error) {
    console.error('Token validation failed:', error);
  }
}

// Example 2: Fetch user's repositories
async function exampleGetRepositories(accessToken: string) {
  try {
    const github = createGitHubService(accessToken);
    
    const repos = await github.getRepositories({
      sort: 'updated',
      direction: 'desc',
      perPage: 10,
    });
    
    console.log('Repositories:', repos);
    return repos;
  } catch (error) {
    console.error('Failed to fetch repositories:', error);
    throw error;
  }
}

// Example 3: Fetch issues from a repository
async function exampleGetIssues(accessToken: string, owner: string, repo: string) {
  try {
    const github = createGitHubService(accessToken);
    
    const issues = await github.getIssues(owner, repo, {
      state: 'open',
      labels: ['bug', 'enhancement'],
      perPage: 20,
    });
    
    console.log('Issues:', issues);
    return issues;
  } catch (error) {
    console.error('Failed to fetch issues:', error);
    throw error;
  }
}

// Example 4: Fetch GitHub Projects
async function exampleGetProjects(accessToken: string, owner: string) {
  try {
    const github = createGitHubService(accessToken);
    
    const projects = await github.getProjects(owner, {
      perPage: 10,
    });
    
    console.log('Projects:', projects);
    return projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
}

// Example 5: Fetch project items
async function exampleGetProjectItems(accessToken: string, projectId: string) {
  try {
    const github = createGitHubService(accessToken);
    
    const items = await github.getProjectItems(projectId, {
      first: 50,
    });
    
    console.log('Project items:', items);
    return items;
  } catch (error) {
    console.error('Failed to fetch project items:', error);
    throw error;
  }
}

// Example 6: Update issue with estimate
async function exampleUpdateIssueEstimate(
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number,
  estimate: number
) {
  try {
    const github = createGitHubService(accessToken);
    
    await github.updateIssueEstimate(owner, repo, issueNumber, estimate, {
      addComment: true,
      addLabel: true,
    });
    
    console.log('Issue updated with estimate:', estimate);
  } catch (error) {
    console.error('Failed to update issue:', error);
    throw error;
  }
}

// Example 7: Check rate limit
async function exampleCheckRateLimit(accessToken: string) {
  try {
    const github = createGitHubService(accessToken);
    
    const rateLimit = await github.getRateLimit();
    console.log('Rate limit info:', rateLimit);
    console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
    console.log(`Resets at: ${rateLimit.reset}`);
    
    return rateLimit;
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    throw error;
  }
}

// Example 8: Error handling
async function exampleErrorHandling(accessToken: string) {
  try {
    const github = createGitHubService(accessToken);
    
    // This will throw an error if the repo doesn't exist
    await github.getIssues('nonexistent', 'repo');
  } catch (error: any) {
    if (error.name === 'GitHubAPIError') {
      console.error('GitHub API Error:', error.message);
      console.error('Status Code:', error.statusCode);
    } else if (error.name === 'GitHubTokenInvalidError') {
      console.error('Invalid token:', error.message);
      // Redirect user to re-authenticate
    } else if (error.name === 'GitHubRateLimitError') {
      console.error('Rate limit exceeded:', error.message);
      console.error('Resets at:', error.resetAt);
      // Wait until reset time or show error to user
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 9: Usage in API route
export async function exampleAPIRoute(accessToken: string) {
  try {
    // Validate token first
    const isValid = await validateGitHubToken(accessToken);
    if (!isValid) {
      return {
        error: 'Invalid GitHub token',
        statusCode: 401,
      };
    }

    // Create service
    const github = createGitHubService(accessToken);

    // Check rate limit before making requests
    const rateLimit = await github.getRateLimit();
    if (rateLimit.remaining < 10) {
      return {
        error: 'GitHub API rate limit too low',
        statusCode: 429,
        resetAt: rateLimit.reset,
      };
    }

    // Fetch data
    const repos = await github.getRepositories({ perPage: 10 });

    return {
      success: true,
      data: repos,
      rateLimit: {
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
      },
    };
  } catch (error: any) {
    console.error('API route error:', error);
    return {
      error: error.message || 'Internal server error',
      statusCode: error.statusCode || 500,
    };
  }
}

// Example 10: Usage with session user
export async function exampleWithSessionUser(session: any) {
  // Get access token from session
  const accessToken = session.user.accessToken;
  
  if (!accessToken) {
    throw new Error('User not authenticated with GitHub');
  }

  // Create GitHub service
  const github = createGitHubService(accessToken);

  // Fetch user's repositories
  const repos = await github.getRepositories();

  return repos;
}

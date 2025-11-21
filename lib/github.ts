import { Octokit } from '@octokit/rest';

// GitHub API Error Types
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rateLimitRemaining?: number,
    public rateLimitReset?: Date
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export class GitHubTokenInvalidError extends Error {
  constructor(message: string = 'GitHub access token is invalid or expired') {
    super(message);
    this.name = 'GitHubTokenInvalidError';
  }
}

export class GitHubRateLimitError extends Error {
  constructor(
    message: string,
    public resetAt: Date,
    public limit: number,
    public remaining: number
  ) {
    super(message);
    this.name = 'GitHubRateLimitError';
  }
}

// GitHub Data Interfaces
export interface IRepository {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  private: boolean;
  url: string;
}

export interface IIssue {
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  state: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectItem {
  id: string;
  title: string;
  body: string | null;
  issueNumber?: number;
  status?: string;
}

export interface IGitHubProject {
  id: string;
  number: number;
  title: string;
  url: string;
}

export interface IRateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

/**
 * GitHub Service for interacting with GitHub API
 */
export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new GitHubTokenInvalidError('Access token is required');
    }

    this.octokit = new Octokit({
      auth: accessToken,
      userAgent: 'agile-planning-tool',
    });
  }

  /**
   * Validate the GitHub access token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        throw new GitHubTokenInvalidError();
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get rate limit information
   */
  async getRateLimit(): Promise<IRateLimitInfo> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000),
        used: data.rate.used,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch user's accessible repositories
   */
  async getRepositories(options?: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    perPage?: number;
    page?: number;
  }): Promise<IRepository[]> {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: options?.sort || 'updated',
        direction: options?.direction || 'desc',
        per_page: options?.perPage || 100,
        page: options?.page || 1,
      });

      return data.map((repo) => ({
        id: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
      }));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch issues from a specific repository
   */
  async getIssues(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      labels?: string[];
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      perPage?: number;
      page?: number;
    }
  ): Promise<IIssue[]> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: options?.state || 'open',
        labels: options?.labels?.join(','),
        sort: options?.sort || 'created',
        direction: options?.direction || 'desc',
        per_page: options?.perPage || 100,
        page: options?.page || 1,
      });

      return data
        .filter((issue) => !issue.pull_request) // Exclude pull requests
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          body: issue.body || null,
          labels: issue.labels.map((label) =>
            typeof label === 'string' ? label : label.name || ''
          ),
          state: issue.state,
          url: issue.html_url,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
        }));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific issue by number
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<IIssue> {
    try {
      const { data } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return {
        number: data.number,
        title: data.title,
        body: data.body || null,
        labels: data.labels.map((label) =>
          typeof label === 'string' ? label : label.name || ''
        ),
        state: data.state,
        url: data.html_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch GitHub Projects V2 for a repository or organization
   */
  async getProjects(owner: string, options?: { perPage?: number }): Promise<IGitHubProject[]> {
    try {
      // Use GraphQL API for Projects V2
      const query = `
        query($owner: String!, $first: Int!) {
          repositoryOwner(login: $owner) {
            ... on User {
              projectsV2(first: $first) {
                nodes {
                  id
                  number
                  title
                  url
                }
              }
            }
            ... on Organization {
              projectsV2(first: $first) {
                nodes {
                  id
                  number
                  title
                  url
                }
              }
            }
          }
        }
      `;

      const result: any = await this.octokit.graphql(query, {
        owner,
        first: options?.perPage || 20,
      });

      const projects = result.repositoryOwner?.projectsV2?.nodes || [];
      return projects.map((project: any) => ({
        id: project.id,
        number: project.number,
        title: project.title,
        url: project.url,
      }));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch items from a GitHub Project V2
   */
  async getProjectItems(projectId: string, options?: { first?: number }): Promise<IProjectItem[]> {
    try {
      const query = `
        query($projectId: ID!, $first: Int!) {
          node(id: $projectId) {
            ... on ProjectV2 {
              items(first: $first) {
                nodes {
                  id
                  content {
                    ... on Issue {
                      number
                      title
                      body
                      state
                    }
                  }
                  fieldValues(first: 10) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result: any = await this.octokit.graphql(query, {
        projectId,
        first: options?.first || 100,
      });

      const items = result.node?.items?.nodes || [];
      return items
        .filter((item: any) => item.content) // Only items with content
        .map((item: any) => {
          const content = item.content;
          // Extract status from field values
          const statusField = item.fieldValues?.nodes?.find(
            (node: any) => node.field?.name === 'Status'
          );

          return {
            id: item.id,
            title: content.title,
            body: content.body || null,
            issueNumber: content.number,
            status: statusField?.name || content.state,
          };
        });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an issue with an estimate
   * Adds the estimate as a comment and optionally as a label
   */
  async updateIssueEstimate(
    owner: string,
    repo: string,
    issueNumber: number,
    estimate: number,
    options?: {
      addComment?: boolean;
      addLabel?: boolean;
    }
  ): Promise<void> {
    try {
      const addComment = options?.addComment !== false; // Default true
      const addLabel = options?.addLabel || false;

      // Add comment with estimate
      if (addComment) {
        await this.octokit.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: `📊 **Estimation Result**: ${estimate} story points\n\n_Estimated via Agile Planning Tool_`,
        });
      }

      // Add label with estimate
      if (addLabel) {
        const labelName = `estimate: ${estimate}`;
        
        // Check if label exists, create if not
        try {
          await this.octokit.issues.getLabel({
            owner,
            repo,
            name: labelName,
          });
        } catch (error: any) {
          if (error.status === 404) {
            // Create label if it doesn't exist
            await this.octokit.issues.createLabel({
              owner,
              repo,
              name: labelName,
              color: '0366d6',
              description: 'Story point estimate',
            });
          }
        }

        // Add label to issue
        await this.octokit.issues.addLabels({
          owner,
          repo,
          issue_number: issueNumber,
          labels: [labelName],
        });
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Search for issues across repositories
   */
  async searchIssues(
    query: string,
    options?: {
      sort?: 'created' | 'updated' | 'comments';
      order?: 'asc' | 'desc';
      perPage?: number;
      page?: number;
    }
  ): Promise<IIssue[]> {
    try {
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `${query} is:issue`,
        sort: options?.sort,
        order: options?.order,
        per_page: options?.perPage || 30,
        page: options?.page || 1,
      });

      return data.items.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || null,
        labels: issue.labels.map((label) =>
          typeof label === 'string' ? label : label.name || ''
        ),
        state: issue.state,
        url: issue.html_url,
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
      }));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle GitHub API errors and convert to custom error types
   */
  private handleError(error: any): Error {
    // Check for rate limit errors
    if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
      const resetTimestamp = parseInt(error.response.headers['x-ratelimit-reset'] || '0');
      const resetDate = new Date(resetTimestamp * 1000);
      const limit = parseInt(error.response.headers['x-ratelimit-limit'] || '0');
      
      return new GitHubRateLimitError(
        `GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`,
        resetDate,
        limit,
        0
      );
    }

    // Check for authentication errors
    if (error.status === 401) {
      return new GitHubTokenInvalidError('GitHub access token is invalid or expired');
    }

    // Check for not found errors
    if (error.status === 404) {
      return new GitHubAPIError(
        error.message || 'Resource not found',
        404
      );
    }

    // Generic API error
    return new GitHubAPIError(
      error.message || 'GitHub API request failed',
      error.status,
      error.response?.headers?.['x-ratelimit-remaining']
        ? parseInt(error.response.headers['x-ratelimit-remaining'])
        : undefined,
      error.response?.headers?.['x-ratelimit-reset']
        ? new Date(parseInt(error.response.headers['x-ratelimit-reset']) * 1000)
        : undefined
    );
  }
}

/**
 * Create a GitHub service instance with the provided access token
 */
export function createGitHubService(accessToken: string): GitHubService {
  return new GitHubService(accessToken);
}

/**
 * Validate a GitHub access token
 */
export async function validateGitHubToken(accessToken: string): Promise<boolean> {
  try {
    const service = new GitHubService(accessToken);
    return await service.validateToken();
  } catch (error) {
    if (error instanceof GitHubTokenInvalidError) {
      return false;
    }
    throw error;
  }
}

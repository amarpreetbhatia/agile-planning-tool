import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGitHubService, GitHubAPIError, GitHubTokenInvalidError, GitHubRateLimitError } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!session.user.accessToken) {
      return NextResponse.json(
        { message: 'GitHub access token not found' },
        { status: 400 }
      );
    }

    const githubService = createGitHubService(session.user.accessToken);

    const repositories = await githubService.getRepositories({
      sort: 'updated',
      direction: 'desc',
      perPage: 100,
    });

    return NextResponse.json({
      repositories,
      count: repositories.length,
    });
  } catch (error: any) {
    console.error('GitHub repositories fetch error:', error);

    if (error instanceof GitHubTokenInvalidError) {
      return NextResponse.json(
        { message: 'GitHub access token is invalid or expired. Please re-authenticate.' },
        { status: 401 }
      );
    }

    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json(
        {
          message: `GitHub API rate limit exceeded. Resets at ${error.resetAt.toISOString()}`,
          resetAt: error.resetAt,
        },
        { status: 429 }
      );
    }

    if (error instanceof GitHubAPIError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

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

    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');

    if (!owner) {
      return NextResponse.json(
        { message: 'Owner parameter is required' },
        { status: 400 }
      );
    }

    const githubService = createGitHubService(session.user.accessToken);

    const projects = await githubService.getProjects(owner, {
      perPage: 20,
    });

    return NextResponse.json({
      projects,
      count: projects.length,
    });
  } catch (error: any) {
    console.error('GitHub projects fetch error:', error);

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
      { message: 'Failed to fetch GitHub projects' },
      { status: 500 }
    );
  }
}

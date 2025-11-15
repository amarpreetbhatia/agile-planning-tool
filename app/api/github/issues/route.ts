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
    const repo = searchParams.get('repo');
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    if (!owner || !repo) {
      return NextResponse.json(
        { message: 'Owner and repo parameters are required' },
        { status: 400 }
      );
    }

    const githubService = createGitHubService(session.user.accessToken);

    let issues;
    
    if (projectId) {
      // Fetch issues from GitHub Project
      const projectItems = await githubService.getProjectItems(projectId, {
        first: perPage,
      });
      
      // Convert project items to issues format
      issues = projectItems
        .filter((item) => item.issueNumber)
        .map((item) => ({
          number: item.issueNumber!,
          title: item.title,
          body: item.body,
          labels: item.status ? [item.status] : [],
          state: item.status || 'open',
          url: `https://github.com/${owner}/${repo}/issues/${item.issueNumber}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
    } else {
      // Fetch issues from repository
      issues = await githubService.getIssues(owner, repo, {
        state: 'open',
        sort: 'created',
        direction: 'desc',
        perPage,
        page,
      });
    }

    // Check if there are more issues
    const hasMore = issues.length === perPage;

    return NextResponse.json({
      issues,
      hasMore,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error('GitHub issues fetch error:', error);

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
      { message: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

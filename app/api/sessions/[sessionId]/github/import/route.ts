import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { IStory } from '@/types';

interface ImportRequestBody {
  repository?: {
    owner: string;
    name: string;
    fullName: string;
  };
  issues?: Array<{
    number: number;
    title: string;
    body: string | null;
    url: string;
  }>;
  projectNumber?: number;
  stories?: IStory[]; // Support direct story import (for manual stories)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const body: ImportRequestBody = await request.json();

    // Support both GitHub import and direct story import (for manual stories)
    if (!body.stories && (!body.repository || !body.issues || body.issues.length === 0)) {
      return NextResponse.json(
        { message: 'Either stories or repository with issues are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get current user
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Find the session
    const sessionDoc = await Session.findOne({ sessionId });
    if (!sessionDoc) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify user is the host
    if (sessionDoc.hostId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: 'Only the session host can import stories' },
        { status: 403 }
      );
    }

    let importedStories: IStory[] = [];

    // Handle direct story import (for manual stories)
    if (body.stories) {
      importedStories = body.stories;
    } else if (body.repository && body.issues) {
      const repository = body.repository;
      const issues = body.issues;
      
      // Update GitHub integration if not already set or if changed
      if (
        !sessionDoc.githubIntegration ||
        sessionDoc.githubIntegration.repoOwner !== repository.owner ||
        sessionDoc.githubIntegration.repoName !== repository.name
      ) {
        sessionDoc.githubIntegration = {
          repoOwner: repository.owner,
          repoName: repository.name,
          projectNumber: body.projectNumber,
          connectedAt: new Date(),
        };
      }

      // Create stories from issues
      importedStories = issues.map((issue) => ({
        id: `github-${repository.fullName}-${issue.number}`,
        title: issue.title,
        description: issue.body || '',
        source: 'github' as const,
        githubIssueNumber: issue.number,
        githubRepoFullName: repository.fullName,
      }));
    }

    // Add imported stories to session, avoiding duplicates
    const existingStoryIds = new Set(sessionDoc.stories.map((s) => s.id));
    const newStories = importedStories.filter((story) => !existingStoryIds.has(story.id));
    
    sessionDoc.stories.push(...newStories);
    await sessionDoc.save();

    return NextResponse.json({
      message: 'Stories imported successfully',
      stories: importedStories,
      githubIntegration: sessionDoc.githubIntegration,
    });
  } catch (error: any) {
    console.error('Story import error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to import stories' },
      { status: 500 }
    );
  }
}

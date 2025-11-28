import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { getSocketServer } from '@/socket-server';
import { createGitHubService, GitHubAPIError } from '@/lib/github';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';

/**
 * POST /api/sessions/[sessionId]/stories/[storyId]/comments
 * Add a comment to a story
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string; storyId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { sessionId, storyId } = params;
    const body = await request.json();
    const { comment } = body;

    // Validate input
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Comment text is required' } },
        { status: 400 }
      );
    }

    if (comment.length > 5000) {
      return NextResponse.json(
        { success: false, error: { code: 'MESSAGE_TOO_LONG', message: 'Comment must be less than 5000 characters' } },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the session
    const sessionDoc = await Session.findOne({ sessionId });

    if (!sessionDoc) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = sessionDoc.participants.some(
      (p) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_SESSION_PARTICIPANT', message: 'You must be a session participant to comment' } },
        { status: 403 }
      );
    }

    // Find the story (check both currentStory and stories array)
    let story = null;
    let isCurrentStory = false;

    if (sessionDoc.currentStory?.id === storyId) {
      story = sessionDoc.currentStory;
      isCurrentStory = true;
    } else {
      story = sessionDoc.stories.find((s) => s.id === storyId);
    }

    if (!story) {
      return NextResponse.json(
        { success: false, error: { code: 'STORY_NOT_FOUND', message: 'Story not found in session' } },
        { status: 404 }
      );
    }

    // Create the comment object
    const newComment = {
      id: nanoid(),
      userId: new mongoose.Types.ObjectId(session.user.id),
      username: session.user.username,
      avatarUrl: session.user.avatarUrl,
      comment: comment.trim(),
      createdAt: new Date(),
      syncedToGitHub: false,
    };

    // Add comment to the story
    if (!story.comments) {
      story.comments = [];
    }
    story.comments.push(newComment as any);

    // Save the session
    await sessionDoc.save();

    // Sync to GitHub if the story is from GitHub
    let githubSyncError = null;
    if (story.source === 'github' && story.githubIssueNumber && story.githubRepoFullName) {
      try {
        const [owner, repo] = story.githubRepoFullName.split('/');
        
        if (session.user.accessToken) {
          const githubService = createGitHubService(session.user.accessToken);
          
          // Format comment for GitHub
          const githubComment = `**${session.user.username}** commented:\n\n${comment.trim()}\n\n_Posted via Agile Planning Tool_`;
          
          await githubService.postIssueComment(
            owner,
            repo,
            story.githubIssueNumber,
            githubComment
          );

          // Update sync status
          newComment.syncedToGitHub = true;
          await sessionDoc.save();
        }
      } catch (error) {
        console.error('Failed to sync comment to GitHub:', error);
        githubSyncError = error instanceof GitHubAPIError 
          ? error.message 
          : 'Failed to sync comment to GitHub';
        // Don't fail the request if GitHub sync fails
      }
    }

    // Broadcast the comment to all session participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('story:comment', storyId, newComment);
    } catch (error) {
      console.error('Failed to broadcast comment via Socket.IO:', error);
      // Don't fail the request if Socket.IO broadcast fails
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: newComment,
        githubSyncError,
      },
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Error adding story comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add comment',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[sessionId]/stories/[storyId]/comments
 * Get all comments for a story
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string; storyId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { sessionId, storyId } = params;

    await dbConnect();

    // Find the session
    const sessionDoc = await Session.findOne({ sessionId });

    if (!sessionDoc) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = sessionDoc.participants.some(
      (p) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_SESSION_PARTICIPANT', message: 'You must be a session participant to view comments' } },
        { status: 403 }
      );
    }

    // Find the story
    let story = null;

    if (sessionDoc.currentStory?.id === storyId) {
      story = sessionDoc.currentStory;
    } else {
      story = sessionDoc.stories.find((s) => s.id === storyId);
    }

    if (!story) {
      return NextResponse.json(
        { success: false, error: { code: 'STORY_NOT_FOUND', message: 'Story not found in session' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        comments: story.comments || [],
      },
    });
  } catch (error) {
    console.error('Error fetching story comments:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch comments',
        },
      },
      { status: 500 }
    );
  }
}

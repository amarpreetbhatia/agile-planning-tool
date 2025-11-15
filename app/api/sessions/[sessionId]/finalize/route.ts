import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';
import { getSocketServer } from '@/socket-server';
import { createGitHubService } from '@/lib/github';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * POST /api/sessions/[sessionId]/finalize
 * Finalize the estimate for the current story (host only)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await context.params;
    const body = await request.json();
    const { finalEstimate } = body;

    // Validate final estimate
    if (typeof finalEstimate !== 'number' || finalEstimate < 0) {
      return NextResponse.json(
        { error: 'Invalid final estimate value' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get current user
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find session
    const sessionData = await Session.findOne({ sessionId });
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session is active
    if (sessionData.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Verify user is the session host
    if (sessionData.hostId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Only the session host can finalize estimates' },
        { status: 403 }
      );
    }

    // Check if there's a current story
    if (!sessionData.currentStory) {
      return NextResponse.json(
        { error: 'No active story to finalize' },
        { status: 400 }
      );
    }

    // Find the current estimate
    const estimate = await Estimate.findOne({
      sessionId: sessionData._id,
      storyId: sessionData.currentStory.id,
      finalizedAt: null,
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'No active estimation round found' },
        { status: 404 }
      );
    }

    // Check if round has been revealed
    if (!estimate.revealedAt) {
      return NextResponse.json(
        { error: 'Estimates must be revealed before finalization' },
        { status: 400 }
      );
    }

    // Check if already finalized
    if (estimate.finalizedAt) {
      return NextResponse.json(
        { error: 'Estimate has already been finalized' },
        { status: 400 }
      );
    }

    // Store final estimate
    estimate.finalEstimate = finalEstimate;
    estimate.finalizedAt = new Date();
    await estimate.save();

    // Update GitHub issue if integration is active
    let githubUpdateSuccess = false;
    if (
      sessionData.githubIntegration &&
      sessionData.currentStory.source === 'github' &&
      sessionData.currentStory.githubIssueNumber &&
      sessionData.currentStory.githubRepoFullName
    ) {
      try {
        // Get user's GitHub access token
        if (user.accessToken) {
          const githubService = createGitHubService(user.accessToken);
          const [owner, repo] = sessionData.currentStory.githubRepoFullName.split('/');
          
          await githubService.updateIssueEstimate(
            owner,
            repo,
            sessionData.currentStory.githubIssueNumber,
            finalEstimate,
            {
              addComment: true,
              addLabel: false, // Optional: set to true to add estimate labels
            }
          );
          
          githubUpdateSuccess = true;
        }
      } catch (githubError) {
        console.error('Failed to update GitHub issue:', githubError);
        // Continue even if GitHub update fails
      }
    }

    // Broadcast finalization to all participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('estimate:finalized', finalEstimate);
    } catch (socketError) {
      console.error('Failed to broadcast finalization:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      finalEstimate,
      githubUpdated: githubUpdateSuccess,
      storyId: sessionData.currentStory.id,
      storyTitle: sessionData.currentStory.title,
    });
  } catch (error) {
    console.error('Error finalizing estimate:', error);
    return NextResponse.json(
      { error: 'Failed to finalize estimate' },
      { status: 500 }
    );
  }
}

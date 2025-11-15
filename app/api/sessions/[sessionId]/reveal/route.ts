import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';
import { getSocketServer } from '@/socket-server';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

interface EstimateResults {
  votes: Array<{
    userId: string;
    username: string;
    value: number;
    votedAt: Date;
  }>;
  average: number;
  min: number;
  max: number;
  storyId: string;
  storyTitle: string;
}

/**
 * POST /api/sessions/[sessionId]/reveal
 * Reveal all estimates for the current story (host only)
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
        { error: 'Only the session host can reveal estimates' },
        { status: 403 }
      );
    }

    // Check if there's a current story
    if (!sessionData.currentStory) {
      return NextResponse.json(
        { error: 'No active story to reveal' },
        { status: 400 }
      );
    }

    // Find the current estimate
    const estimate = await Estimate.findOne({
      sessionId: sessionData._id,
      storyId: sessionData.currentStory.id,
      revealedAt: null,
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'No active voting round found' },
        { status: 404 }
      );
    }

    // Check if round has already been revealed
    if (estimate.revealedAt) {
      return NextResponse.json(
        { error: 'Round has already been revealed' },
        { status: 400 }
      );
    }

    // Check if there are any votes
    if (estimate.votes.length === 0) {
      return NextResponse.json(
        { error: 'No votes to reveal' },
        { status: 400 }
      );
    }

    // Filter out special cards (?, ☕) for statistics calculation
    const numericVotes = estimate.votes.filter(
      (v) => v.value >= 0
    );

    if (numericVotes.length === 0) {
      return NextResponse.json(
        { error: 'No numeric votes to calculate statistics' },
        { status: 400 }
      );
    }

    // Calculate statistics
    const values = numericVotes.map((v) => v.value);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = Math.round((sum / values.length) * 10) / 10; // Round to 1 decimal
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Mark estimate as revealed
    estimate.revealedAt = new Date();
    await estimate.save();

    // Prepare results
    const results: EstimateResults = {
      votes: estimate.votes.map((v) => ({
        userId: v.userId.toString(),
        username: v.username,
        value: v.value,
        votedAt: v.votedAt,
      })),
      average,
      min,
      max,
      storyId: sessionData.currentStory.id,
      storyTitle: sessionData.currentStory.title,
    };

    // Broadcast results to all participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('round:revealed', results);
    } catch (socketError) {
      console.error('Failed to broadcast reveal results:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error revealing estimates:', error);
    return NextResponse.json(
      { error: 'Failed to reveal estimates' },
      { status: 500 }
    );
  }
}

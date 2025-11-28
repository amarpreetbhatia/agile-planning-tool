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

const MAX_ROUNDS = 3;

/**
 * POST /api/sessions/[sessionId]/revote
 * Start a re-vote for the current story (host only)
 * Stores previous round votes and creates a new round
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
        { error: 'Only the session host can initiate re-voting' },
        { status: 403 }
      );
    }

    // Check if there's a current story
    if (!sessionData.currentStory) {
      return NextResponse.json(
        { error: 'No active story to re-vote on' },
        { status: 400 }
      );
    }

    // Find the most recent revealed estimate for this story
    const lastEstimate = await Estimate.findOne({
      sessionId: sessionData._id,
      storyId: sessionData.currentStory.id,
      revealedAt: { $ne: null },
    }).sort({ roundNumber: -1 });

    if (!lastEstimate) {
      return NextResponse.json(
        { error: 'No revealed round found to re-vote' },
        { status: 400 }
      );
    }

    // Check if we've reached the maximum number of rounds
    if (lastEstimate.roundNumber >= MAX_ROUNDS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_ROUNDS} rounds reached` },
        { status: 400 }
      );
    }

    // Create a new estimate for the next round
    const newRoundNumber = lastEstimate.roundNumber + 1;
    const newEstimate = new Estimate({
      sessionId: sessionData._id,
      storyId: sessionData.currentStory.id,
      roundNumber: newRoundNumber,
      votes: [],
    });

    await newEstimate.save();

    // Broadcast re-vote event to all participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('round:revote', {
        roundNumber: newRoundNumber,
        storyId: sessionData.currentStory.id,
        storyTitle: sessionData.currentStory.title,
      });
    } catch (socketError) {
      console.error('Failed to broadcast re-vote event:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      roundNumber: newRoundNumber,
      message: `Round ${newRoundNumber} started`,
    });
  } catch (error) {
    console.error('Error initiating re-vote:', error);
    return NextResponse.json(
      { error: 'Failed to initiate re-vote' },
      { status: 500 }
    );
  }
}

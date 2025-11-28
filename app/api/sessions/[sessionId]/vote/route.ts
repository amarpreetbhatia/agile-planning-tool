import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';
import { getSocketServer } from '@/socket-server';

// Valid card values for planning poker
const VALID_CARD_VALUES = [0, 1, 2, 3, 5, 8, 13, 21, -1, -2]; // -1 = ?, -2 = ☕

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * POST /api/sessions/[sessionId]/vote
 * Cast or change a vote for the current story
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
    const { value, comment } = body;

    // Validate card value
    if (typeof value !== 'number' || !VALID_CARD_VALUES.includes(value)) {
      return NextResponse.json(
        { error: 'Invalid card value' },
        { status: 400 }
      );
    }

    // Validate comment if provided
    if (comment !== undefined && comment !== null) {
      if (typeof comment !== 'string') {
        return NextResponse.json(
          { error: 'Comment must be a string' },
          { status: 400 }
        );
      }
      if (comment.length > 200) {
        return NextResponse.json(
          { error: 'Comment must be 200 characters or less' },
          { status: 400 }
        );
      }
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

    // Check if user is a participant
    const isParticipant = sessionData.participants.some(
      (p) => p.userId.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this session' },
        { status: 403 }
      );
    }

    // Check if there's a current story
    if (!sessionData.currentStory) {
      return NextResponse.json(
        { error: 'No active story to vote on' },
        { status: 400 }
      );
    }

    // Find or create estimate for current story
    let estimate = await Estimate.findOne({
      sessionId: sessionData._id,
      storyId: sessionData.currentStory.id,
      revealedAt: null, // Only allow voting on unrevealed rounds
    });

    if (!estimate) {
      // Create new estimate for this story
      const lastEstimate = await Estimate.findOne({
        sessionId: sessionData._id,
      }).sort({ roundNumber: -1 });

      const roundNumber = lastEstimate ? lastEstimate.roundNumber + 1 : 1;

      estimate = new Estimate({
        sessionId: sessionData._id,
        storyId: sessionData.currentStory.id,
        roundNumber,
        votes: [],
      });
    }

    // Check if round has been revealed
    if (estimate.revealedAt) {
      return NextResponse.json(
        { error: 'Round has already been revealed' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVoteIndex = estimate.votes.findIndex(
      (v) => v.userId.toString() === user._id.toString()
    );

    const isVoteChange = existingVoteIndex !== -1;

    if (existingVoteIndex !== -1) {
      // Update existing vote
      estimate.votes[existingVoteIndex].value = value;
      estimate.votes[existingVoteIndex].comment = comment || undefined;
      estimate.votes[existingVoteIndex].votedAt = new Date();
    } else {
      // Add new vote
      estimate.votes.push({
        userId: user._id,
        username: user.username,
        value,
        comment: comment || undefined,
        votedAt: new Date(),
      });
    }

    await estimate.save();

    // Broadcast vote status to other participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('vote:cast', user._id.toString(), true);
    } catch (socketError) {
      console.error('Failed to broadcast vote status:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      vote: {
        value,
        votedAt: estimate.votes[existingVoteIndex !== -1 ? existingVoteIndex : estimate.votes.length - 1].votedAt,
        isChange: isVoteChange,
      },
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    return NextResponse.json(
      { error: 'Failed to cast vote' },
      { status: 500 }
    );
  }
}

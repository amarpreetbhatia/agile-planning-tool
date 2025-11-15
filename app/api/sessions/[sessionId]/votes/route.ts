import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * GET /api/sessions/[sessionId]/votes
 * Get current voting status for the active round
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    // If no current story, return empty status
    if (!sessionData.currentStory) {
      return NextResponse.json({
        hasActiveRound: false,
        voteStatus: {},
        currentUserVote: null,
      });
    }

    // Find current estimate
    const estimate = await Estimate.findOne({
      sessionId: sessionData._id,
      storyId: sessionData.currentStory.id,
      revealedAt: null,
    });

    if (!estimate) {
      return NextResponse.json({
        hasActiveRound: true,
        voteStatus: {},
        currentUserVote: null,
      });
    }

    // Build vote status map (userId -> hasVoted)
    const voteStatus: { [key: string]: boolean } = {};
    estimate.votes.forEach((vote) => {
      voteStatus[vote.userId.toString()] = true;
    });

    // Get current user's vote
    const currentUserVote = estimate.votes.find(
      (v) => v.userId.toString() === user._id.toString()
    );

    return NextResponse.json({
      hasActiveRound: true,
      voteStatus,
      currentUserVote: currentUserVote
        ? {
            value: currentUserVote.value,
            votedAt: currentUserVote.votedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching vote status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote status' },
      { status: 500 }
    );
  }
}

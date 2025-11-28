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
 * GET /api/sessions/[sessionId]/vote-history?storyId=xxx
 * Get vote history for a specific story across all rounds
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
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        { error: 'storyId parameter is required' },
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

    // Get all estimates for this story, sorted by round number
    const estimates = await Estimate.find({
      sessionId: sessionData._id,
      storyId,
    }).sort({ roundNumber: 1 });

    // Format the response
    const history = estimates.map((estimate) => ({
      roundNumber: estimate.roundNumber,
      votes: estimate.votes.map((v) => ({
        userId: v.userId.toString(),
        username: v.username,
        value: v.value,
        comment: v.comment,
        votedAt: v.votedAt,
      })),
      revealedAt: estimate.revealedAt,
      finalizedAt: estimate.finalizedAt,
      finalEstimate: estimate.finalEstimate,
      // Calculate statistics for revealed rounds
      statistics: estimate.revealedAt
        ? (() => {
            const numericVotes = estimate.votes.filter((v) => v.value >= 0);
            if (numericVotes.length === 0) return null;
            const values = numericVotes.map((v) => v.value);
            const sum = values.reduce((acc, val) => acc + val, 0);
            const average = Math.round((sum / values.length) * 10) / 10;
            const min = Math.min(...values);
            const max = Math.max(...values);
            return { average, min, max };
          })()
        : null,
    }));

    return NextResponse.json({
      success: true,
      storyId,
      history,
      totalRounds: history.length,
    });
  } catch (error) {
    console.error('Error fetching vote history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote history' },
      { status: 500 }
    );
  }
}

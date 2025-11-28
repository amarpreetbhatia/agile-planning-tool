import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the session
    const sessionDoc = await Session.findOne({ sessionId }).lean();

    if (!sessionDoc) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Find the user
    const user = await User.findOne({ githubId: session.user.githubId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is part of the session
    const isHost = sessionDoc.hostId.toString() === user._id.toString();
    const isParticipant = sessionDoc.participants.some(
      (p) => p.userId.toString() === user._id.toString()
    );

    if (!isHost && !isParticipant) {
      return NextResponse.json(
        { error: 'You are not authorized to view this session' },
        { status: 403 }
      );
    }

    // Fetch all estimates for this session
    const estimates = await Estimate.find({ sessionId: sessionDoc._id })
      .sort({ roundNumber: 1 })
      .lean();

    // Get story details from session.stories
    const estimatesWithDetails = estimates.map((estimate) => {
      const story = sessionDoc.stories?.find((s) => s.id === estimate.storyId);

      // Calculate statistics for this estimate
      const votes = estimate.votes;
      const voteValues = votes.map((v) => v.value);
      const average = voteValues.length > 0
        ? voteValues.reduce((sum, val) => sum + val, 0) / voteValues.length
        : 0;
      const min = voteValues.length > 0 ? Math.min(...voteValues) : 0;
      const max = voteValues.length > 0 ? Math.max(...voteValues) : 0;

      return {
        _id: estimate._id.toString(),
        storyId: estimate.storyId,
        story: story || null,
        roundNumber: estimate.roundNumber,
        votes: votes.map((v) => ({
          userId: v.userId.toString(),
          username: v.username,
          value: v.value,
          votedAt: v.votedAt.toISOString(),
        })),
        finalEstimate: estimate.finalEstimate,
        revealedAt: estimate.revealedAt?.toISOString(),
        finalizedAt: estimate.finalizedAt?.toISOString(),
        createdAt: estimate.createdAt.toISOString(),
        statistics: {
          average: Math.round(average * 10) / 10,
          min,
          max,
          voteCount: votes.length,
        },
      };
    });

    // Calculate overall session statistics
    const completedEstimates = estimatesWithDetails.filter((e) => e.finalEstimate !== undefined);
    const totalEstimatePoints = completedEstimates.reduce(
      (sum, e) => sum + (e.finalEstimate || 0),
      0
    );
    const avgEstimateValue = completedEstimates.length > 0
      ? totalEstimatePoints / completedEstimates.length
      : 0;

    return NextResponse.json({
      session: {
        _id: sessionDoc._id.toString(),
        sessionId: sessionDoc.sessionId,
        name: sessionDoc.name,
        status: sessionDoc.status,
        hostId: sessionDoc.hostId.toString(),
        isHost,
        participants: sessionDoc.participants.map((p) => ({
          userId: p.userId.toString(),
          username: p.username,
          avatarUrl: p.avatarUrl,
          joinedAt: p.joinedAt.toISOString(),
        })),
        githubIntegration: sessionDoc.githubIntegration,
        createdAt: sessionDoc.createdAt.toISOString(),
        updatedAt: sessionDoc.updatedAt.toISOString(),
      },
      estimates: estimatesWithDetails,
      statistics: {
        totalStories: estimatesWithDetails.length,
        completedStories: completedEstimates.length,
        totalEstimatePoints,
        avgEstimateValue: Math.round(avgEstimateValue * 10) / 10,
        totalVotes: estimatesWithDetails.reduce((sum, e) => sum + e.votes.length, 0),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

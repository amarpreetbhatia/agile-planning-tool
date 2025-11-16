import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters for filtering and sorting
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'archived'; // Default to archived
    const sortBy = searchParams.get('sortBy') || 'updatedAt'; // updatedAt, name, participantCount
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Find the user
    const user = await User.findOne({ githubId: session.user.githubId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = {
      $or: [
        { hostId: user._id },
        { 'participants.userId': user._id },
      ],
    };

    if (status !== 'all') {
      query.status = status;
    }

    // Get total count for pagination
    const totalCount = await Session.countDocuments(query);

    // Fetch sessions with sorting and pagination
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const sessions = await Session.find(query)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit)
      .lean();

    // Fetch estimates for each session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (s) => {
        const estimates = await Estimate.find({ sessionId: s._id }).lean();

        // Calculate statistics
        const totalStories = estimates.length;
        const completedStories = estimates.filter((e) => e.finalEstimate !== undefined).length;
        const totalEstimatePoints = estimates
          .filter((e) => e.finalEstimate !== undefined)
          .reduce((sum, e) => sum + (e.finalEstimate || 0), 0);

        // Calculate average votes per story
        const totalVotes = estimates.reduce((sum, e) => sum + e.votes.length, 0);
        const avgVotesPerStory = totalStories > 0 ? totalVotes / totalStories : 0;

        return {
          _id: s._id.toString(),
          sessionId: s.sessionId,
          name: s.name,
          status: s.status,
          hostId: s.hostId.toString(),
          isHost: s.hostId.toString() === user._id.toString(),
          participantCount: s.participants.length,
          participants: s.participants.map((p) => ({
            userId: p.userId.toString(),
            username: p.username,
            avatarUrl: p.avatarUrl,
            joinedAt: p.joinedAt.toISOString(),
          })),
          githubIntegration: s.githubIntegration,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          statistics: {
            totalStories,
            completedStories,
            totalEstimatePoints,
            avgVotesPerStory: Math.round(avgVotesPerStory * 10) / 10,
          },
        };
      })
    );

    return NextResponse.json({
      sessions: sessionsWithStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

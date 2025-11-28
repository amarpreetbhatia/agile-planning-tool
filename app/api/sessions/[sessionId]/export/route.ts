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
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json'; // json or csv

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
        { error: 'You are not authorized to export this session' },
        { status: 403 }
      );
    }

    // Fetch all estimates for this session
    const estimates = await Estimate.find({ sessionId: sessionDoc._id })
      .sort({ roundNumber: 1 })
      .lean();

    if (format === 'csv') {
      // Generate CSV format
      const csvRows: string[] = [];
      
      // Header
      csvRows.push('Round,Story Title,Story ID,Participant,Vote,Final Estimate,Revealed At,Finalized At');

      // Data rows
      estimates.forEach((estimate) => {
        const story = sessionDoc.stories?.find((s) => s.id === estimate.storyId);
        const storyTitle = story?.title || 'Unknown Story';
        
        estimate.votes.forEach((vote) => {
          csvRows.push(
            [
              estimate.roundNumber,
              `"${storyTitle.replace(/"/g, '""')}"`, // Escape quotes in CSV
              estimate.storyId,
              vote.username,
              vote.value,
              estimate.finalEstimate || '',
              estimate.revealedAt?.toISOString() || '',
              estimate.finalizedAt?.toISOString() || '',
            ].join(',')
          );
        });

        // If no votes, still add a row for the story
        if (estimate.votes.length === 0) {
          csvRows.push(
            [
              estimate.roundNumber,
              `"${storyTitle.replace(/"/g, '""')}"`,
              estimate.storyId,
              '',
              '',
              estimate.finalEstimate || '',
              estimate.revealedAt?.toISOString() || '',
              estimate.finalizedAt?.toISOString() || '',
            ].join(',')
          );
        }
      });

      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="session-${sessionId}-export.csv"`,
        },
      });
    } else {
      // JSON format
      const exportData = {
        session: {
          sessionId: sessionDoc.sessionId,
          name: sessionDoc.name,
          status: sessionDoc.status,
          createdAt: sessionDoc.createdAt.toISOString(),
          updatedAt: sessionDoc.updatedAt.toISOString(),
          participants: sessionDoc.participants.map((p) => ({
            username: p.username,
            joinedAt: p.joinedAt.toISOString(),
          })),
          githubIntegration: sessionDoc.githubIntegration,
        },
        estimates: estimates.map((estimate) => {
          const story = sessionDoc.stories?.find((s) => s.id === estimate.storyId);
          return {
            roundNumber: estimate.roundNumber,
            story: story || { id: estimate.storyId, title: 'Unknown Story' },
            votes: estimate.votes.map((v) => ({
              username: v.username,
              value: v.value,
              votedAt: v.votedAt.toISOString(),
            })),
            finalEstimate: estimate.finalEstimate,
            revealedAt: estimate.revealedAt?.toISOString(),
            finalizedAt: estimate.finalizedAt?.toISOString(),
          };
        }),
        exportedAt: new Date().toISOString(),
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="session-${sessionId}-export.json"`,
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

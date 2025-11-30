import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';
import { getSocketServer } from '@/socket-server';
import { sendSessionSummaryEmail } from '@/lib/email';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

export interface SessionSummary {
  sessionId: string;
  sessionName: string;
  hostName: string;
  participantCount: number;
  estimatedStories: Array<{
    storyId: string;
    storyTitle: string;
    finalEstimate?: number;
    votes: Array<{
      username: string;
      value: number;
    }>;
    average: number;
    min: number;
    max: number;
  }>;
  totalStories: number;
  endedAt: Date;
}

/**
 * POST /api/sessions/[sessionId]/end
 * End the session and archive it (host only)
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

    // Check if session is already archived
    if (sessionData.status === 'archived') {
      return NextResponse.json(
        { error: 'Session is already ended' },
        { status: 400 }
      );
    }

    // Verify user is the session host
    if (sessionData.hostId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Only the session host can end the session' },
        { status: 403 }
      );
    }

    // Get all estimates for this session to create summary
    const estimates = await Estimate.find({
      sessionId: sessionData._id,
    }).sort({ createdAt: 1 });

    // Build session summary
    const estimatedStories = estimates.map((estimate) => {
      const numericVotes = estimate.votes.filter((v) => v.value >= 0);
      const values = numericVotes.map((v) => v.value);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      // Find the story from session stories
      const story = sessionData.stories.find((s) => s.id === estimate.storyId);

      return {
        storyId: estimate.storyId,
        storyTitle: story?.title || 'Unknown Story',
        finalEstimate: estimate.finalEstimate,
        votes: estimate.votes.map((v) => ({
          username: v.username,
          value: v.value,
        })),
        average,
        min,
        max,
      };
    });

    const summary: SessionSummary = {
      sessionId: sessionData.sessionId,
      sessionName: sessionData.name,
      hostName: user.username,
      participantCount: sessionData.participants.length,
      estimatedStories,
      totalStories: sessionData.stories.length,
      endedAt: new Date(),
    };

    // Archive the session
    sessionData.status = 'archived';
    await sessionData.save();

    // Send email summaries to participants (async, don't wait)
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false') {
      const participantIds = sessionData.participants.map((p) => p.userId);
      const participants = await User.find({
        _id: { $in: participantIds },
      });

      // Send notifications asynchronously
      sendSessionSummaryEmail(sessionData, estimates, participants).catch((error) => {
        console.error('Failed to send session summary emails:', error);
      });
    }

    // Broadcast session end event to all participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('session:ended');

      // Disconnect all sockets in the room
      const socketsInRoom = io.sockets.adapter.rooms.get(sessionId);
      if (socketsInRoom) {
        socketsInRoom.forEach((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(sessionId);
          }
        });
      }
    } catch (socketError) {
      console.error('Failed to broadcast session end:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

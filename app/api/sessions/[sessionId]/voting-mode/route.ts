import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { getSocketServer } from '@/socket-server';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * PATCH /api/sessions/[sessionId]/voting-mode
 * Change voting mode for the session (host only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const { votingMode } = body;

    // Validate voting mode
    if (!votingMode || !['anonymous', 'open'].includes(votingMode)) {
      return NextResponse.json(
        { error: 'Invalid voting mode. Must be "anonymous" or "open"' },
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

    // Check if user is the host
    if (sessionData.hostId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Only the session host can change voting mode' },
        { status: 403 }
      );
    }

    // Check if session is active
    if (sessionData.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot change voting mode for inactive session' },
        { status: 400 }
      );
    }

    // Update voting mode
    sessionData.votingMode = votingMode;
    await sessionData.save();

    // Broadcast voting mode change to all participants
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('voting-mode:changed', votingMode);
    } catch (socketError) {
      console.error('Failed to broadcast voting mode change:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      votingMode,
    });
  } catch (error) {
    console.error('Error changing voting mode:', error);
    return NextResponse.json(
      { error: 'Failed to change voting mode' },
      { status: 500 }
    );
  }
}

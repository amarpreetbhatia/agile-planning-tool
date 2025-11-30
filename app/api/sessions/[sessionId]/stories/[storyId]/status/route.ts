import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import { getSocketServer } from '@/socket-server';

interface RouteContext {
  params: Promise<{
    sessionId: string;
    storyId: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId, storyId } = await context.params;
    const { status } = await request.json();

    if (!status || !['ready', 'not-ready', 'estimated'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the session
    const sessionDoc = await Session.findOne({ sessionId });
    if (!sessionDoc) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is the host
    if (sessionDoc.hostId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the host can update story status' },
        { status: 403 }
      );
    }

    // Find and update the story
    const story = sessionDoc.stories.find((s) => s.id === storyId);
    if (!story) {
      return NextResponse.json(
        { success: false, error: 'Story not found' },
        { status: 404 }
      );
    }

    story.status = status;
    await sessionDoc.save();

    // Broadcast the update to all participants
    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit('story:status-updated', {
        storyId,
        status,
      });
    }

    return NextResponse.json({
      success: true,
      data: { story },
    });
  } catch (error) {
    console.error('Error updating story status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update story status' },
      { status: 500 }
    );
  }
}

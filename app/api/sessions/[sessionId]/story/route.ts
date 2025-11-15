import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import { IStory } from '@/types';
import { getSocketServer } from '@/socket-server';

/**
 * POST /api/sessions/[sessionId]/story
 * Select a story for estimation (host only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { story } = body as { story: IStory };

    if (!story || !story.id || !story.title) {
      return NextResponse.json(
        { error: 'Invalid story data' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the session
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

    // Verify user is the host
    const user = await import('@/models/User').then((m) => m.default);
    const currentUser = await user.findOne({ githubId: session.user.githubId });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (sessionData.hostId.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Only the session host can select stories' },
        { status: 403 }
      );
    }

    // Update current story in session
    sessionData.currentStory = story;
    await sessionData.save();

    // Broadcast story selection to all participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('story:selected', story);
    } catch (socketError) {
      console.error('Failed to broadcast story selection:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      story: sessionData.currentStory,
    });
  } catch (error) {
    console.error('Error selecting story:', error);
    return NextResponse.json(
      { error: 'Failed to select story' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[sessionId]/story
 * Clear the current story (host only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    await connectDB();

    // Find the session
    const sessionData = await Session.findOne({ sessionId });

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify user is the host
    const user = await import('@/models/User').then((m) => m.default);
    const currentUser = await user.findOne({ githubId: session.user.githubId });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (sessionData.hostId.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Only the session host can clear stories' },
        { status: 403 }
      );
    }

    // Clear current story
    sessionData.currentStory = undefined;
    await sessionData.save();

    // Broadcast story cleared to all participants
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('story:selected', null);
    } catch (socketError) {
      console.error('Failed to broadcast story clear:', socketError);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error clearing story:', error);
    return NextResponse.json(
      { error: 'Failed to clear story' },
      { status: 500 }
    );
  }
}

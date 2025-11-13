import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { getSocketServer } from '@/socket-server';

// POST /api/sessions/[sessionId]/leave - Leave a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    // Connect to database
    await connectDB();

    // Find the user in the database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the session
    const sessionData = await Session.findOne({ sessionId });
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update participant online status instead of removing
    const participant = sessionData.participants.find(
      (p) => p.userId.toString() === user._id.toString()
    );
    
    if (participant) {
      participant.isOnline = false;
      await sessionData.save();

      // Broadcast leave event via Socket.IO
      try {
        const io = getSocketServer();
        io.to(sessionId).emit('participant:left', user._id.toString());
      } catch (error) {
        console.error('Failed to broadcast participant left event:', error);
        // Continue even if broadcast fails
      }
    }

    return NextResponse.json(
      {
        message: 'Successfully left session',
        sessionId: sessionData.sessionId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error leaving session:', error);
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';

// POST /api/sessions/[sessionId]/join - Join a session
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

    // Check if session is archived
    if (sessionData.status === 'archived') {
      return NextResponse.json(
        { error: 'Session has ended' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const isParticipant = sessionData.participants.some(
      (p) => p.userId.toString() === user._id.toString()
    );

    if (isParticipant) {
      // User already in session, just return success
      return NextResponse.json(
        {
          message: 'Already in session',
          sessionId: sessionData.sessionId,
          name: sessionData.name,
        },
        { status: 200 }
      );
    }

    // Add user to participants
    sessionData.participants.push({
      userId: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      joinedAt: new Date(),
      isOnline: true,
    });

    await sessionData.save();

    return NextResponse.json(
      {
        message: 'Successfully joined session',
        sessionId: sessionData.sessionId,
        name: sessionData.name,
        participants: sessionData.participants,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}

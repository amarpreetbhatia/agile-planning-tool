import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { nanoid } from 'nanoid';

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Session name must be 100 characters or less' },
        { status: 400 }
      );
    }

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

    // Generate unique session ID (8 characters, URL-safe)
    const sessionId = nanoid(8);

    // Create the session with host as first participant
    const newSession = await Session.create({
      sessionId,
      hostId: user._id,
      name: name.trim(),
      status: 'active',
      participants: [
        {
          userId: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          joinedAt: new Date(),
          isOnline: true,
        },
      ],
    });

    // Return the created session
    return NextResponse.json(
      {
        sessionId: newSession.sessionId,
        name: newSession.name,
        hostId: newSession.hostId.toString(),
        status: newSession.status,
        participants: newSession.participants,
        createdAt: newSession.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// GET /api/sessions - Get all sessions for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // Find sessions where user is host or participant
    const sessions = await Session.find({
      $or: [
        { hostId: user._id },
        { 'participants.userId': user._id },
      ],
      status,
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Transform sessions for response
    const transformedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      name: s.name,
      hostId: s.hostId.toString(),
      status: s.status,
      participantCount: s.participants.length,
      participants: s.participants,
      currentStory: s.currentStory,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({ sessions: transformedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

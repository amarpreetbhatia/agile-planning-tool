import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { WhiteboardSnapshot, Session } from '@/models';

// GET /api/sessions/[sessionId]/whiteboard/snapshots - Get all snapshots for a session
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();

    const { sessionId } = params;

    // Verify session exists and user is a participant
    const sessionDoc = await Session.findOne({ sessionId });

    if (!sessionDoc) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = sessionDoc.participants.some(
      (p: any) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not a session participant' } },
        { status: 403 }
      );
    }

    // Get all snapshots for this session
    const snapshots = await WhiteboardSnapshot.find({ sessionId: sessionDoc._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('Error fetching whiteboard snapshots:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to fetch whiteboard snapshots',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[sessionId]/whiteboard/snapshots - Create a new snapshot
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();

    const { sessionId } = params;
    const body = await request.json();
    const { data, imageUrl, title, storyId } = body;

    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Whiteboard data is required' } },
        { status: 400 }
      );
    }

    // Verify session exists and user is a participant
    const sessionDoc = await Session.findOne({ sessionId });

    if (!sessionDoc) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = sessionDoc.participants.some(
      (p: any) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not a session participant' } },
        { status: 403 }
      );
    }

    // Create snapshot
    const snapshot = await WhiteboardSnapshot.create({
      sessionId: sessionDoc._id,
      storyId: storyId || undefined,
      createdBy: session.user.id,
      data,
      imageUrl: imageUrl || undefined,
      title: title || `Snapshot ${new Date().toLocaleString()}`,
    });

    return NextResponse.json({
      success: true,
      data: snapshot,
      message: 'Snapshot saved successfully',
    });
  } catch (error) {
    console.error('Error creating whiteboard snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to create whiteboard snapshot',
        },
      },
      { status: 500 }
    );
  }
}

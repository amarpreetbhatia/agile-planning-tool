import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { WhiteboardSnapshot, Session } from '@/models';

// GET /api/sessions/[sessionId]/whiteboard/snapshots/[snapshotId] - Get a specific snapshot
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string; snapshotId: string } }
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

    const { sessionId, snapshotId } = params;

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

    // Get the snapshot
    const snapshot = await WhiteboardSnapshot.findById(snapshotId).lean();

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Snapshot not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error fetching whiteboard snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to fetch whiteboard snapshot',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[sessionId]/whiteboard/snapshots/[snapshotId] - Delete a snapshot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string; snapshotId: string } }
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

    const { sessionId, snapshotId } = params;

    // Verify session exists and user is a participant
    const sessionDoc = await Session.findOne({ sessionId });

    if (!sessionDoc) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Get the snapshot
    const snapshot = await WhiteboardSnapshot.findById(snapshotId);

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Snapshot not found' } },
        { status: 404 }
      );
    }

    // Only the creator or session host can delete
    const isCreator = snapshot.createdBy.toString() === session.user.id;
    const isHost = sessionDoc.hostId.toString() === session.user.id;

    if (!isCreator && !isHost) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Only the creator or host can delete this snapshot' } },
        { status: 403 }
      );
    }

    await WhiteboardSnapshot.findByIdAndDelete(snapshotId);

    return NextResponse.json({
      success: true,
      message: 'Snapshot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting whiteboard snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to delete whiteboard snapshot',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[sessionId]/whiteboard/snapshots/[snapshotId] - Attach snapshot to story
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string; snapshotId: string } }
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

    const { sessionId, snapshotId } = params;
    const body = await request.json();
    const { storyId, title } = body;

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

    // Update the snapshot
    const snapshot = await WhiteboardSnapshot.findByIdAndUpdate(
      snapshotId,
      {
        ...(storyId !== undefined && { storyId }),
        ...(title !== undefined && { title }),
      },
      { new: true }
    );

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Snapshot not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
      message: 'Snapshot updated successfully',
    });
  } catch (error) {
    console.error('Error updating whiteboard snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to update whiteboard snapshot',
        },
      },
      { status: 500 }
    );
  }
}

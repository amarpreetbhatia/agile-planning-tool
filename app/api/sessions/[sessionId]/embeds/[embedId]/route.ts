import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';

/**
 * PATCH /api/sessions/[sessionId]/embeds/[embedId]
 * Update embed panel state
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string; embedId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { panelState } = body;

    if (!panelState) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Panel state is required' } },
        { status: 400 }
      );
    }

    await dbConnect();

    const dbSession = await Session.findOne({ sessionId: params.sessionId });
    if (!dbSession) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = dbSession.participants.some(
      (p) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not a session participant' } },
        { status: 403 }
      );
    }

    // Find and update the embed
    const embedIndex = dbSession.externalEmbeds?.findIndex(
      (e) => e.id === params.embedId
    );

    if (embedIndex === -1 || embedIndex === undefined) {
      return NextResponse.json(
        { success: false, error: { code: 'EMBED_NOT_FOUND', message: 'Embed not found' } },
        { status: 404 }
      );
    }

    if (dbSession.externalEmbeds) {
      dbSession.externalEmbeds[embedIndex].panelState = panelState;
      await dbSession.save();
    }

    return NextResponse.json({
      success: true,
      data: dbSession.externalEmbeds?.[embedIndex],
      message: 'Embed updated successfully',
    });
  } catch (error) {
    console.error('Error updating embed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update embed' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[sessionId]/embeds/[embedId]
 * Remove an external embed from the session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string; embedId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await dbConnect();

    const dbSession = await Session.findOne({ sessionId: params.sessionId });
    if (!dbSession) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Check if user is the host (only host can remove embeds)
    if (dbSession.hostId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_SESSION_HOST', message: 'Only the host can remove embeds' } },
        { status: 403 }
      );
    }

    // Remove the embed
    if (dbSession.externalEmbeds) {
      dbSession.externalEmbeds = dbSession.externalEmbeds.filter(
        (e) => e.id !== params.embedId
      );
      await dbSession.save();
    }

    // Broadcast to all participants via Socket.IO
    try {
      const io = (global as any).io;
      if (io) {
        io.to(params.sessionId).emit('embed:removed', params.embedId);
      }
    } catch (socketError) {
      console.error('Error broadcasting embed:removed event:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: 'Embed removed successfully',
    });
  } catch (error) {
    console.error('Error removing embed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove embed' } },
      { status: 500 }
    );
  }
}

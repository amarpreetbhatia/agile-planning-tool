import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { parseEmbedUrl } from '@/lib/embed-parser';
import { nanoid } from 'nanoid';

/**
 * GET /api/sessions/[sessionId]/embeds
 * Get all external embeds for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    return NextResponse.json({
      success: true,
      data: dbSession.externalEmbeds || [],
    });
  } catch (error) {
    console.error('Error fetching embeds:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch embeds' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions/[sessionId]/embeds
 * Add a new external embed to the session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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
    const { url, title } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'URL is required' } },
        { status: 400 }
      );
    }

    // Parse and validate the URL
    const parsed = parseEmbedUrl(url);
    if (!parsed.isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_URL', message: parsed.error || 'Invalid URL' } },
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

    // Check if user is the host (only host can add embeds)
    if (dbSession.hostId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_SESSION_HOST', message: 'Only the host can add embeds' } },
        { status: 403 }
      );
    }

    // Create the embed object
    const embed = {
      id: nanoid(),
      type: parsed.type,
      url: parsed.url,
      embedUrl: parsed.embedUrl,
      title: title || parsed.title,
      addedBy: session.user.id,
      addedAt: new Date(),
      panelState: {
        width: 800,
        height: 600,
        x: 100,
        y: 100,
        minimized: false,
      },
    };

    // Add embed to session
    if (!dbSession.externalEmbeds) {
      dbSession.externalEmbeds = [];
    }
    dbSession.externalEmbeds.push(embed);
    await dbSession.save();

    // Broadcast to all participants via Socket.IO
    try {
      const io = (global as any).io;
      if (io) {
        io.to(params.sessionId).emit('embed:added', embed);
      }
    } catch (socketError) {
      console.error('Error broadcasting embed:added event:', socketError);
    }

    return NextResponse.json({
      success: true,
      data: embed,
      message: 'Embed added successfully',
    });
  } catch (error) {
    console.error('Error adding embed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add embed' } },
      { status: 500 }
    );
  }
}

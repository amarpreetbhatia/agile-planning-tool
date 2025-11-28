import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Session, ChatMessage } from '@/models';
import { getSocketServer } from '@/socket-server';
import { ErrorCode } from '@/lib/error-logger';

// Sanitize message to prevent XSS
function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

// POST /api/sessions/[sessionId]/messages - Send a chat message
export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const { sessionId } = await context.params;
    const body = await req.json();
    const { message } = body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Message is required',
          },
        },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Message cannot be empty',
          },
        },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MESSAGE_TOO_LONG',
            message: 'Message cannot exceed 2000 characters',
          },
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find session and verify user is a participant
    const sessionDoc = await Session.findOne({ sessionId });

    if (!sessionDoc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.SESSION_NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if session is active
    if (sessionDoc.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.SESSION_ENDED,
            message: 'Cannot send messages to an archived session',
          },
        },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const isParticipant = sessionDoc.participants.some(
      (p) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'You are not a participant in this session',
          },
        },
        { status: 403 }
      );
    }

    // Sanitize message
    const sanitizedMessage = sanitizeMessage(trimmedMessage);

    // Create chat message
    const chatMessage = await ChatMessage.create({
      sessionId: sessionDoc._id,
      userId: session.user.id,
      username: session.user.username,
      avatarUrl: session.user.avatarUrl,
      message: sanitizedMessage,
      type: 'text',
    });

    // Broadcast message to all participants via Socket.IO
    try {
      const io = getSocketServer();
      io.to(sessionId).emit('chat:message', {
        _id: chatMessage._id.toString(),
        sessionId: sessionDoc._id.toString(),
        userId: session.user.id,
        username: session.user.username,
        avatarUrl: session.user.avatarUrl,
        message: sanitizedMessage,
        type: 'text',
        createdAt: chatMessage.createdAt,
        updatedAt: chatMessage.updatedAt,
      });
    } catch (socketError) {
      console.error('Failed to broadcast chat message:', socketError);
      // Continue even if socket broadcast fails
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: chatMessage._id.toString(),
        sessionId: sessionDoc._id.toString(),
        userId: session.user.id,
        username: session.user.username,
        avatarUrl: session.user.avatarUrl,
        message: sanitizedMessage,
        type: 'text',
        createdAt: chatMessage.createdAt,
        updatedAt: chatMessage.updatedAt,
      },
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DB_OPERATION_FAILED,
          message: 'Failed to send message',
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/sessions/[sessionId]/messages - Get chat history
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const { sessionId } = await context.params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before'); // Cursor for pagination

    await connectDB();

    // Find session and verify user is a participant
    const sessionDoc = await Session.findOne({ sessionId });

    if (!sessionDoc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.SESSION_NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify user is a participant
    const isParticipant = sessionDoc.participants.some(
      (p) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'You are not a participant in this session',
          },
        },
        { status: 403 }
      );
    }

    // Build query
    const query: any = { sessionId: sessionDoc._id };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit + 1) // Fetch one extra to check if there are more
      .lean();

    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

    // Convert ObjectIds to strings
    const formattedMessages = messagesToReturn.map((msg) => ({
      _id: msg._id.toString(),
      sessionId: msg.sessionId.toString(),
      userId: msg.userId.toString(),
      username: msg.username,
      avatarUrl: msg.avatarUrl,
      message: msg.message,
      type: msg.type,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedMessages.reverse(), // Return in chronological order
      pagination: {
        hasMore,
        nextCursor: hasMore
          ? messagesToReturn[messagesToReturn.length - 1].createdAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DB_OPERATION_FAILED,
          message: 'Failed to fetch messages',
        },
      },
      { status: 500 }
    );
  }
}

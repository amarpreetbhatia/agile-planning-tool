import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import { getSocketServer } from '@/socket-server';

interface RouteContext {
  params: Promise<{
    sessionId: string;
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

    const { sessionId } = await context.params;
    const { storyIds, operation, value } = await request.json();

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid story IDs' },
        { status: 400 }
      );
    }

    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation is required' },
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
        { success: false, error: 'Only the host can perform bulk operations' },
        { status: 403 }
      );
    }

    // Perform bulk operation
    let updatedCount = 0;
    storyIds.forEach((storyId: string) => {
      const story = sessionDoc.stories.find((s) => s.id === storyId);
      if (story) {
        switch (operation) {
          case 'updateStatus':
            if (value && ['ready', 'not-ready', 'estimated'].includes(value)) {
              story.status = value;
              updatedCount++;
            }
            break;
          case 'addLabel':
            if (value && typeof value === 'string') {
              if (!story.labels) story.labels = [];
              if (!story.labels.includes(value)) {
                story.labels.push(value);
                updatedCount++;
              }
            }
            break;
          case 'removeLabel':
            if (value && typeof value === 'string' && story.labels) {
              const index = story.labels.indexOf(value);
              if (index > -1) {
                story.labels.splice(index, 1);
                updatedCount++;
              }
            }
            break;
          case 'delete':
            const index = sessionDoc.stories.findIndex((s) => s.id === storyId);
            if (index > -1) {
              sessionDoc.stories.splice(index, 1);
              updatedCount++;
            }
            break;
          default:
            break;
        }
      }
    });

    await sessionDoc.save();

    // Broadcast the update to all participants
    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit('stories:bulk-updated', {
        operation,
        storyIds,
        value,
        stories: sessionDoc.stories,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount,
        stories: sessionDoc.stories,
      },
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

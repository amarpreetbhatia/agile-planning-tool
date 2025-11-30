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
    const { storyOrders } = await request.json();

    if (!storyOrders || !Array.isArray(storyOrders)) {
      return NextResponse.json(
        { success: false, error: 'Invalid story orders' },
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
        { success: false, error: 'Only the host can reorder stories' },
        { status: 403 }
      );
    }

    // Update story orders
    storyOrders.forEach(({ id, order }: { id: string; order: number }) => {
      const story = sessionDoc.stories.find((s) => s.id === id);
      if (story) {
        story.order = order;
      }
    });

    await sessionDoc.save();

    // Broadcast the update to all participants
    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit('stories:reordered', {
        stories: sessionDoc.stories,
      });
    }

    return NextResponse.json({
      success: true,
      data: { stories: sessionDoc.stories },
    });
  } catch (error) {
    console.error('Error updating story order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update story order' },
      { status: 500 }
    );
  }
}

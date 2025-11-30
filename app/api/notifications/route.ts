import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const query: any = {
      userId: new mongoose.Types.ObjectId(session.user.id),
    };

    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean(),
      Notification.countDocuments(query),
    ]);

    // Convert ObjectIds to strings for client
    const serializedNotifications = notifications.map((notification) => ({
      ...notification,
      _id: notification._id.toString(),
      userId: notification.userId.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedNotifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notifications.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to fetch notifications',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { userId, type, title, message, link, metadata } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: userId, type, title, message',
          },
        },
        { status: 400 }
      );
    }

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      title,
      message,
      link,
      metadata,
      read: false,
      expiresAt,
    });

    // Emit Socket.IO event if available
    if ((global as any).io) {
      (global as any).io.to(`user:${userId}`).emit('notification:new', {
        _id: notification._id.toString(),
        userId: notification.userId.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: notification._id.toString(),
        userId: notification.userId.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to create notification',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();

    await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(session.user.id),
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to mark notifications as read',
        },
      },
      { status: 500 }
    );
  }
}

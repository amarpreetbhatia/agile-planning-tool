import Notification from '@/models/Notification';
import mongoose from 'mongoose';

interface CreateNotificationParams {
  userId: string;
  type: 'project_invitation' | 'session_created' | 'session_starting' | 'session_ended' | 'mention';
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

/**
 * Create a notification and emit it via Socket.IO if available
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { userId, type, title, message, link, metadata } = params;

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

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  const promises = userIds.map((userId) =>
    createNotification({ ...params, userId })
  );
  return Promise.all(promises);
}

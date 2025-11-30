import mongoose, { Schema, Document, Model } from 'mongoose';
import { ObjectId } from 'mongoose';

export interface INotification extends Document {
  _id: ObjectId;
  userId: ObjectId;
  type: 'project_invitation' | 'session_created' | 'session_starting' | 'session_ended' | 'mention';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: any;
  createdAt: Date;
  expiresAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['project_invitation', 'session_created', 'session_starting', 'session_ended', 'mention'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }); // For TTL cleanup

// TTL index to auto-delete expired notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

import mongoose, { Schema, Model } from 'mongoose';
import { IChatMessage } from '@/types';

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000, // Limit message length
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
ChatMessageSchema.index({ sessionId: 1, createdAt: -1 }); // For fetching messages chronologically
ChatMessageSchema.index({ createdAt: 1 }); // For cleanup/expiration

const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;

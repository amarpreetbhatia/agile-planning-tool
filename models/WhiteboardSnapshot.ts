import mongoose, { Schema, Model } from 'mongoose';
import { IWhiteboardSnapshot } from '@/types';

const WhiteboardSnapshotSchema = new Schema<IWhiteboardSnapshot>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    storyId: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
WhiteboardSnapshotSchema.index({ sessionId: 1 });
WhiteboardSnapshotSchema.index({ storyId: 1 });
WhiteboardSnapshotSchema.index({ createdAt: -1 });

const WhiteboardSnapshot: Model<IWhiteboardSnapshot> =
  mongoose.models.WhiteboardSnapshot ||
  mongoose.model<IWhiteboardSnapshot>('WhiteboardSnapshot', WhiteboardSnapshotSchema);

export default WhiteboardSnapshot;

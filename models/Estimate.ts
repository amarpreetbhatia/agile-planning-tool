import mongoose, { Schema, Model } from 'mongoose';
import { IEstimate, IVote } from '@/types';

const VoteSchema = new Schema<IVote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      required: false,
      maxlength: 200, // Character limit for vote comments
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const EstimateSchema = new Schema<IEstimate>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    storyId: {
      type: String,
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },
    votes: {
      type: [VoteSchema],
      default: [],
    },
    finalEstimate: {
      type: Number,
      required: false,
    },
    revealedAt: {
      type: Date,
      required: false,
    },
    finalizedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance (removed duplicate sessionId index)
EstimateSchema.index({ sessionId: 1, roundNumber: 1 });

const Estimate: Model<IEstimate> =
  mongoose.models.Estimate || mongoose.model<IEstimate>('Estimate', EstimateSchema);

export default Estimate;

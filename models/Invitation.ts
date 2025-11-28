import mongoose, { Schema, Model } from 'mongoose';
import { IInvitation } from '@/types';

const InvitationSchema = new Schema<IInvitation>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    invitedEmail: {
      type: String,
      required: false,
    },
    invitedGithubUsername: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    respondedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
InvitationSchema.index({ projectId: 1, status: 1 });
InvitationSchema.index({ invitedUser: 1, status: 1 });

const Invitation: Model<IInvitation> =
  mongoose.models.Invitation ||
  mongoose.model<IInvitation>('Invitation', InvitationSchema);

export default Invitation;

import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/types';

const UserSchema = new Schema<IUser>(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: false,
    },
    notificationPreferences: {
      type: {
        email: {
          sessionInvitations: { type: Boolean, default: true },
          sessionReminders: { type: Boolean, default: true },
          sessionSummaries: { type: Boolean, default: true },
          projectInvitations: { type: Boolean, default: true },
        },
        inApp: {
          sessionInvitations: { type: Boolean, default: true },
          sessionReminders: { type: Boolean, default: true },
          projectInvitations: { type: Boolean, default: true },
          mentions: { type: Boolean, default: true },
        },
      },
      required: false,
      default: {
        email: {
          sessionInvitations: true,
          sessionReminders: true,
          sessionSummaries: true,
          projectInvitations: true,
        },
        inApp: {
          sessionInvitations: true,
          sessionReminders: true,
          projectInvitations: true,
          mentions: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

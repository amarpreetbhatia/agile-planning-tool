import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/types';

const UserSchema = new Schema<IUser>(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Create index on githubId for fast lookups
UserSchema.index({ githubId: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

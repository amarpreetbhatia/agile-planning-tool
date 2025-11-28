import mongoose, { Schema, Model } from 'mongoose';
import { IProject, IProjectMember, IProjectSettings } from '@/types';

const ProjectMemberSchema = new Schema<IProjectMember>(
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
    avatarUrl: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProjectSettingsSchema = new Schema<IProjectSettings>(
  {
    defaultCardValues: {
      type: String,
      enum: ['fibonacci', 'tshirt', 'custom'],
      default: 'fibonacci',
    },
    customCardValues: {
      type: [Number],
      required: false,
    },
    defaultVotingMode: {
      type: String,
      enum: ['anonymous', 'open'],
      default: 'anonymous',
    },
    githubIntegration: {
      type: {
        defaultRepo: {
          type: String,
          required: false,
        },
        defaultProject: {
          type: Number,
          required: false,
        },
      },
      required: false,
    },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    projectId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: {
      type: [ProjectMemberSchema],
      default: [],
    },
    settings: {
      type: ProjectSettingsSchema,
      default: () => ({
        defaultCardValues: 'fibonacci',
        defaultVotingMode: 'anonymous',
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Create index for members.userId for efficient member queries
ProjectSchema.index({ 'members.userId': 1 });

const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;

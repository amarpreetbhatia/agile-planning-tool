import mongoose, { Schema, Model } from 'mongoose';
import { ISession, IParticipant, IStory, IGitHubIntegration } from '@/types';

const ParticipantSchema = new Schema<IParticipant>(
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const StorySchema = new Schema<IStory>(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ['manual', 'github'],
      required: true,
    },
    githubIssueNumber: {
      type: Number,
      required: false,
    },
    githubRepoFullName: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const GitHubIntegrationSchema = new Schema<IGitHubIntegration>(
  {
    repoOwner: {
      type: String,
      required: true,
    },
    repoName: {
      type: String,
      required: true,
    },
    projectNumber: {
      type: Number,
      required: false,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    votingMode: {
      type: String,
      enum: ['anonymous', 'open'],
      required: false,
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    currentStory: {
      type: StorySchema,
      required: false,
    },
    stories: {
      type: [StorySchema],
      default: [],
    },
    githubIntegration: {
      type: GitHubIntegrationSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
SessionSchema.index({ sessionId: 1 });
SessionSchema.index({ hostId: 1 });
SessionSchema.index({ projectId: 1 });

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;

// Type definitions for the application
import { ObjectId } from 'mongoose';
import { DefaultSession } from 'next-auth';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      githubId: string;
      username: string;
      avatarUrl: string;
      accessToken: string;
    } & DefaultSession['user'];
  }

  interface User {
    githubId?: string;
    username?: string;
    avatarUrl?: string;
  }
}

// User Types
export interface INotificationPreferences {
  email: {
    sessionInvitations: boolean;
    sessionReminders: boolean;
    sessionSummaries: boolean;
    projectInvitations: boolean;
  };
  inApp: {
    sessionInvitations: boolean;
    sessionReminders: boolean;
    projectInvitations: boolean;
    mentions: boolean;
  };
}

export interface IUser {
  _id: ObjectId;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken?: string; // Encrypted GitHub token for API access
  notificationPreferences?: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Session Types
export interface IParticipant {
  userId: ObjectId;
  username: string;
  avatarUrl: string;
  joinedAt: Date;
  isOnline: boolean;
}

// Serialized version for client components
export interface ISerializedParticipant {
  userId: string;
  username: string;
  avatarUrl: string;
  joinedAt: Date;
  isOnline: boolean;
}

export interface IStoryComment {
  id: string;
  userId: ObjectId;
  username: string;
  avatarUrl: string;
  comment: string;
  createdAt: Date;
  syncedToGitHub: boolean;
}

export interface IStory {
  id: string;
  title: string;
  description: string;
  source: 'manual' | 'github';
  githubIssueNumber?: number;
  githubRepoFullName?: string;
  comments?: IStoryComment[];
  status?: 'ready' | 'not-ready' | 'estimated';
  order?: number;
  labels?: string[];
  assignee?: string;
}

export interface IGitHubIntegration {
  repoOwner: string;
  repoName: string;
  projectNumber?: number;
  connectedAt: Date;
}

export interface ISession {
  _id: ObjectId;
  sessionId: string; // Unique shareable ID
  projectId: ObjectId; // Reference to Project (Phase 2)
  hostId: ObjectId; // Reference to User
  name: string;
  status: 'active' | 'archived';
  votingMode?: 'anonymous' | 'open'; // Phase 2
  participants: IParticipant[];
  currentStory?: IStory;
  stories: IStory[];
  githubIntegration?: IGitHubIntegration;
  createdAt: Date;
  updatedAt: Date;
}

// Estimate Types
export interface IVote {
  userId: ObjectId;
  username: string;
  value: number;
  comment?: string; // Optional rationale for the vote
  votedAt: Date;
}

export interface IEstimate {
  _id: ObjectId;
  sessionId: ObjectId;
  storyId: string;
  roundNumber: number;
  votes: IVote[];
  finalEstimate?: number;
  revealedAt?: Date;
  finalizedAt?: Date;
  createdAt: Date;
}

// Project Types (Phase 2)
export interface IProjectMember {
  userId: ObjectId;
  username: string;
  avatarUrl: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface IProjectSettings {
  defaultCardValues: 'fibonacci' | 'tshirt' | 'custom';
  customCardValues?: number[];
  defaultVotingMode: 'anonymous' | 'open';
  githubIntegration?: {
    defaultRepo?: string;
    defaultProject?: number;
  };
}

export interface IProject {
  _id: ObjectId;
  projectId: string; // Unique project identifier
  name: string;
  description: string;
  ownerId: ObjectId; // Reference to User (creator)
  members: IProjectMember[];
  settings: IProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Invitation Types (Phase 2)
export interface IInvitation {
  _id: ObjectId;
  projectId: ObjectId; // Reference to Project
  invitedBy: ObjectId; // Reference to User
  invitedUser?: ObjectId; // Reference to User (if registered)
  invitedEmail?: string; // Email if user not registered
  invitedGithubUsername?: string; // GitHub username
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string; // Unique invitation token
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

// Chat Message Types (Phase 2)
export interface IChatMessage {
  _id: ObjectId;
  sessionId: ObjectId; // Reference to Session
  userId: ObjectId; // Reference to User
  username: string;
  avatarUrl: string;
  message: string;
  type: 'text' | 'system'; // System messages for events
  createdAt: Date;
  updatedAt: Date;
}

// Permission Types
export type ProjectRole = 'owner' | 'admin' | 'member';

export interface IPermissionCheck {
  hasPermission: boolean;
  role?: ProjectRole;
  message?: string;
}

// GitHub Integration Types (re-exported from lib/github.ts for convenience)
export type {
  IRepository,
  IIssue,
  IProjectItem,
  IGitHubProject,
  IRateLimitInfo,
  GitHubAPIError,
  GitHubTokenInvalidError,
  GitHubRateLimitError,
} from '@/lib/github';

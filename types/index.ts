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
export interface IUser {
  _id: ObjectId;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken?: string; // Encrypted GitHub token for API access
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

export interface IStory {
  id: string;
  title: string;
  description: string;
  source: 'manual' | 'github';
  githubIssueNumber?: number;
  githubRepoFullName?: string;
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
  hostId: ObjectId; // Reference to User
  name: string;
  status: 'active' | 'archived';
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

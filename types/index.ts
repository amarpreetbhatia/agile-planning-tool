// Type definitions for the application
import { ObjectId } from 'mongoose';

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

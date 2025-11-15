# Voting Logic and State Management Implementation

This document describes the implementation of Task 14: Voting logic and state management for the Agile Estimation Planning Poker application.

## Overview

The voting system allows participants to cast and change votes for the current story in a planning poker session. The implementation includes:

1. Vote casting API route
2. Real-time vote status broadcasting via Socket.IO
3. Vote storage in the Estimate model
4. Voting status indicator component
5. Vote change functionality
6. Vote validation
7. Optimistic UI updates

## Components

### 1. API Route: `/api/sessions/[sessionId]/vote`

**File:** `app/api/sessions/[sessionId]/vote/route.ts`

**Method:** POST

**Request Body:**
```json
{
  "value": number // Card value (0, 1, 2, 3, 5, 8, 13, 21, -1, -2)
}
```

**Response:**
```json
{
  "success": true,
  "vote": {
    "value": number,
    "votedAt": Date,
    "isChange": boolean
  }
}
```

**Features:**
- Validates card values against allowed Fibonacci sequence
- Checks if session is active
- Verifies user is a participant
- Ensures there's an active story to vote on
- Prevents voting after round is revealed
- Supports both new votes and vote changes
- Broadcasts vote status to other participants via Socket.IO
- Stores votes with timestamps in the Estimate model

**Validation:**
- Valid card values: 0, 1, 2, 3, 5, 8, 13, 21, -1 (? - uncertain), -2 (☕ - break)
- Session must be active
- User must be a participant
- Story must be selected
- Round must not be revealed

### 2. API Route: `/api/sessions/[sessionId]/votes`

**File:** `app/api/sessions/[sessionId]/votes/route.ts`

**Method:** GET

**Response:**
```json
{
  "hasActiveRound": boolean,
  "voteStatus": {
    "[userId]": boolean
  },
  "currentUserVote": {
    "value": number,
    "votedAt": Date
  } | null
}
```

**Features:**
- Returns current voting status for all participants
- Returns current user's vote if they have voted
- Used for initial state hydration

### 3. Voting Status Component

**File:** `components/session/voting-status.tsx`

**Props:**
```typescript
interface VotingStatusProps {
  participants: IParticipant[];
  currentStory?: { id: string; title: string } | null;
  sessionId: string;
  className?: string;
}
```

**Features:**
- Displays list of participants with voting status
- Shows checkmark for participants who have voted
- Shows count of votes (e.g., "3 / 5")
- Updates in real-time via Socket.IO
- Fetches initial vote status from API
- Resets when story changes
- Only shows online participants

**UI Elements:**
- Participant avatars
- Voting indicators (CheckCircle2 / Circle icons)
- Vote count badge
- Progress description

### 4. Voting Hook

**File:** `hooks/use-voting.ts`

**Usage:**
```typescript
const { selectedValue, hasVoted, isVoting, castVote, changeVote } = useVoting({
  sessionId: 'session-123',
  currentStoryId: 'story-456',
  initialValue: null,
  initialHasVoted: false,
  onVoteSuccess: () => console.log('Vote cast!'),
});
```

**Features:**
- Manages voting state (selected value, has voted, is voting)
- Handles vote casting and changing
- Provides optimistic UI updates
- Shows toast notifications for success/error
- Resets state when story changes
- Supports initial state hydration

**State:**
- `selectedValue`: Currently selected card value
- `hasVoted`: Whether user has voted
- `isVoting`: Whether vote is being submitted

**Methods:**
- `castVote(value)`: Cast a new vote or change existing vote
- `changeVote(value)`: Alias for castVote (same functionality)

### 5. Session Voting Handler

**File:** `components/session/session-voting-handler.tsx`

**Props:**
```typescript
interface SessionVotingHandlerProps {
  sessionId: string;
  userId: string;
  isParticipant: boolean;
  initialStory?: IStory | null;
}
```

**Features:**
- Manages voting UI for the session page
- Listens for story selection events via Socket.IO
- Fetches initial voting status
- Renders PokerCardSelector via portal
- Resets voting state when story changes

**Integration:**
- Uses `useVoting` hook for state management
- Subscribes to `story:selected` Socket.IO events
- Renders into `#poker-card-selector-container` element

## Data Flow

### Casting a Vote

1. User selects a card in `PokerCardSelector`
2. `onCardSelect` callback triggers `castVote` from `useVoting` hook
3. Hook makes POST request to `/api/sessions/[sessionId]/vote`
4. API validates request and stores vote in database
5. API broadcasts vote status via Socket.IO to other participants
6. Hook updates local state optimistically
7. Toast notification confirms vote
8. Other participants receive Socket.IO event and update their UI

### Vote Status Updates

1. Component mounts and fetches initial vote status from `/api/sessions/[sessionId]/votes`
2. Component subscribes to `vote:cast` Socket.IO events
3. When any participant votes, all participants receive event
4. Components update their local vote status state
5. UI reflects updated voting status

### Story Changes

1. Host selects new story
2. Server broadcasts `story:selected` event via Socket.IO
3. All participants receive event
4. Components reset voting state
5. New voting round begins

## Socket.IO Events

### Client Emits

- `vote:cast`: Emitted by API after successful vote (not by client directly)
- `vote:change`: Emitted by API after successful vote change (not by client directly)

### Client Receives

- `vote:cast`: Broadcast when any participant votes
  - Payload: `(userId: string, hasVoted: boolean)`
  - Used to update voting status indicators

## Database Schema

### Estimate Model

```typescript
{
  sessionId: ObjectId,
  storyId: string,
  roundNumber: number,
  votes: [
    {
      userId: ObjectId,
      username: string,
      value: number,
      votedAt: Date
    }
  ],
  revealedAt?: Date,
  finalizedAt?: Date
}
```

**Indexes:**
- `sessionId`: For querying estimates by session
- `sessionId + roundNumber`: Compound index for round queries

**Vote Storage:**
- Each vote includes userId, username, value, and timestamp
- Votes can be updated before reveal
- Votes are immutable after reveal

## Validation Rules

1. **Card Values:** Must be one of: 0, 1, 2, 3, 5, 8, 13, 21, -1, -2
2. **Session Status:** Session must be active
3. **Participant Check:** User must be a participant in the session
4. **Active Story:** A story must be selected
5. **Round Status:** Round must not be revealed
6. **Vote Changes:** Allowed before reveal, blocked after reveal

## Error Handling

### API Errors

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User not a participant
- `404 Not Found`: Session or user not found
- `400 Bad Request`: Invalid card value, no active story, or round already revealed
- `500 Internal Server Error`: Database or server error

### Client Errors

- Toast notifications for all errors
- Graceful fallback if Socket.IO fails
- Retry logic for failed API requests

## Testing Considerations

### Unit Tests

- Vote validation logic
- Vote change detection
- State management in useVoting hook

### Integration Tests

- Vote casting API endpoint
- Vote status API endpoint
- Socket.IO event broadcasting

### E2E Tests

- Complete voting flow from card selection to status update
- Vote changes before reveal
- Multiple participants voting simultaneously
- Story change resets voting state

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 6.3:** Vote recording in database with timestamps ✓
- **Requirement 6.4:** Vote status indication to other participants ✓
- **Requirement 6.5:** Vote changes allowed before reveal ✓

## Future Enhancements

1. Vote history tracking
2. Vote analytics (average time to vote, etc.)
3. Vote reminders for participants who haven't voted
4. Bulk vote operations for testing
5. Vote export functionality

# Real-Time Participant Management

This document describes the real-time participant management feature implemented for the Agile Estimation Poker application.

## Features Implemented

### 1. Socket.IO Events for Participant Join/Leave

**Server Events (socket-server.ts):**
- `session:join` - Handles participant joining a session room
- `session:leave` - Handles participant leaving a session room
- `disconnect` - Handles participant disconnection

**Client Events:**
- `participant:joined` - Broadcast when a participant joins
- `participant:left` - Broadcast when a participant leaves

### 2. Participant Online Status Tracking

**Database Updates:**
- Participants have an `isOnline` boolean field
- Status is updated when:
  - User joins a session (set to `true`)
  - User leaves a session (set to `false`)
  - User disconnects from Socket.IO (set to `false`)

**API Endpoints:**
- `POST /api/sessions/[sessionId]/join` - Join session and update online status
- `POST /api/sessions/[sessionId]/leave` - Leave session and update online status

### 3. Real-Time Participant List Component

**Component: `RealTimeParticipantList`**
- Location: `components/session/real-time-participant-list.tsx`
- Features:
  - Displays all participants with avatars
  - Shows online/offline status with visual indicators
  - Real-time updates via Socket.IO events
  - Smooth animations for join/leave events

**Visual Indicators:**
- Green dot badge on avatar for online participants
- "Online" / "Offline" text status
- Host badge for session host
- Color-coded status text

### 4. Toast Notifications

**Notifications for:**
- Participant joined: Shows username and "joined the session" message
- Participant left: Shows username and "left the session" message
- Session join success: Confirms user joined the session

### 5. Participant Avatar Animations

**Framer Motion Animations:**
- **Slide In**: New participants slide in from the left (x: -20 → 0)
- **Slide Out**: Leaving participants slide out to the right (x: 0 → 20)
- **Fade**: Opacity transitions (0 → 1 for join, 1 → 0 for leave)
- **Online Badge**: Scale animation when status changes (scale: 0 → 1)

**Animation Configuration:**
- Duration: 300ms
- Mode: `popLayout` for smooth list reordering
- AnimatePresence for exit animations

### 6. Database Updates

**Session Model Updates:**
- Participants array includes `isOnline` field
- Online status persisted in MongoDB
- Updates happen on:
  - API calls (join/leave)
  - Socket.IO events (connect/disconnect)

## Usage

### For Session Participants

1. Navigate to a session page: `/sessions/[sessionId]`
2. The `SessionJoinHandler` automatically:
   - Calls the join API endpoint
   - Connects to Socket.IO
   - Joins the session room
3. The `RealTimeParticipantList` displays all participants with live updates

### For Developers

**Using the Real-Time Participant List:**

```tsx
import { RealTimeParticipantList } from '@/components/session/real-time-participant-list';

<RealTimeParticipantList
  initialParticipants={sessionData.participants}
  hostId={sessionData.hostId.toString()}
  sessionId={sessionData.sessionId}
/>
```

**Socket.IO Integration:**

```tsx
import { useSocket } from '@/hooks/use-socket';
import { joinSession, leaveSession } from '@/lib/socket';

const { socket, isConnected } = useSocket();

// Join session room
if (isConnected) {
  joinSession(sessionId);
}

// Leave session room
leaveSession(sessionId);
```

## Technical Details

### Socket.IO Flow

1. **Client connects** → Authentication middleware validates JWT token
2. **Client emits `session:join`** → Server adds socket to room and updates DB
3. **Server broadcasts `participant:joined`** → All other clients receive update
4. **Client disconnects** → Server updates DB and broadcasts `participant:left`

### Database Schema

```typescript
interface IParticipant {
  userId: ObjectId;
  username: string;
  avatarUrl: string;
  joinedAt: Date;
  isOnline: boolean; // ← Online status tracking
}
```

### Error Handling

- Socket.IO errors are caught and logged
- Failed broadcasts don't block API responses
- Reconnection handled automatically by Socket.IO client
- Toast notifications for user-facing errors

## Requirements Satisfied

✅ **Requirement 3.4**: When a participant joins, the system notifies all existing participants
✅ **Requirement 3.5**: The system displays all current participants to each session member
✅ **Requirement 9.1**: When any participant joins or leaves, the system broadcasts updates to all members

## Future Enhancements

- Typing indicators for active participants
- Participant presence heartbeat for more accurate online status
- Participant activity tracking (last seen, last action)
- Bulk participant management for hosts
- Participant permissions and roles

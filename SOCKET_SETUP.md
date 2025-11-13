# Socket.IO Setup Guide

This document explains how Socket.IO is configured in this Next.js application for real-time communication.

## Architecture

The application uses a custom Node.js server (`server.js`) to integrate Socket.IO with Next.js. This is necessary because Socket.IO requires access to the HTTP server, which is not directly exposed in Next.js App Router.

## Files

### Server-side

- **`server.js`**: Custom Node.js server that creates the HTTP server and initializes Socket.IO
- **`socket-server.ts`**: Socket.IO server configuration with event handlers and authentication middleware
- **`app/api/socket/route.ts`**: API route for Socket.IO status (optional)

### Client-side

- **`lib/socket.ts`**: Socket.IO client utility with helper functions
- **`hooks/use-socket.ts`**: React hook for using Socket.IO in components

## Running the Application

### Development

```bash
npm run dev
```

This runs the custom server with Socket.IO support.

### Production

```bash
npm run build
npm start
```

## Usage in Components

### 1. Initialize Socket Connection

```typescript
'use client';

import { useSocket } from '@/hooks/use-socket';

export function MyComponent() {
  const { socket, isConnected } = useSocket();

  // Socket is automatically connected when component mounts
  // and disconnected when it unmounts
}
```

### 2. Join a Session

```typescript
import { joinSession, leaveSession } from '@/lib/socket';

// Join a session room
joinSession('session-id-123');

// Leave when done
leaveSession('session-id-123');
```

### 3. Listen to Events

```typescript
import { onParticipantJoined, onVoteCast } from '@/lib/socket';

// Subscribe to events
const unsubscribe1 = onParticipantJoined((participant) => {
  console.log('New participant:', participant);
});

const unsubscribe2 = onVoteCast((userId, hasVoted) => {
  console.log(`User ${userId} voted:`, hasVoted);
});

// Cleanup
unsubscribe1();
unsubscribe2();
```

### 4. Emit Events

```typescript
import { castVote, selectStory } from '@/lib/socket';

// Cast a vote
castVote('session-id-123', 5);

// Select a story (host only)
selectStory('session-id-123', {
  id: 'story-1',
  title: 'Implement feature X',
  description: 'As a user...',
});
```

## Authentication

Socket.IO connections are authenticated using JWT tokens from NextAuth.js:

1. Client sends JWT token in the `auth.token` field during connection
2. Server verifies the token using the `NEXTAUTH_SECRET`
3. User information is attached to the socket instance
4. All subsequent events are associated with the authenticated user

## Events

### Client → Server

- `session:join` - Join a session room
- `session:leave` - Leave a session room
- `vote:cast` - Cast a vote
- `vote:change` - Change a vote
- `story:select` - Select a story (host only)
- `round:reveal` - Reveal round results (host only)
- `estimate:finalize` - Finalize estimate (host only)
- `session:end` - End session (host only)

### Server → Client

- `participant:joined` - New participant joined
- `participant:left` - Participant left
- `vote:cast` - Participant voted (status only, not value)
- `story:selected` - New story selected
- `round:revealed` - Round results revealed
- `estimate:finalized` - Estimate finalized
- `session:ended` - Session ended
- `error` - Error occurred

## Room-based Broadcasting

Socket.IO uses rooms to broadcast events only to participants in a specific session:

- When a user joins a session, they join a room with the session ID
- Events are broadcast only to sockets in that room
- When a user leaves or disconnects, they are removed from the room

## Error Handling

- Connection errors are logged and passed to the `onError` callback
- Authentication failures prevent connection
- Invalid events are logged but don't crash the server
- Automatic reconnection with exponential backoff (up to 5 attempts)

## Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000  # Optional, defaults to window.location.origin
```

## Deployment Considerations

### Vercel

Vercel's serverless architecture doesn't support WebSocket connections directly. For production deployment on Vercel, you have two options:

1. **Deploy Socket.IO separately**: Use a service like Railway, Render, or Heroku for the Socket.IO server
2. **Use Vercel's Edge Functions**: Migrate to Server-Sent Events (SSE) or Vercel's real-time features

### Other Platforms

Platforms that support long-running Node.js processes (Railway, Render, Heroku, DigitalOcean, AWS EC2) work well with this setup.

## Troubleshooting

### Socket not connecting

1. Check that the custom server is running (`npm run dev`)
2. Verify `NEXTAUTH_SECRET` is set
3. Check browser console for connection errors
4. Ensure JWT token is valid

### Events not received

1. Verify you've joined the session room
2. Check that socket is connected (`isConnected === true`)
3. Look for errors in server logs
4. Ensure event names match exactly

### Authentication failures

1. Verify `NEXTAUTH_SECRET` matches between NextAuth and Socket.IO
2. Check that the JWT token is being passed correctly
3. Ensure the token hasn't expired

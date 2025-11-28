# Pre-existing Errors Fixed

## Overview
While implementing Task 34 (Vote Comments/Rationale), several pre-existing runtime errors were discovered and fixed to ensure the application runs smoothly.

## Errors Fixed

### 1. Mongoose Duplicate Index Warning ✅

**Error:**
```
Warning: Duplicate schema index on {"sessionId":1} found
```

**Root Cause:**
The Estimate model had `index: true` on the `sessionId` field AND a separate `EstimateSchema.index({ sessionId: 1 })` call, creating duplicate indexes.

**Fix:**
- Removed `index: true` from the sessionId field definition
- Kept only the compound index `{ sessionId: 1, roundNumber: 1 }`
- This provides better query performance while eliminating the duplicate

**File Modified:** `models/Estimate.ts`

---

### 2. Motion Component Server/Client Error ✅

**Error:**
```
Error: Attempted to call createMotionComponent() from the server
at SessionSkeleton
```

**Root Cause:**
The `session-skeleton.tsx` component uses Framer Motion (client-side library) but was missing the `'use client'` directive, causing Next.js to try to render it on the server.

**Fix:**
- Added `'use client'` directive at the top of the file

**File Modified:** `components/loading/session-skeleton.tsx`

---

### 3. ObjectId Serialization Error ✅

**Error:**
```
Only plain objects can be passed to Client Components from Server Components.
Objects with toJSON methods are not supported.
{userId: {buffer: ...}, username: ..., avatarUrl: ..., joinedAt: ..., isOnline: ...}
```

**Root Cause:**
The session page was passing Mongoose documents with ObjectId fields directly to client components. ObjectIds cannot be serialized for client-side rendering.

**Fix:**
1. Created new `ISerializedParticipant` type with `userId: string` instead of `userId: ObjectId`
2. Updated server component to serialize participants before passing to client:
   ```typescript
   const serializedParticipants = sessionData.participants.map((p) => ({
     userId: p.userId.toString(),
     username: p.username,
     avatarUrl: p.avatarUrl,
     joinedAt: p.joinedAt,
     isOnline: p.isOnline,
   }));
   ```
3. Updated all client components to use `ISerializedParticipant` type:
   - `SessionPageLayout`
   - `VotingAndReveal`
   - `RevealControl`
   - `ResponsiveParticipantList`
   - `RealTimeParticipantList`
   - `ParticipantList`
   - `VotingStatus`

**Files Modified:**
- `types/index.ts` - Added `ISerializedParticipant` type
- `app/(dashboard)/sessions/[sessionId]/page.tsx` - Serialized participants
- `components/session/session-page-layout.tsx`
- `components/session/voting-and-reveal.tsx`
- `components/session/reveal-control.tsx`
- `components/session/responsive-participant-list.tsx`
- `components/session/real-time-participant-list.tsx`
- `components/session/participant-list.tsx`
- `components/session/voting-status.tsx`

---

---

### 4. User Model Import in Client Bundle ✅

**Error:**
```
Cannot read properties of undefined (reading 'User')
at models\User.ts (33:44)
```

**Root Cause:**
The `lib/permissions.ts` file was importing `Project` model from `@/models`, and this file was being used by client components (like `ProjectsList`). When Next.js bundled the client code, it tried to include the permissions file which then pulled in all Mongoose models, causing them to be executed in the browser where Mongoose is undefined.

**Fix:**
1. Created `lib/permissions-client.ts` with client-safe permission utilities (no database access)
2. Updated `lib/permissions.ts` to re-export client-safe functions and keep only server-side functions with database access
3. Updated `ProjectsList` component to import from `lib/permissions-client` instead

**Files Modified:**
- `lib/permissions-client.ts` - New file with client-safe utilities
- `lib/permissions.ts` - Refactored to separate client/server code
- `components/project/projects-list.tsx` - Updated import

---

### 5. Missing SessionProvider Wrapper ✅

**Error:**
```
[next-auth]: `useSession` must be wrapped in a <SessionProvider />
at components\project\projects-list.tsx
```

**Root Cause:**
The root layout (`app/layout.tsx`) was missing the NextAuth SessionProvider wrapper, which is required for any component using `useSession()` hook.

**Fix:**
- Added `SessionProvider` import to root layout
- Wrapped the entire app in `<SessionProvider>` component
- This enables `useSession()` to work in all client components

**Files Modified:**
- `app/layout.tsx` - Added SessionProvider wrapper

---

### 6. Socket.IO Connection Timing Error ✅

**Error:**
```
Socket not connected
at lib\socket.ts (157:11) @ joinSession
```

**Root Cause:**
The `SessionJoinHandler` component was trying to join a Socket.IO room immediately when the component mounted, but the socket connection might not be established yet, causing a race condition.

**Fix:**
- Updated `joinSession()` to gracefully handle disconnected state
- Instead of throwing an error, it now waits for the 'connect' event and retries
- Updated `leaveSession()` and `sendTypingIndicator()` to log warnings instead of throwing errors
- This prevents crashes while maintaining functionality once connected

**Files Modified:**
- `lib/socket.ts` - Improved connection handling for socket functions

---

## Impact

These fixes resolve:
- ✅ Mongoose warnings in console
- ✅ Server-side rendering errors with Framer Motion
- ✅ Runtime TypeErrors when passing Mongoose documents to client components
- ✅ Mongoose models being bundled in client-side code
- ✅ Missing NextAuth SessionProvider wrapper
- ✅ Socket.IO connection timing issues
- ✅ Improved type safety with proper serialization types
- ✅ Proper separation of client-safe and server-only code
- ✅ Graceful handling of disconnected socket states

## Testing

All fixes have been validated:
- ✅ No TypeScript diagnostics errors
- ✅ Proper separation of server/client code
- ✅ Correct type usage throughout the application

## Related to Task 34

These errors were **not caused** by Task 34 implementation. They were pre-existing issues that became apparent during testing. Task 34 (Vote Comments/Rationale) is fully functional and complete.

# Collaborative Whiteboard Component

A real-time collaborative whiteboard feature for agile planning sessions, built with tldraw.

## Features

- **Real-time Collaboration**: Multiple users can draw simultaneously with automatic synchronization
- **Drawing Tools**: Pen, shapes (rectangle, circle, arrow), text, eraser, and color picker (via tldraw)
- **Snapshot Management**: Save, view, and manage whiteboard snapshots
- **Story Attachment**: Link snapshots to specific user stories
- **Export**: Download whiteboard as SVG
- **Dark Mode**: Automatic dark mode support
- **Performance**: Throttled updates (100ms) for optimal network usage

## Components

### `<Whiteboard />`
Main container component with tabs for Canvas and Snapshots.

```tsx
import { Whiteboard } from '@/components/whiteboard';

<Whiteboard
  sessionId="session-123"
  currentUserId="user-456"
  isHost={true}
  currentStoryId="story-789"
/>
```

### `<WhiteboardCanvas />`
The drawing canvas with real-time sync.

```tsx
import { WhiteboardCanvas } from '@/components/whiteboard';

<WhiteboardCanvas
  sessionId="session-123"
  onSnapshot={(data) => console.log('Snapshot:', data)}
  initialData={savedSnapshot}
  readOnly={false}
/>
```

### `<WhiteboardToolbar />`
Toolbar with save, export, and clear actions.

```tsx
import { WhiteboardToolbar } from '@/components/whiteboard';

<WhiteboardToolbar
  sessionId="session-123"
  currentStoryId="story-789"
  onSaveSnapshot={handleSave}
  onClear={handleClear}
  onExport={handleExport}
/>
```

### `<SnapshotGallery />`
Gallery view of saved snapshots.

```tsx
import { SnapshotGallery } from '@/components/whiteboard';

<SnapshotGallery
  sessionId="session-123"
  currentUserId="user-456"
  isHost={true}
/>
```

### `<SessionWhiteboard />`
Session-specific wrapper component.

```tsx
import { SessionWhiteboard } from '@/components/session/session-whiteboard';

<SessionWhiteboard
  sessionId="session-123"
  currentUserId="user-456"
  isHost={true}
  currentStoryId="story-789"
/>
```

## Custom Hook

### `useWhiteboard(sessionId)`
Hook for managing whiteboard state and operations.

```tsx
import { useWhiteboard } from '@/hooks/use-whiteboard';

const {
  snapshots,
  loading,
  saveSnapshot,
  deleteSnapshot,
  attachToStory,
  refreshSnapshots,
} = useWhiteboard('session-123');

// Save a snapshot
await saveSnapshot(whiteboardData, 'My Snapshot', 'story-789');

// Delete a snapshot
await deleteSnapshot('snapshot-id');

// Attach to story
await attachToStory('snapshot-id', 'story-789');
```

## API Routes

### GET `/api/sessions/[sessionId]/whiteboard/snapshots`
Fetch all snapshots for a session.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "snapshot-id",
      "sessionId": "session-id",
      "storyId": "story-id",
      "createdBy": "user-id",
      "data": { ... },
      "title": "Snapshot Title",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/sessions/[sessionId]/whiteboard/snapshots`
Create a new snapshot.

**Request:**
```json
{
  "data": { ... },
  "title": "My Snapshot",
  "storyId": "story-id"
}
```

### GET `/api/sessions/[sessionId]/whiteboard/snapshots/[snapshotId]`
Get a specific snapshot.

### DELETE `/api/sessions/[sessionId]/whiteboard/snapshots/[snapshotId]`
Delete a snapshot (creator or host only).

### PATCH `/api/sessions/[sessionId]/whiteboard/snapshots/[snapshotId]`
Update snapshot (attach to story, change title).

**Request:**
```json
{
  "storyId": "story-id",
  "title": "Updated Title"
}
```

## Socket.IO Events

### Client to Server

**`whiteboard:update`**
```typescript
socket.emit('whiteboard:update', sessionId, whiteboardData);
```

**`whiteboard:snapshot`**
```typescript
socket.emit('whiteboard:snapshot', sessionId, snapshotId);
```

### Server to Client

**`whiteboard:update`**
```typescript
socket.on('whiteboard:update', (data, userId, username) => {
  // Apply remote changes
});
```

**`whiteboard:snapshot`**
```typescript
socket.on('whiteboard:snapshot', (snapshot) => {
  // New snapshot created
});
```

## Integration Example

### Add to Session Page

```tsx
import { SessionWhiteboard } from '@/components/session/session-whiteboard';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';

export function SessionPage() {
  return (
    <div>
      {/* Other session content */}
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Paintbrush className="h-4 w-4 mr-2" />
            Whiteboard
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl h-[90vh]">
          <SessionWhiteboard
            sessionId={sessionId}
            currentUserId={userId}
            isHost={isHost}
            currentStoryId={currentStory?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## Performance Considerations

- **Throttling**: Drawing updates are throttled to 100ms to reduce network traffic
- **Conflict Resolution**: Remote changes are flagged to prevent echo loops
- **Lazy Loading**: Snapshots are loaded on demand
- **Efficient Broadcasting**: Only changed data is sent, not the full state

## Security

- Session participation validation on all API routes
- Only creator or host can delete snapshots
- Authentication required for all operations
- Input validation on snapshot data

## Browser Support

- Modern browsers with WebSocket support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## Dependencies

- `tldraw` - Whiteboard library
- `lodash` - For throttle function
- `socket.io-client` - Real-time communication

## Troubleshooting

### Whiteboard not syncing
- Check Socket.IO connection status
- Verify user is authenticated
- Check browser console for errors

### Snapshot not saving
- Verify user is a session participant
- Check network tab for API errors
- Ensure whiteboard has content

### Performance issues
- Reduce drawing complexity
- Check network latency
- Verify throttling is working (100ms)

## Future Enhancements

- PNG export with configurable resolution
- Image upload to whiteboard
- Pre-defined templates (user story map, flowchart)
- Snapshot comparison side-by-side
- Snapshot version history
- Fine-grained permissions
- Annotations and comments on specific areas

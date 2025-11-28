# Task 31 Implementation: Update Session Creation to Use Projects

## Overview
This task integrates project management with session creation, ensuring that all sessions are associated with a project and that users have appropriate permissions to create sessions.

## Changes Made

### 1. Updated Data Models

#### types/index.ts
- Added `projectId: ObjectId` field to `ISession` interface
- Added `votingMode?: 'anonymous' | 'open'` field to `ISession` interface for Phase 2 voting modes

#### models/Session.ts
- Added `projectId` field to Session schema (required, references Project model)
- Added `votingMode` field to Session schema (optional, enum: 'anonymous' | 'open')
- Added index on `projectId` field for query performance

### 2. Updated Session Creation API

#### app/api/sessions/route.ts

**POST /api/sessions**
- Now requires `projectId` in request body
- Validates that the project exists
- Checks user permissions using `checkPermission` from `@/lib/permissions`
- Users must be at least a 'member' of the project to create sessions
- Applies project settings (default voting mode) to new sessions
- Returns 403 if user lacks permission

**GET /api/sessions**
- Fetches user's projects to filter sessions
- Only returns sessions from projects where user is a member
- Supports optional `projectId` query parameter to filter by specific project
- Populates project information (name, projectId) in response
- Returns `projectName` and `projectId` for each session

### 3. Updated Session Creation UI

#### components/session/session-create-form.tsx
- Added project selection dropdown
- Fetches user's projects on component mount
- Pre-selects project if `projectId` query parameter is provided
- Shows loading state while fetching projects
- Shows "No Projects Available" message if user has no projects
- Provides link to create a new project if none exist
- Validates that a project is selected before allowing session creation
- Disables submit button until both name and project are selected

### 4. Updated Session Display Components

#### components/session/session-card.tsx
- Added `projectName?: string` prop
- Displays project name with folder icon below session name
- Shows project information in card description area

#### components/session/session-list.tsx
- Updated `Session` interface to include `projectName?: string`
- Passes `projectName` prop to `SessionCard` component

### 5. Updated Project Dashboard

#### components/project/project-dashboard.tsx
- Added session fetching functionality
- Displays recent sessions for the project
- Shows loading state while fetching sessions
- Shows "No sessions yet" message if project has no sessions
- Displays sessions in a grid using `SessionCard` component
- Fetches current user ID to determine if user is session host
- Filters sessions by project ID using API query parameter

### 6. Session Creation Flow

The updated flow now works as follows:

1. User navigates to create session page (optionally with `?projectId=xxx` parameter)
2. Form loads and fetches user's projects
3. If projectId parameter exists, pre-selects that project
4. User selects a project (or it's pre-selected)
5. User enters session name
6. On submit:
   - Validates project selection and session name
   - Sends POST request with `name` and `projectId`
   - API validates project exists and user has permission
   - API applies project settings (voting mode) to session
   - Session is created and user is redirected to session page

### 7. Project Dashboard Integration

Projects now show their associated sessions:

1. Project dashboard fetches sessions filtered by project ID
2. Displays sessions in a grid layout
3. Shows session count and status
4. "New Session" button pre-fills project selection

## Requirements Validated

- ✅ **11.5**: Sessions are now associated with projects
- ✅ **13.3**: Permission validation ensures only project members can create sessions
- ✅ **13.4**: Project settings (voting mode) are applied to new sessions

## API Changes

### POST /api/sessions
**Request Body:**
```json
{
  "name": "Sprint 24 Planning",
  "projectId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "sessionId": "abc12345",
  "name": "Sprint 24 Planning",
  "projectId": "507f1f77bcf86cd799439011",
  "hostId": "507f1f77bcf86cd799439012",
  "status": "active",
  "votingMode": "anonymous",
  "participants": [...],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/sessions
**Query Parameters:**
- `status`: Filter by session status (default: 'active')
- `projectId`: Filter by specific project ID (optional)

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "abc12345",
      "name": "Sprint 24 Planning",
      "projectId": "507f1f77bcf86cd799439011",
      "projectName": "My Project",
      "hostId": "507f1f77bcf86cd799439012",
      "status": "active",
      "votingMode": "anonymous",
      "participantCount": 5,
      "participants": [...],
      "currentStory": {...},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Database Schema Changes

### Session Collection
```typescript
{
  _id: ObjectId,
  sessionId: string,
  projectId: ObjectId,  // NEW - Required reference to Project
  hostId: ObjectId,
  name: string,
  status: 'active' | 'archived',
  votingMode: 'anonymous' | 'open',  // NEW - Optional voting mode
  participants: [...],
  currentStory: {...},
  stories: [...],
  githubIntegration: {...},
  createdAt: Date,
  updatedAt: Date
}
```

### New Index
- `projectId`: Index for efficient project-based session queries

## Migration Notes

**IMPORTANT**: Existing sessions in the database will need to be migrated to include a `projectId` field. This can be done by:

1. Creating a default project for existing sessions
2. Assigning all existing sessions to that project
3. Or requiring manual assignment of sessions to projects

Example migration script:
```javascript
// Create a default project
const defaultProject = await Project.create({
  projectId: 'default',
  name: 'Legacy Sessions',
  description: 'Migrated sessions from before project implementation',
  ownerId: adminUserId,
  members: [...],
  settings: {
    defaultCardValues: 'fibonacci',
    defaultVotingMode: 'anonymous'
  }
});

// Update all sessions without projectId
await Session.updateMany(
  { projectId: { $exists: false } },
  { $set: { projectId: defaultProject._id } }
);
```

## Testing Recommendations

1. **Permission Testing**
   - Verify only project members can create sessions
   - Verify non-members receive 403 error
   - Verify project owners, admins, and members can all create sessions

2. **Project Settings Application**
   - Verify voting mode is applied from project settings
   - Verify custom card values are available (future enhancement)

3. **UI Testing**
   - Verify project dropdown loads correctly
   - Verify pre-selection from query parameter works
   - Verify "no projects" state displays correctly
   - Verify project name displays on session cards

4. **API Testing**
   - Test session creation with valid project
   - Test session creation with invalid project
   - Test session creation without permission
   - Test session filtering by project

## Future Enhancements

1. **Bulk Session Management**
   - Move multiple sessions between projects
   - Archive all sessions in a project

2. **Project Templates**
   - Create session templates per project
   - Quick-create sessions from templates

3. **Project Analytics**
   - Session count per project
   - Average estimates per project
   - Team velocity tracking

4. **Advanced Permissions**
   - Restrict session creation to admins only (project setting)
   - Allow guests to join but not create sessions

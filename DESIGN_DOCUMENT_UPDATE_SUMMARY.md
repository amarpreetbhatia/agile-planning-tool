# Design Document Update Summary - Phase 2

## ✅ Design Document Successfully Updated!

The design document (`.kiro/specs/agile-estimation-poker/design.md`) has been comprehensively updated with all Phase 2 features. You can now start implementing tasks using Kiro's spec-driven approach!

---

## 📋 What Was Added

### 1. New Data Models (5 new models)

#### Project Management
- **IProject**: Project structure with members and settings
- **IProjectMember**: Team member with role (owner/admin/member)
- **IProjectSettings**: Default card values, voting mode, GitHub defaults
- **IInvitation**: Invitation system with token and expiration

#### Communication
- **IChatMessage**: Session chat messages
- **IStoryComment**: Comments on stories (embedded in IStory)
- **Updated IVote**: Added optional comment field for vote rationale

#### Notifications
- **INotification**: In-app notifications with types and expiration
- **INotificationPreferences**: User email and in-app preferences (added to IUser)

#### Whiteboard
- **IWhiteboardSnapshot**: Whiteboard snapshots with story attachment
- **IExternalEmbed**: External tool embeds (Miro, Figma, etc.)

### 2. Updated Existing Models

#### ISession (Enhanced)
```typescript
interface ISession {
  // ... existing fields ...
  projectId: ObjectId            // NEW: Reference to Project
  votingMode: 'anonymous' | 'open'  // NEW: Voting mode
  externalEmbeds: IExternalEmbed[]  // NEW: External tool embeds
}
```

#### IStory (Enhanced)
```typescript
interface IStory {
  // ... existing fields ...
  status: 'ready' | 'not-ready' | 'estimated'  // NEW: Story status
  order: number                   // NEW: Backlog ordering
  comments: IStoryComment[]       // NEW: Story comments
  labels?: string[]               // NEW: Story labels
  assignee?: string               // NEW: Story assignee
}
```

#### IUser (Enhanced)
```typescript
interface IUser {
  // ... existing fields ...
  notificationPreferences: INotificationPreferences  // NEW: Notification settings
}
```

### 3. New MongoDB Collections (5 collections)

- **projects**: Project management with members and settings
- **invitations**: Invitation system with tokens
- **chatMessages**: Session chat history
- **notifications**: User notifications
- **whiteboardSnapshots**: Whiteboard snapshots

### 4. New Indexes (12 indexes)

- `projects.projectId`: Unique project lookup
- `projects.ownerId`: Owner queries
- `projects.members.userId`: Member queries
- `invitations.projectId`: Project invitations
- `invitations.token`: Invitation token lookup
- `invitations.expiresAt`: Expiration cleanup
- `chatMessages.sessionId`: Session chat queries
- `chatMessages.createdAt`: Chronological ordering
- `notifications.userId`: User notifications
- `notifications.read`: Unread notifications
- `notifications.expiresAt`: Expiration cleanup
- `sessions.projectId`: Project sessions

### 5. Enhanced Socket.IO Events

#### New Client → Server Events
- `chat:message`: Send chat message
- `chat:typing`: Typing indicator
- `story:comment`: Add story comment
- `vote:cast`: Cast vote with optional comment
- `round:revote`: Start re-vote
- `whiteboard:update`: Update whiteboard
- `whiteboard:snapshot`: Save snapshot

#### New Server → Client Events
- `chat:message`: Broadcast chat message
- `chat:typing`: Broadcast typing status
- `story:comment`: Broadcast story comment
- `vote:status`: Enhanced voting status
- `round:revote`: Broadcast re-vote
- `vote:reminder`: Send voting reminder
- `whiteboard:update`: Broadcast whiteboard changes
- `whiteboard:snapshot`: Broadcast snapshot
- `notification:new`: New notification

### 6. API Routes (40+ new routes)

#### Projects (5 routes)
- POST /api/projects
- GET /api/projects
- GET /api/projects/[projectId]
- PATCH /api/projects/[projectId]
- DELETE /api/projects/[projectId]

#### Project Members (4 routes)
- GET /api/projects/[projectId]/members
- POST /api/projects/[projectId]/members
- PATCH /api/projects/[projectId]/members/[userId]
- DELETE /api/projects/[projectId]/members/[userId]

#### Invitations (6 routes)
- POST /api/projects/[projectId]/invitations
- GET /api/projects/[projectId]/invitations
- DELETE /api/projects/[projectId]/invitations/[invitationId]
- POST /api/invitations/[invitationId]/accept
- POST /api/invitations/[invitationId]/decline
- GET /api/invitations/me

#### Session Chat (2 routes)
- POST /api/sessions/[sessionId]/messages
- GET /api/sessions/[sessionId]/messages

#### Story Comments (2 routes)
- POST /api/sessions/[sessionId]/stories/[storyId]/comments
- GET /api/sessions/[sessionId]/stories/[storyId]/comments

#### Voting Enhancements (2 routes)
- POST /api/sessions/[sessionId]/revote
- GET /api/sessions/[sessionId]/vote-history

#### Backlog Management (3 routes)
- PATCH /api/sessions/[sessionId]/stories/order
- PATCH /api/sessions/[sessionId]/stories/[storyId]/status
- POST /api/sessions/[sessionId]/stories/bulk

#### Notifications (6 routes)
- GET /api/notifications
- PATCH /api/notifications/[notificationId]/read
- DELETE /api/notifications/[notificationId]
- PATCH /api/notifications/read-all
- GET /api/notifications/preferences
- PATCH /api/notifications/preferences

#### Whiteboard (3 routes)
- POST /api/sessions/[sessionId]/whiteboard/snapshot
- GET /api/sessions/[sessionId]/whiteboard/snapshots
- POST /api/sessions/[sessionId]/whiteboard/attach

#### External Embeds (3 routes)
- POST /api/sessions/[sessionId]/embeds
- GET /api/sessions/[sessionId]/embeds
- DELETE /api/sessions/[sessionId]/embeds/[embedId]

### 7. Updated Application Structure

#### New Directories
- `app/(dashboard)/projects/` - Project management pages
- `app/(dashboard)/notifications/` - Notifications page
- `app/api/projects/` - Project API routes
- `app/api/invitations/` - Invitation API routes
- `app/api/notifications/` - Notification API routes
- `components/project/` - Project components
- `components/notifications/` - Notification components
- `components/whiteboard/` - Whiteboard components
- `models/` - 5 new model files
- `hooks/` - 3 new custom hooks

### 8. New Error Codes (11 codes)

- PROJECT_NOT_FOUND
- NOT_PROJECT_OWNER
- NOT_PROJECT_ADMIN
- NOT_PROJECT_MEMBER
- INSUFFICIENT_PERMISSIONS
- INVITATION_NOT_FOUND
- INVITATION_EXPIRED
- INVITATION_ALREADY_RESPONDED
- USER_ALREADY_MEMBER
- MAX_REVOTES_REACHED
- MESSAGE_TOO_LONG
- CHAT_DISABLED
- NOTIFICATION_NOT_FOUND
- INVALID_INPUT
- MISSING_REQUIRED_FIELD

### 9. New Environment Variables (8 variables)

- EMAIL_SERVICE
- EMAIL_API_KEY
- EMAIL_FROM
- EMAIL_FROM_NAME
- APP_URL
- APP_NAME
- ENABLE_WHITEBOARD
- ENABLE_EXTERNAL_EMBEDS
- ENABLE_EMAIL_NOTIFICATIONS

### 10. New Library Files

- `lib/email.ts` - Email service integration
- `lib/permissions.ts` - Permission validation utilities

### 11. New Custom Hooks

- `use-chat.tsx` - Chat functionality
- `use-notifications.tsx` - Notification management
- `use-whiteboard.tsx` - Whiteboard integration

---

## 🎯 What This Enables

### You Can Now Implement:

✅ **Task 28**: Project data model and API
- All data models defined
- API routes specified
- Permission system designed

✅ **Task 29**: Project management UI
- Component structure defined
- Page layouts specified
- User flows designed

✅ **Task 30**: Team member management
- Invitation system designed
- API routes defined
- UI components specified

✅ **Task 31**: Update sessions to use projects
- Session model updated
- Integration points defined

✅ **Task 32**: Session chat system
- Chat model defined
- Socket.IO events specified
- API routes designed

✅ **Task 33**: Story comments
- Comment model defined
- GitHub sync designed
- UI components specified

✅ **Task 34**: Vote comments/rationale
- Vote model updated
- UI integration designed

✅ **Task 35-37**: Enhanced voting UX
- Voting modes defined
- Re-voting system designed
- Status indicators specified

✅ **Task 38-39**: Backlog management
- Story status system defined
- Bulk operations designed
- Drag-and-drop specified

✅ **Task 40-41**: Notifications
- Notification system designed
- Email integration specified
- In-app notifications defined

✅ **Task 42-43**: Visual collaboration
- Whiteboard system designed
- External embeds specified
- Snapshot system defined

---

## 🚀 How to Start Implementing

### Step 1: Verify Design Document
```bash
# Open and review the updated design document
.kiro/specs/agile-estimation-poker/design.md
```

### Step 2: Open Tasks File
```bash
# Open the Phase 2 tasks file
.kiro/specs/agile-estimation-poker/tasks-phase2.md
```

### Step 3: Start First Task
1. Click "Start task" next to **Task 28.1: Create Project model with schema**
2. Kiro will read:
   - Requirements 11, 12, 13, 14
   - Design document (IProject, IProjectMember, IProjectSettings)
   - Task details
3. Kiro will implement:
   - Project model file
   - Schema validation
   - Indexes
   - TypeScript interfaces

### Step 4: Continue Systematically
- Complete Task 28 fully (all sub-tasks)
- Move to Task 29
- Continue through Phase 2A, 2B, 2C, etc.

---

## 📊 Design Document Statistics

### Before Phase 2
- **Models**: 3 (User, Session, Estimate)
- **Collections**: 3
- **API Routes**: ~15
- **Socket.IO Events**: ~8
- **Error Codes**: 9

### After Phase 2
- **Models**: 8 (+5 new)
- **Collections**: 8 (+5 new)
- **API Routes**: 55+ (+40 new)
- **Socket.IO Events**: 20+ (+12 new)
- **Error Codes**: 24 (+15 new)
- **Indexes**: 17 (+12 new)

### Lines Added
- **~500 lines** of comprehensive design specifications
- **Complete data model definitions**
- **Full API route documentation**
- **Enhanced Socket.IO event system**
- **Comprehensive error handling**

---

## ✨ Key Design Decisions

### 1. Project-Centric Architecture
- Sessions belong to projects
- Projects have members with roles
- Settings cascade from project to session

### 2. Role-Based Access Control
- Three roles: Owner, Admin, Member
- Granular permissions per action
- Validated server-side

### 3. Real-time First
- Chat via Socket.IO
- Whiteboard via Socket.IO
- Notifications via Socket.IO
- Optimistic UI updates

### 4. Flexible Notification System
- Email + In-app notifications
- User preferences per type
- Auto-expiration after 30 days

### 5. Extensible Whiteboard
- Library-agnostic design
- Snapshot system
- Story attachment
- External tool embedding

### 6. Enhanced Voting
- Anonymous vs Open modes
- Re-voting with history
- Vote comments/rationale
- Status indicators

### 7. Backlog Management
- Drag-and-drop ordering
- Story status tracking
- Bulk operations
- Filtering and search

---

## 🔍 What to Review

Before starting implementation, review these sections:

### Critical Sections
1. **Components and Interfaces** (Section 5-9)
   - Understand all new data models
   - Review relationships between models
   - Check field types and validations

2. **API Routes** (New section)
   - Understand all endpoints
   - Review request/response formats
   - Check authorization requirements

3. **Socket.IO Events** (Section 9)
   - Understand event flow
   - Review client-server communication
   - Check real-time requirements

4. **Error Handling** (Updated section)
   - Review new error codes
   - Understand error scenarios
   - Check error recovery strategies

### Optional Sections
5. **Application Structure**
   - See where files should go
   - Understand directory organization

6. **Environment Variables**
   - Know what configuration is needed
   - Plan for email service setup

---

## 💡 Tips for Implementation

### 1. Start with Data Models
- Implement all models first (Task 28.1)
- Test schema validation
- Verify indexes work

### 2. Build API Routes Next
- Implement CRUD operations (Task 28.2)
- Test with Postman/Thunder Client
- Verify authorization

### 3. Add UI Components
- Build forms and lists (Task 29)
- Test responsive layouts
- Verify user flows

### 4. Integrate Real-time
- Add Socket.IO events (Task 32)
- Test with multiple clients
- Verify synchronization

### 5. Test Incrementally
- Test each sub-task
- Don't move forward with bugs
- Use implementation docs

---

## 🎉 You're Ready!

The design document is now complete and comprehensive. You have:

✅ **Clear data models** for all features
✅ **Defined API routes** for all operations
✅ **Specified Socket.IO events** for real-time
✅ **Documented error handling** for all scenarios
✅ **Planned UI components** for all pages
✅ **Designed permission system** for security

**Next Step**: Open `tasks-phase2.md` and click "Start task" on Task 28.1!

---

*Design document updated successfully! Ready for Phase 2 implementation.* 🚀

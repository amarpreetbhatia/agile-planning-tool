# Implementation Plan - Phase 2: Enhanced Collaboration Features

This document contains the implementation tasks for the enhanced collaboration features including project management, in-session communication, improved voting UX, backlog management, notifications, and visual collaboration.

---

## Phase 2A: Project & Team Organization (Priority: P0)

### Task 28. Implement project data model and API

- [ ] 28.1 Create Project model with schema
  - Define Project schema with name, description, owner, settings
  - Add team members array with role (owner, admin, member)
  - Add project settings (default card values, voting mode, GitHub defaults)
  - Create indexes for projectId and owner
  - _Requirements: 11.2, 11.6, 12.5_

- [ ] 28.2 Create project CRUD API routes
  - POST /api/projects - Create new project
  - GET /api/projects - List user's projects
  - GET /api/projects/[projectId] - Get project details
  - PATCH /api/projects/[projectId] - Update project settings
  - DELETE /api/projects/[projectId] - Delete project (owner only)
  - _Requirements: 11.1, 11.2, 11.3, 12.1_

- [ ] 28.3 Implement role-based access control middleware
  - Create permission validation utility
  - Implement role checking (owner, admin, member)
  - Add authorization middleware for API routes
  - Validate permissions before project operations
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

### Task 29. Build project management UI

- [ ] 29.1 Create project creation flow
  - Build project creation form with name and description
  - Add project settings configuration (card values, voting mode)
  - Implement project creation API call
  - Redirect to project dashboard after creation
  - _Requirements: 11.1, 11.2, 11.3, 12.2, 12.3_

- [ ] 29.2 Build project list and dashboard
  - Create projects list page showing owned and member projects
  - Display project cards with member count and recent activity
  - Add role badges (Owner, Admin, Member)
  - Implement project filtering and search
  - _Requirements: 11.5_

- [ ] 29.3 Create project settings page
  - Build settings form for card values configuration
  - Add voting mode selector (anonymous/open)
  - Implement GitHub integration defaults
  - Add save and cancel actions
  - Restrict access to owners and admins
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

### Task 30. Implement team member management

- [ ] 30.1 Create invitation system API
  - POST /api/projects/[projectId]/invitations - Send invitation
  - GET /api/projects/[projectId]/invitations - List pending invitations
  - POST /api/invitations/[invitationId]/accept - Accept invitation
  - POST /api/invitations/[invitationId]/decline - Decline invitation
  - DELETE /api/projects/[projectId]/members/[userId] - Remove member
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 30.2 Build team member management UI
  - Create team members list with avatars and roles
  - Add invite member dialog with GitHub username/email input
  - Display pending invitations with status
  - Implement role assignment dropdown (admin/member)
  - Add remove member confirmation dialog
  - _Requirements: 14.1, 14.2, 14.5_

- [ ] 30.3 Create invitation acceptance flow
  - Build invitation notification component
  - Create accept/decline invitation UI
  - Implement invitation acceptance API calls
  - Show success/error feedback
  - Update project list after acceptance
  - _Requirements: 14.3, 14.4_

### Task 31. Update session creation to use projects

- [ ] 31.1 Modify session model to include projectId
  - Add projectId field to Session schema
  - Add project reference and validation
  - Update session creation to require project selection
  - Migrate existing sessions to default project (if needed)
  - _Requirements: 11.5, 13.4_

- [ ] 31.2 Update session creation UI
  - Add project selector to session creation form
  - Filter projects by user's membership
  - Apply project settings to new session
  - Validate user has permission to create session
  - _Requirements: 11.5, 13.3, 13.4_

- [ ] 31.3 Update session list to show by project
  - Group sessions by project in dashboard
  - Add project filter to session list
  - Display project name on session cards
  - Show only sessions from user's projects
  - _Requirements: 11.5_

---

## Phase 2B: In-Session Communication (Priority: P0)

### Task 32. Implement session chat system

- [ ] 32.1 Create chat message model and API
  - Create ChatMessage model with sessionId, userId, message, timestamp
  - POST /api/sessions/[sessionId]/messages - Send message
  - GET /api/sessions/[sessionId]/messages - Get message history
  - Add message validation and sanitization
  - _Requirements: 15.2, 15.3, 15.5_

- [ ] 32.2 Implement Socket.IO chat events
  - Add 'chat:message' client-to-server event
  - Add 'chat:message' server-to-client broadcast
  - Add 'chat:typing' event for typing indicators
  - Implement message persistence on server
  - _Requirements: 15.2, 15.4_

- [ ] 32.3 Build chat UI component
  - Create chat panel with message list
  - Add message input with send button
  - Display messages with author avatar and timestamp
  - Implement auto-scroll to latest message
  - Add typing indicators
  - _Requirements: 15.1, 15.3, 15.4_

- [ ] 32.4 Add chat to session layout
  - Integrate chat panel into session page
  - Make chat collapsible on mobile
  - Position chat in sidebar on desktop
  - Add unread message indicator
  - Persist chat open/closed state
  - _Requirements: 15.1_

### Task 33. Implement story comments

- [ ] 33.1 Create story comment model and API
  - Add comments array to Story schema
  - POST /api/sessions/[sessionId]/stories/[storyId]/comments - Add comment
  - GET /api/sessions/[sessionId]/stories/[storyId]/comments - Get comments
  - Store comment with userId, username, text, timestamp
  - _Requirements: 16.2, 16.4_

- [ ] 33.2 Build story comments UI
  - Create comments section below story display
  - Add comment input with submit button
  - Display comments with author and timestamp
  - Implement real-time comment updates via Socket.IO
  - _Requirements: 16.1, 16.2, 16.3_

- [ ] 33.3 Implement GitHub comment sync
  - Add GitHub API call to post comment on issue
  - Sync story comments to GitHub when story is from GitHub
  - Handle GitHub API errors gracefully
  - Add sync status indicator
  - _Requirements: 16.5_

### Task 34. Implement vote comments/rationale

- [ ] 34.1 Add comment field to vote model
  - Update IVote interface to include optional comment field
  - Modify vote API to accept comment parameter
  - Store vote comments in Estimate model
  - _Requirements: 17.1, 17.5_

- [ ] 34.2 Update voting UI to include comments
  - Add optional comment textarea to card selection
  - Show character limit (e.g., 200 chars)
  - Save comment with vote
  - _Requirements: 17.1_

- [ ] 34.3 Display vote comments in results
  - Show comment icon on votes that have comments
  - Display comments in tooltip or expandable section
  - Highlight votes with comments
  - Create vote rationale panel showing all comments
  - _Requirements: 17.2, 17.3, 17.4_

---

## Phase 2C: Enhanced Voting UX (Priority: P0)

### Task 35. Implement voting status indicators

- [ ] 35.1 Create voting status component
  - Build participant list with voting status
  - Show checkmark for voted participants
  - Show pending indicator for non-voted participants
  - Update status in real-time via Socket.IO
  - _Requirements: 26.1, 26.2, 26.3_

- [ ] 35.2 Add host voting progress indicator
  - Display "X of Y voted" counter for host
  - Show progress bar visualization
  - Enable reveal button when all voted or host decides
  - Add "Reveal Anyway" option for host
  - _Requirements: 26.4_

- [ ] 35.3 Implement voting reminders
  - Track time since round started
  - Send Socket.IO reminder after 2 minutes to non-voters
  - Display gentle reminder notification
  - Allow users to dismiss reminder
  - _Requirements: 26.5_

### Task 36. Implement voting modes

- [ ] 36.1 Add voting mode to session settings
  - Add votingMode field to Session model (anonymous/open)
  - Update session creation to include voting mode
  - Apply project default voting mode
  - Allow host to change mode between rounds
  - _Requirements: 18.1, 18.4, 18.5_

- [ ] 36.2 Implement anonymous voting
  - Hide individual vote values during voting
  - Show only "voted" status without value
  - Reveal all votes simultaneously on reveal
  - _Requirements: 18.2_

- [ ] 36.3 Implement open voting
  - Display vote values as they are cast
  - Update vote display in real-time
  - Show who voted what during voting phase
  - _Requirements: 18.3_

- [ ] 36.4 Add voting mode toggle UI
  - Create voting mode selector for host
  - Display current voting mode to all participants
  - Allow changing mode between rounds
  - Show confirmation when changing mode
  - _Requirements: 18.1, 18.4_

### Task 37. Implement re-voting functionality

- [ ] 37.1 Add re-voting API and logic
  - POST /api/sessions/[sessionId]/revote - Start new round
  - Store previous round votes before clearing
  - Increment round number
  - Broadcast re-vote event to all participants
  - _Requirements: 19.2, 19.3_

- [ ] 37.2 Build re-voting UI
  - Add "Re-vote" button for host after reveal
  - Show confirmation dialog explaining re-vote
  - Display round number (Round 1, Round 2, etc.)
  - Limit to 3 rounds with UI feedback
  - _Requirements: 19.1, 19.5_

- [ ] 37.3 Implement vote history display
  - Create vote history panel showing all rounds
  - Display how votes changed across rounds
  - Show convergence visualization
  - Highlight consensus building
  - _Requirements: 19.3, 19.4_

---

## Phase 2D: Backlog Management (Priority: P1)

### Task 38. Implement story backlog

- [ ] 38.1 Create backlog view component
  - Build story list with drag-and-drop
  - Display story title, description, status
  - Show estimation status (estimated/not estimated)
  - Add story selection from backlog
  - _Requirements: 20.1, 20.5_

- [ ] 38.2 Implement drag-and-drop reordering
  - Install drag-and-drop library (dnd-kit or react-beautiful-dnd)
  - Implement drag handlers
  - Update story order in database
  - Broadcast order changes to all participants
  - _Requirements: 20.2, 20.5_

- [ ] 38.3 Add story status management
  - Add status field to Story model (ready/not-ready/estimated)
  - Create status toggle UI
  - Allow host to mark stories as ready/not ready
  - Filter backlog by status
  - _Requirements: 20.3, 20.5_

- [ ] 38.4 Implement story filtering
  - Add filter controls (status, label, assignee)
  - Implement search by title/description
  - Show filtered count
  - Persist filter preferences
  - _Requirements: 20.4_

### Task 39. Implement bulk operations

- [ ] 39.1 Add multi-select functionality
  - Add checkboxes to story list
  - Implement select all/none
  - Show selected count
  - Enable bulk action buttons when items selected
  - _Requirements: 21.1_

- [ ] 39.2 Implement bulk status updates
  - Add "Mark as Estimated" bulk action
  - Add "Mark as Not Estimated" bulk action
  - Show confirmation dialog
  - Update all selected stories
  - _Requirements: 21.2_

- [ ] 39.3 Implement bulk export
  - Add "Export Selected" button
  - Generate CSV with story details and estimates
  - Generate JSON export option
  - Trigger download
  - _Requirements: 21.3_

- [ ] 39.4 Implement bulk delete and tagging
  - Add "Delete Selected" with confirmation
  - Add "Add Label" bulk action
  - Show success/error feedback
  - Update UI after bulk operations
  - _Requirements: 21.4, 21.5_

---

## Phase 2E: Notifications (Priority: P1)

### Task 40. Implement email notification system

- [ ] 40.1 Set up email service integration
  - Choose email service (SendGrid, AWS SES, or Resend)
  - Configure email templates
  - Create email sending utility
  - Add email queue for reliability
  - _Requirements: 22.1, 22.2, 22.3_

- [ ] 40.2 Implement session invitation emails
  - Send email when session is created
  - Include session details and join link
  - Add calendar invite attachment (ICS file)
  - Respect user notification preferences
  - _Requirements: 22.1, 22.5_

- [ ] 40.3 Implement session reminder emails
  - Send reminder 15 minutes before session start
  - Include quick join link
  - Show session details
  - Allow one-click opt-out
  - _Requirements: 22.2, 22.5_

- [ ] 40.4 Implement session summary emails
  - Send summary after session ends
  - Include all estimates and statistics
  - Attach export file (CSV/JSON)
  - Link to session history
  - _Requirements: 22.3, 22.5_

- [ ] 40.5 Create notification preferences UI
  - Build preferences page
  - Add toggles for email/in-app notifications
  - Allow per-project notification settings
  - Save preferences to user profile
  - _Requirements: 22.4_

### Task 41. Implement in-app notifications

- [ ] 41.1 Create notification model and API
  - Create Notification model with type, message, link, read status
  - POST /api/notifications - Create notification
  - GET /api/notifications - Get user notifications
  - PATCH /api/notifications/[id]/read - Mark as read
  - DELETE /api/notifications/[id] - Dismiss notification
  - _Requirements: 23.2, 23.3, 23.4, 23.5_

- [ ] 41.2 Build notification bell component
  - Create bell icon with unread count badge
  - Build notification dropdown panel
  - Display notifications with icon, message, timestamp
  - Add mark as read and dismiss actions
  - Implement real-time updates via Socket.IO
  - _Requirements: 23.1, 23.4_

- [ ] 41.3 Implement notification triggers
  - Create notification on project invitation
  - Create notification on session creation
  - Create notification on session start
  - Create notification on mention in chat
  - Auto-delete notifications after 30 days
  - _Requirements: 23.2, 23.3, 23.5_

---

## Phase 2F: Visual Collaboration (Priority: P2)

### Task 42. Implement collaborative whiteboard

- [ ] 42.1 Set up whiteboard library
  - Choose whiteboard library (Excalidraw, tldraw, or Fabric.js)
  - Install and configure library
  - Create whiteboard component wrapper
  - Set up real-time sync infrastructure
  - _Requirements: 24.1, 24.3_

- [ ] 42.2 Implement whiteboard drawing tools
  - Add pen/pencil tool
  - Add shapes (rectangle, circle, arrow)
  - Add text tool
  - Add eraser tool
  - Add color picker
  - _Requirements: 24.2_

- [ ] 42.3 Implement real-time whiteboard sync
  - Create Socket.IO events for whiteboard changes
  - Broadcast drawing actions to all participants
  - Handle concurrent editing conflicts
  - Optimize for performance (throttle updates)
  - _Requirements: 24.3_

- [ ] 42.4 Add whiteboard snapshot functionality
  - Implement save snapshot button
  - Generate PNG/SVG export
  - Store snapshots in database
  - Display snapshot gallery
  - _Requirements: 24.4_

- [ ] 42.5 Implement story-whiteboard linking
  - Add "Attach to Story" button
  - Link snapshot to current story
  - Display attached snapshots on story
  - Allow viewing snapshots in modal
  - _Requirements: 24.5_

### Task 43. Implement external tool embedding

- [ ] 43.1 Create embed URL input and validation
  - Build embed dialog with URL input
  - Validate URL format for supported tools
  - Extract embed parameters from URL
  - Store embed configuration
  - _Requirements: 25.1, 25.2, 25.3, 25.5_

- [ ] 43.2 Implement Miro board embedding
  - Parse Miro board URLs
  - Generate Miro embed iframe
  - Handle Miro authentication
  - Display in resizable panel
  - _Requirements: 25.1, 25.4_

- [ ] 43.3 Implement Figma file embedding
  - Parse Figma file URLs
  - Generate Figma embed iframe
  - Handle Figma permissions
  - Display in resizable panel
  - _Requirements: 25.2, 25.4_

- [ ] 43.4 Implement Google Docs/Sheets embedding
  - Parse Google Docs/Sheets URLs
  - Generate Google embed iframe
  - Handle Google authentication
  - Display in resizable panel
  - _Requirements: 25.3, 25.4_

- [ ] 43.5 Build embed panel UI
  - Create resizable side panel
  - Add embed toolbar (minimize, maximize, close)
  - Implement panel drag-and-drop positioning
  - Persist panel state per session
  - _Requirements: 25.4, 25.5_

---

## Phase 2G: Testing & Documentation (Priority: P2)

### Task 44. Write tests for new features

- [ ]* 44.1 Write unit tests for project management
  - Test project CRUD operations
  - Test role-based access control
  - Test invitation system
  - Test permission validation
  - _Requirements: 11, 12, 13, 14_

- [ ]* 44.2 Write unit tests for communication features
  - Test chat message sending and receiving
  - Test story comments
  - Test vote comments
  - Test real-time synchronization
  - _Requirements: 15, 16, 17_

- [ ]* 44.3 Write unit tests for voting enhancements
  - Test voting modes (anonymous/open)
  - Test re-voting logic
  - Test voting status indicators
  - Test vote history
  - _Requirements: 18, 19, 26_

- [ ]* 44.4 Write integration tests for backlog management
  - Test story reordering
  - Test bulk operations
  - Test filtering and search
  - Test status management
  - _Requirements: 20, 21_

- [ ]* 44.5 Write integration tests for notifications
  - Test email sending
  - Test in-app notifications
  - Test notification preferences
  - Test notification triggers
  - _Requirements: 22, 23_

- [ ]* 44.6 Write integration tests for whiteboard
  - Test drawing synchronization
  - Test snapshot creation
  - Test story attachment
  - Test external tool embedding
  - _Requirements: 24, 25_

### Task 45. Create documentation for new features

- [ ]* 45.1 Document project management
  - Write user guide for creating projects
  - Document team member management
  - Explain role-based permissions
  - Create admin guide for project settings
  - _Requirements: 11, 12, 13, 14_

- [ ]* 45.2 Document communication features
  - Explain session chat usage
  - Document story commenting
  - Explain vote rationale feature
  - Create best practices guide
  - _Requirements: 15, 16, 17_

- [ ]* 45.3 Document voting enhancements
  - Explain voting modes
  - Document re-voting process
  - Explain voting status indicators
  - Create voting best practices
  - _Requirements: 18, 19, 26_

- [ ]* 45.4 Document backlog management
  - Explain story organization
  - Document bulk operations
  - Create filtering guide
  - Explain status management
  - _Requirements: 20, 21_

- [ ]* 45.5 Document notifications
  - Explain notification types
  - Document notification preferences
  - Create troubleshooting guide
  - Explain email vs in-app notifications
  - _Requirements: 22, 23_

- [ ]* 45.6 Document visual collaboration
  - Explain whiteboard usage
  - Document external tool embedding
  - Create collaboration best practices
  - Provide tool-specific guides (Miro, Figma)
  - _Requirements: 24, 25_

---

## Summary

**Total New Tasks**: 18 major tasks (28-45)
**Total Sub-tasks**: 80+ implementation items
**Estimated Timeline**: 6-8 weeks

### Task Breakdown by Priority

**P0 (Must Have) - 4-5 weeks**:
- Tasks 28-31: Project & Team Organization (1.5 weeks)
- Tasks 32-34: In-Session Communication (1.5 weeks)
- Tasks 35-37: Enhanced Voting UX (1.5 weeks)

**P1 (Should Have) - 2-3 weeks**:
- Tasks 38-39: Backlog Management (1 week)
- Tasks 40-41: Notifications (1.5 weeks)

**P2 (Nice to Have) - 1-2 weeks**:
- Tasks 42-43: Visual Collaboration (1.5 weeks)
- Tasks 44-45: Testing & Documentation (ongoing)

### Dependencies

- Tasks 28-31 should be completed first (foundation for other features)
- Tasks 32-37 can be done in parallel after Task 31
- Tasks 38-41 can be done in parallel after Task 31
- Tasks 42-43 can be done anytime after Task 31
- Tasks 44-45 should be done incrementally alongside feature development

### Notes

- All tasks marked with `*` are optional testing and documentation tasks
- Each task should generate an implementation document (similar to TASK_XX_IMPLEMENTATION.md)
- Use Kiro's spec-driven approach for systematic implementation
- Maintain consistent patterns established in Phase 1

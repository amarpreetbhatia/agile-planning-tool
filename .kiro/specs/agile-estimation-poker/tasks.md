# Implementation Plan

- [x] 1. Initialize Next.js project with core dependencies and configuration





  - Create Next.js 14+ project with TypeScript and App Router
  - Install and configure Tailwind CSS
  - Install Shadcn UI and initialize with custom theme configuration
  - Set up project structure (app, components, lib, models, types directories)
  - Configure TypeScript with strict mode
  - Create environment variable template (.env.example)
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Set up Shadcn UI design system and theming





  - Initialize Shadcn UI with custom color palette (vibrant blue/purple theme)
  - Configure dark mode with next-themes
  - Install required Shadcn components (Button, Card, Dialog, Sheet, Avatar, Badge, Tabs, Select, Input, Separator, Skeleton, Toast, Tooltip, ScrollArea, DropdownMenu)
  - Create custom theme CSS variables in globals.css
  - Set up Lucide React icons
  - Install and configure Framer Motion for animations
  - Create responsive layout components (MobileLayout, TabletLayout, DesktopLayout)
  - Create custom hooks (use-mobile.tsx for breakpoint detection)
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 7.1, 9.1_

- [x] 3. Configure MongoDB Atlas connection and create data models





  - Install Mongoose and MongoDB dependencies
  - Create database connection utility (lib/db.ts) with connection pooling
  - Define User model with schema validation and indexes
  - Define Session model with embedded participants and GitHub integration
  - Define Estimate model with votes array and finalization fields
  - Create database indexes for performance (githubId, sessionId, compound indexes)
  - Add TypeScript interfaces for all models
  - _Requirements: 1.5, 2.3, 3.2, 8.3_

- [x] 4. Implement Auth.js with GitHub OAuth provider





  - Install Auth.js v5 (next-auth) and GitHub provider
  - Create auth configuration (lib/auth.ts) with GitHub provider
  - Configure MongoDB adapter for session storage
  - Implement JWT strategy with custom callbacks
  - Create middleware for protected routes
  - Store encrypted GitHub access token in user profile
  - Create auth API routes (app/api/auth/[...nextauth]/route.ts)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Build authentication UI components





  - Create login page with GitHub OAuth button (app/(auth)/login/page.tsx)
  - Create auth error page (app/(auth)/error/page.tsx)
  - Create user profile dropdown component with avatar and logout
  - Add theme toggle component for dark/light mode
  - Implement responsive header with navigation
  - Add loading states and error handling for auth flows
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 6. Implement session creation and management





  - Create session creation API route (POST /api/sessions)
  - Generate unique shareable session IDs
  - Create session creation form with validation (app/(dashboard)/sessions/new/page.tsx)
  - Implement session list view on dashboard (app/(dashboard)/page.tsx)
  - Create session card component with status and participant count
  - Add session metadata storage in MongoDB
  - Implement host assignment logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Build session join functionality





  - Create session join API route (POST /api/sessions/[sessionId]/join)
  - Implement session validation and participant addition
  - Create session page layout (app/(dashboard)/sessions/[sessionId]/page.tsx)
  - Build participant list component with avatars
  - Add session not found error handling
  - Display shareable session link with copy functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Set up Socket.IO server for real-time communication





  - Install Socket.IO server and client dependencies
  - Create custom Socket.IO server (socket-server.ts)
  - Implement Socket.IO API handler (app/api/socket/route.ts)
  - Create Socket.IO client utility (lib/socket.ts)
  - Implement authentication middleware for Socket.IO connections
  - Set up room-based broadcasting for sessions
  - Add connection/disconnection handlers
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Implement real-time participant management









  - Create Socket.IO events for participant join/leave
  - Implement participant online status tracking
  - Build real-time participant list component with online indicators
  - Add participant join/leave notifications with toast messages
  - Implement participant avatar animations (slide in/out)
  - Update session participant list in database on join/leave
  - _Requirements: 3.4, 3.5, 9.1_

- [x] 10. Build GitHub integration service





  - Install Octokit for GitHub API access
  - Create GitHub service utility (lib/github.ts)
  - Implement repository fetching with user's access token
  - Implement issue fetching from repositories
  - Implement GitHub Projects V2 API integration
  - Add error handling for GitHub API rate limits
  - Create GitHub token validation and refresh logic
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11. Create GitHub integration UI components





  - Build GitHub integration dialog component
  - Create repository selection dropdown with search
  - Implement issue list component with pagination
  - Add GitHub Projects selection interface
  - Create story import functionality with preview
  - Display imported stories in session interface
  - Add error handling and retry logic for GitHub API failures
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12. Implement story selection and management





  - Create story selection API route (POST /api/sessions/[sessionId]/story)
  - Build story selection interface for session host
  - Implement Socket.IO event for story broadcast
  - Create story display component with title and description
  - Add manual story creation form (non-GitHub stories)
  - Implement story queue/backlog view
  - Update current story in session database
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Build planning poker card selection UI





  - Create poker card component with Fibonacci values (1, 2, 3, 5, 8, 13, 21)
  - Implement card grid layout (responsive: 2-3 cols mobile, 4-5 cols desktop)
  - Add card selection interaction with visual feedback
  - Implement card flip animation with Framer Motion
  - Create bottom sheet for mobile card selection
  - Add special cards (?, ☕) for uncertainty and break
  - Style cards with gradient backgrounds and hover effects
  - _Requirements: 6.1, 6.2_

- [x] 14. Implement voting logic and state management





  - Create vote casting API route (POST /api/sessions/[sessionId]/vote)
  - Implement Socket.IO event for vote status broadcast
  - Store votes in Estimate model with timestamps
  - Create voting status indicator component (who has voted)
  - Allow vote changes before reveal
  - Implement vote validation (valid card values, active round)
  - Add optimistic UI updates for vote casting
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 15. Build estimate reveal functionality





  - Create reveal API route (POST /api/sessions/[sessionId]/reveal)
  - Implement host-only reveal authorization
  - Calculate estimate statistics (average, min, max)
  - Create Socket.IO event for reveal broadcast
  - Build results display component with vote breakdown
  - Implement staggered card flip animation for reveals
  - Highlight min/max estimates with visual indicators
  - Display average estimate prominently
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 16. Implement estimate finalization





  - Create finalization API route (POST /api/sessions/[sessionId]/finalize)
  - Build finalization dialog with consensus value input
  - Store final estimate in database with timestamp
  - Update GitHub issue with estimate (if GitHub integration active)
  - Implement Socket.IO event for finalization broadcast
  - Add confetti animation on successful finalization
  - Mark estimation round as complete
  - Enable next story selection after finalization
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 17. Implement session end functionality





  - Create session end API route (POST /api/sessions/[sessionId]/end)
  - Implement host-only authorization for ending session
  - Broadcast session end event to all participants
  - Disconnect all Socket.IO connections for session
  - Archive session in database (status: archived)
  - Create session summary view with all estimates
  - Redirect participants to dashboard on session end
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 18. Build responsive session page layout





  - Create mobile layout (single column, bottom sheet for cards)
  - Create tablet layout (two columns, side drawer for participants)
  - Create desktop layout (three columns: participants | main | details)
  - Implement responsive participant list (stacked on mobile, sidebar on desktop)
  - Add responsive story display (collapsible on mobile, persistent on desktop)
  - Create responsive poker card grid
  - Implement mobile navigation with hamburger menu
  - Add swipe gestures for mobile navigation
  - _Requirements: 5.4, 6.1, 7.2, 9.1_

- [x] 19. Implement error handling and loading states





  - Create error boundary components for graceful error handling
  - Add loading skeletons for all async operations
  - Implement toast notifications for user feedback
  - Create error pages (404, 500, session not found)
  - Add retry logic for failed API requests
  - Implement WebSocket reconnection with exponential backoff
  - Add error logging utility
  - Create user-friendly error messages for all error types
  - _Requirements: 1.4, 3.3, 4.1, 9.5_

- [x] 20. Add animations and micro-interactions





  - Implement card flip animation for estimate reveal
  - Add participant join/leave slide animations
  - Create voting pulse indicator animation
  - Add button press scale feedback
  - Implement page transition fade effects
  - Create confetti effect for estimate finalization
  - Add hover effects on interactive elements
  - Implement loading spinner animations
  - _Requirements: 6.3, 7.2, 8.5, 9.1_

- [x] 21. Implement session history and archive view





  - Create session history API route (GET /api/sessions/history)
  - Build archived sessions list component
  - Create session detail view with all estimates
  - Add filtering and sorting for session history
  - Display estimate statistics and trends
  - Implement export functionality for session data
  - _Requirements: 10.5_

- [ ]* 22. Write integration tests for core flows
  - Test authentication flow with GitHub OAuth
  - Test session creation and joining
  - Test voting and reveal flow
  - Test GitHub integration and story import
  - Test estimate finalization
  - Test session end and cleanup
  - _Requirements: All requirements_

- [ ]* 23. Write unit tests for utilities and services
  - Test GitHub service methods
  - Test estimate calculation logic
  - Test session validation functions
  - Test Socket.IO event handlers
  - Test database model methods
  - _Requirements: All requirements_

- [ ]* 24. Create end-to-end tests for user flows
  - Test complete estimation session from creation to finalization
  - Test multi-user real-time collaboration
  - Test GitHub integration workflow
  - Test responsive layouts on different screen sizes
  - Test error scenarios and recovery
  - _Requirements: All requirements_

- [ ]* 25. Add accessibility improvements
  - Ensure keyboard navigation for all interactive elements
  - Add ARIA labels and roles
  - Test with screen readers
  - Ensure sufficient color contrast
  - Add focus indicators
  - Test with keyboard-only navigation
  - _Requirements: All requirements_

- [ ]* 26. Optimize performance
  - Implement code splitting for large components
  - Add image optimization for avatars
  - Optimize database queries with proper indexes
  - Implement caching for GitHub API responses
  - Add compression for Socket.IO messages
  - Optimize bundle size
  - _Requirements: All requirements_

- [ ]* 27. Create documentation
  - Write README with setup instructions
  - Document environment variables
  - Create API documentation
  - Document Socket.IO events
  - Add code comments for complex logic
  - Create deployment guide
  - _Requirements: All requirements_


---

# Phase 2: Enhanced Collaboration Features

## Phase 2A: Project & Team Organization (Priority: P0)

- [x] 28. Implement project data model and API





  - Create Project model with name, description, owner, settings
  - Add team members array with role (owner, admin, member)
  - Add project settings (default card values, voting mode, GitHub defaults)
  - Create indexes for projectId and owner
  - Create project CRUD API routes (POST /api/projects, GET /api/projects, GET /api/projects/[projectId], PATCH /api/projects/[projectId], DELETE /api/projects/[projectId])
  - Implement role-based access control middleware
  - Create permission validation utility
  - Implement role checking (owner, admin, member)
  - Add authorization middleware for API routes
  - Validate permissions before project operations
  - _Requirements: 11.2, 11.6, 12.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 29. Build project management UI





  - Build project creation form with name and description
  - Add project settings configuration (card values, voting mode)
  - Implement project creation API call
  - Redirect to project dashboard after creation
  - Create projects list page showing owned and member projects
  - Display project cards with member count and recent activity
  - Add role badges (Owner, Admin, Member)
  - Implement project filtering and search
  - Build settings form for card values configuration
  - Add voting mode selector (anonymous/open)
  - Implement GitHub integration defaults
  - Add save and cancel actions
  - Restrict access to owners and admins
  - _Requirements: 11.1, 11.2, 11.3, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 30. Implement team member management





  - Create invitation system API (POST /api/projects/[projectId]/invitations, GET /api/projects/[projectId]/invitations, POST /api/invitations/[invitationId]/accept, POST /api/invitations/[invitationId]/decline, DELETE /api/projects/[projectId]/members/[userId])
  - Create team members list with avatars and roles
  - Add invite member dialog with GitHub username/email input
  - Display pending invitations with status
  - Implement role assignment dropdown (admin/member)
  - Add remove member confirmation dialog
  - Build invitation notification component
  - Create accept/decline invitation UI
  - Implement invitation acceptance API calls
  - Show success/error feedback
  - Update project list after acceptance
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 31. Update session creation to use projects





  - Add projectId field to Session schema
  - Add project reference and validation
  - Update session creation to require project selection
  - Add project selector to session creation form
  - Filter projects by user's membership
  - Apply project settings to new session
  - Validate user has permission to create session
  - Group sessions by project in dashboard
  - Add project filter to session list
  - Display project name on session cards
  - Show only sessions from user's projects
  - _Requirements: 11.5, 13.3, 13.4_

## Phase 2B: In-Session Communication (Priority: P0)

- [x] 32. Implement session chat system





  - Create ChatMessage model with sessionId, userId, message, timestamp
  - Create chat message API routes (POST /api/sessions/[sessionId]/messages, GET /api/sessions/[sessionId]/messages)
  - Add message validation and sanitization
  - Add 'chat:message' client-to-server Socket.IO event
  - Add 'chat:message' server-to-client broadcast
  - Add 'chat:typing' event for typing indicators
  - Implement message persistence on server
  - Create chat panel with message list
  - Add message input with send button
  - Display messages with author avatar and timestamp
  - Implement auto-scroll to latest message
  - Add typing indicators
  - Integrate chat panel into session page
  - Make chat collapsible on mobile
  - Position chat in sidebar on desktop
  - Add unread message indicator
  - Persist chat open/closed state
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 33. Implement story comments









  - Add comments array to Story schema
  - Create story comment API routes (POST /api/sessions/[sessionId]/stories/[storyId]/comments, GET /api/sessions/[sessionId]/stories/[storyId]/comments)
  - Store comment with userId, username, text, timestamp
  - Create comments section below story display
  - Add comment input with submit button
  - Display comments with author and timestamp
  - Implement real-time comment updates via Socket.IO
  - Add GitHub API call to post comment on issue
  - Sync story comments to GitHub when story is from GitHub
  - Handle GitHub API errors gracefully
  - Add sync status indicator
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 34. Implement vote comments/rationale





  - Update IVote interface to include optional comment field
  - Modify vote API to accept comment parameter
  - Store vote comments in Estimate model
  - Add optional comment textarea to card selection
  - Show character limit (e.g., 200 chars)
  - Save comment with vote
  - Show comment icon on votes that have comments
  - Display comments in tooltip or expandable section
  - Highlight votes with comments
  - Create vote rationale panel showing all comments
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

## Phase 2C: Enhanced Voting UX (Priority: P0)

- [x] 35. Implement voting status indicators





  - Build participant list with voting status
  - Show checkmark for voted participants
  - Show pending indicator for non-voted participants
  - Update status in real-time via Socket.IO
  - Display "X of Y voted" counter for host
  - Show progress bar visualization
  - Enable reveal button when all voted or host decides
  - Add "Reveal Anyway" option for host
  - Track time since round started
  - Send Socket.IO reminder after 2 minutes to non-voters
  - Display gentle reminder notification
  - Allow users to dismiss reminder
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

- [x] 36. Implement voting modes





  - Add votingMode field to Session model (anonymous/open)
  - Update session creation to include voting mode
  - Apply project default voting mode
  - Allow host to change mode between rounds
  - Hide individual vote values during voting (anonymous mode)
  - Show only "voted" status without value
  - Reveal all votes simultaneously on reveal
  - Display vote values as they are cast (open mode)
  - Update vote display in real-time
  - Show who voted what during voting phase
  - Create voting mode selector for host
  - Display current voting mode to all participants
  - Allow changing mode between rounds
  - Show confirmation when changing mode
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 37. Implement re-voting functionality





  - Create re-voting API route (POST /api/sessions/[sessionId]/revote)
  - Store previous round votes before clearing
  - Increment round number
  - Broadcast re-vote event to all participants
  - Add "Re-vote" button for host after reveal
  - Show confirmation dialog explaining re-vote
  - Display round number (Round 1, Round 2, etc.)
  - Limit to 3 rounds with UI feedback
  - Create vote history panel showing all rounds
  - Display how votes changed across rounds
  - Show convergence visualization
  - Highlight consensus building
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

## Phase 2D: Backlog Management (Priority: P1)

- [x] 38. Implement story backlog





  - Build story list with drag-and-drop
  - Display story title, description, status
  - Show estimation status (estimated/not estimated)
  - Add story selection from backlog
  - Install drag-and-drop library (dnd-kit or react-beautiful-dnd)
  - Implement drag handlers
  - Update story order in database
  - Broadcast order changes to all participants
  - Add status field to Story model (ready/not-ready/estimated)
  - Create status toggle UI
  - Allow host to mark stories as ready/not ready
  - Filter backlog by status
  - Add filter controls (status, label, assignee)
  - Implement search by title/description
  - Show filtered count
  - Persist filter preferences
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 39. Implement bulk operations





  - Add checkboxes to story list
  - Implement select all/none
  - Show selected count
  - Enable bulk action buttons when items selected
  - Add "Mark as Estimated" bulk action
  - Add "Mark as Not Estimated" bulk action
  - Show confirmation dialog
  - Update all selected stories
  - Add "Export Selected" button
  - Generate CSV with story details and estimates
  - Generate JSON export option
  - Trigger download
  - Add "Delete Selected" with confirmation
  - Add "Add Label" bulk action
  - Show success/error feedback
  - Update UI after bulk operations
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

## Phase 2E: Notifications (Priority: P1)

- [x] 40. Implement email notification system





  - Choose email service (SendGrid, AWS SES, or Resend)
  - Configure email templates
  - Create email sending utility
  - Add email queue for reliability
  - Send email when session is created
  - Include session details and join link
  - Add calendar invite attachment (ICS file)
  - Respect user notification preferences
  - Send reminder 15 minutes before session start
  - Include quick join link
  - Show session details
  - Allow one-click opt-out
  - Send summary after session ends
  - Include all estimates and statistics
  - Attach export file (CSV/JSON)
  - Link to session history
  - Build preferences page
  - Add toggles for email/in-app notifications
  - Allow per-project notification settings
  - Save preferences to user profile
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [x] 41. Implement in-app notifications





  - Create Notification model with type, message, link, read status
  - Create notification API routes (POST /api/notifications, GET /api/notifications, PATCH /api/notifications/[id]/read, DELETE /api/notifications/[id])
  - Create bell icon with unread count badge
  - Build notification dropdown panel
  - Display notifications with icon, message, timestamp
  - Add mark as read and dismiss actions
  - Implement real-time updates via Socket.IO
  - Create notification on project invitation
  - Create notification on session creation
  - Create notification on session start
  - Create notification on mention in chat
  - Auto-delete notifications after 30 days
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

## Phase 2F: Visual Collaboration (Priority: P2)

- [x] 42. Implement collaborative whiteboard



  - Choose whiteboard library (Excalidraw, tldraw, or Fabric.js)
  - Install and configure library
  - Create whiteboard component wrapper
  - Set up real-time sync infrastructure
  - Add pen/pencil tool
  - Add shapes (rectangle, circle, arrow)
  - Add text tool
  - Add eraser tool
  - Add color picker
  - Create Socket.IO events for whiteboard changes
  - Broadcast drawing actions to all participants
  - Handle concurrent editing conflicts
  - Optimize for performance (throttle updates)
  - Implement save snapshot button
  - Generate PNG/SVG export
  - Store snapshots in database
  - Display snapshot gallery
  - Add "Attach to Story" button
  - Link snapshot to current story
  - Display attached snapshots on story
  - Allow viewing snapshots in modal
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ] 43. Implement external tool embedding
  - Build embed dialog with URL input
  - Validate URL format for supported tools
  - Extract embed parameters from URL
  - Store embed configuration
  - Parse Miro board URLs
  - Generate Miro embed iframe
  - Handle Miro authentication
  - Display in resizable panel
  - Parse Figma file URLs
  - Generate Figma embed iframe
  - Handle Figma permissions
  - Display in resizable panel
  - Parse Google Docs/Sheets URLs
  - Generate Google embed iframe
  - Handle Google authentication
  - Display in resizable panel
  - Create resizable side panel
  - Add embed toolbar (minimize, maximize, close)
  - Implement panel drag-and-drop positioning
  - Persist panel state per session
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

## Phase 2G: Testing & Documentation (Priority: P2)

- [ ]* 44. Write tests for new features
  - Test project CRUD operations
  - Test role-based access control
  - Test invitation system
  - Test permission validation
  - Test chat message sending and receiving
  - Test story comments
  - Test vote comments
  - Test real-time synchronization
  - Test voting modes (anonymous/open)
  - Test re-voting logic
  - Test voting status indicators
  - Test vote history
  - Test story reordering
  - Test bulk operations
  - Test filtering and search
  - Test status management
  - Test email sending
  - Test in-app notifications
  - Test notification preferences
  - Test notification triggers
  - Test drawing synchronization
  - Test snapshot creation
  - Test story attachment
  - Test external tool embedding
  - _Requirements: 11-26_

- [ ]* 45. Create documentation for new features
  - Write user guide for creating projects
  - Document team member management
  - Explain role-based permissions
  - Create admin guide for project settings
  - Explain session chat usage
  - Document story commenting
  - Explain vote rationale feature
  - Create best practices guide
  - Explain voting modes
  - Document re-voting process
  - Explain voting status indicators
  - Create voting best practices
  - Explain story organization
  - Document bulk operations
  - Create filtering guide
  - Explain status management
  - Explain notification types
  - Document notification preferences
  - Create troubleshooting guide
  - Explain email vs in-app notifications
  - Explain whiteboard usage
  - Document external tool embedding
  - Create collaboration best practices
  - Provide tool-specific guides (Miro, Figma)
  - _Requirements: 11-26_

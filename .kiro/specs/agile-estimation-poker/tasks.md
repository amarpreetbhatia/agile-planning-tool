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

- [ ] 15. Build estimate reveal functionality
  - Create reveal API route (POST /api/sessions/[sessionId]/reveal)
  - Implement host-only reveal authorization
  - Calculate estimate statistics (average, min, max)
  - Create Socket.IO event for reveal broadcast
  - Build results display component with vote breakdown
  - Implement staggered card flip animation for reveals
  - Highlight min/max estimates with visual indicators
  - Display average estimate prominently
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 16. Implement estimate finalization
  - Create finalization API route (POST /api/sessions/[sessionId]/finalize)
  - Build finalization dialog with consensus value input
  - Store final estimate in database with timestamp
  - Update GitHub issue with estimate (if GitHub integration active)
  - Implement Socket.IO event for finalization broadcast
  - Add confetti animation on successful finalization
  - Mark estimation round as complete
  - Enable next story selection after finalization
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 17. Implement session end functionality
  - Create session end API route (POST /api/sessions/[sessionId]/end)
  - Implement host-only authorization for ending session
  - Broadcast session end event to all participants
  - Disconnect all Socket.IO connections for session
  - Archive session in database (status: archived)
  - Create session summary view with all estimates
  - Redirect participants to dashboard on session end
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 18. Build responsive session page layout
  - Create mobile layout (single column, bottom sheet for cards)
  - Create tablet layout (two columns, side drawer for participants)
  - Create desktop layout (three columns: participants | main | details)
  - Implement responsive participant list (stacked on mobile, sidebar on desktop)
  - Add responsive story display (collapsible on mobile, persistent on desktop)
  - Create responsive poker card grid
  - Implement mobile navigation with hamburger menu
  - Add swipe gestures for mobile navigation
  - _Requirements: 5.4, 6.1, 7.2, 9.1_

- [ ] 19. Implement error handling and loading states
  - Create error boundary components for graceful error handling
  - Add loading skeletons for all async operations
  - Implement toast notifications for user feedback
  - Create error pages (404, 500, session not found)
  - Add retry logic for failed API requests
  - Implement WebSocket reconnection with exponential backoff
  - Add error logging utility
  - Create user-friendly error messages for all error types
  - _Requirements: 1.4, 3.3, 4.1, 9.5_

- [ ] 20. Add animations and micro-interactions
  - Implement card flip animation for estimate reveal
  - Add participant join/leave slide animations
  - Create voting pulse indicator animation
  - Add button press scale feedback
  - Implement page transition fade effects
  - Create confetti effect for estimate finalization
  - Add hover effects on interactive elements
  - Implement loading spinner animations
  - _Requirements: 6.3, 7.2, 8.5, 9.1_

- [ ] 21. Implement session history and archive view
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

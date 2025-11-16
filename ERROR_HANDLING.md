# Error Handling and Loading States

This document describes the comprehensive error handling and loading state system implemented in the application.

## Overview

The application implements a multi-layered error handling strategy:

1. **Error Boundaries** - Catch React component errors
2. **API Error Handling** - Standardized error responses
3. **Socket.IO Reconnection** - Automatic reconnection with exponential backoff
4. **Loading States** - Skeleton loaders for async operations
5. **User Feedback** - Toast notifications and error displays
6. **Error Logging** - Centralized error logging utility

## Components

### Error Boundaries

**ErrorBoundary** (`components/error-boundary.tsx`)
- Catches React component errors
- Displays user-friendly error message
- Provides refresh option
- Logs errors for debugging

Usage:
```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Error Pages

**404 Page** (`app/not-found.tsx`)
- Displayed when page doesn't exist
- Links to home and create session

**500 Error Page** (`app/error.tsx`)
- Catches unhandled errors in routes
- Provides retry functionality
- Shows error details in development

**Global Error** (`app/global-error.tsx`)
- Catches critical application errors
- Minimal UI for maximum reliability

**Session Not Found** (`components/error/session-not-found.tsx`)
- Specific error for missing sessions
- Links to dashboard and create new session

### Loading Skeletons

**DashboardSkeleton** (`components/loading/dashboard-skeleton.tsx`)
- Loading state for dashboard page
- Shows session card placeholders

**SessionSkeleton** (`components/loading/session-skeleton.tsx`)
- Loading state for session page
- Shows participants, story, and cards placeholders

**StorySkeleton** (`components/loading/story-skeleton.tsx`)
- Loading state for story display
- Loading state for story backlog

**GitHubSkeleton** (`components/loading/github-skeleton.tsx`)
- Loading states for GitHub integration
- Repository, issue, and project selectors

### Error Display Components

**ApiErrorDisplay** (`components/error/api-error-display.tsx`)
- Displays API errors with user-friendly messages
- Optional retry button
- Uses Alert component

**ConnectionStatus** (`components/connection-status.tsx`)
- Shows real-time connection status
- Displays reconnection attempts
- Tooltip with additional info

## Utilities

### Error Logger

**error-logger.ts** (`lib/error-logger.ts`)

Centralized error logging with standardized error codes:

```typescript
import { logError, createAppError, ErrorCode, getUserFriendlyMessage } from '@/lib/error-logger'

// Create an error
const error = createAppError(
  ErrorCode.SESSION_NOT_FOUND,
  'Session not found',
  404
)

// Log an error
logError(error, 'Session API')

// Get user-friendly message
const message = getUserFriendlyMessage(error)
```

**Error Codes:**
- `AUTH_FAILED` - Authentication failed
- `UNAUTHORIZED` - Not authorized
- `SESSION_NOT_FOUND` - Session doesn't exist
- `SESSION_ENDED` - Session has ended
- `NOT_SESSION_HOST` - Not the session host
- `GITHUB_API_ERROR` - GitHub API error
- `GITHUB_TOKEN_INVALID` - Invalid GitHub token
- `GITHUB_RATE_LIMIT` - Rate limit exceeded
- `ROUND_NOT_ACTIVE` - No active voting round
- `ALREADY_REVEALED` - Round already revealed
- `INVALID_CARD_VALUE` - Invalid card value
- `DB_CONNECTION_ERROR` - Database connection error
- `DB_OPERATION_FAILED` - Database operation failed
- `NETWORK_ERROR` - Network error
- `SOCKET_ERROR` - Socket connection error
- `API_ERROR` - Generic API error
- `UNKNOWN_ERROR` - Unknown error

### API Error Handler

**api-error-handler.ts** (`lib/api-error-handler.ts`)

Standardized API error responses:

```typescript
import { handleApiError, createSuccessResponse, validateRequiredFields } from '@/lib/api-error-handler'

// In API route
try {
  // Your logic
  return createSuccessResponse({ data: 'success' })
} catch (error) {
  return handleApiError(error, 'API Context')
}

// Validate required fields
const validation = validateRequiredFields(body, ['field1', 'field2'])
if (!validation.valid) {
  return validation.error
}
```

### API Helpers

**api-helpers.ts** (`lib/api-helpers.ts`)

Common API patterns:

```typescript
import { 
  getAuthenticatedUser, 
  getSessionById, 
  validateSessionHost,
  validateSessionParticipant,
  validateSessionActive,
  parseRequestBody
} from '@/lib/api-helpers'

// Get authenticated user
const user = await getAuthenticatedUser()

// Get session and validate
const session = await getSessionById(sessionId)
validateSessionActive(session)
validateSessionHost(session, user._id)

// Parse request body
const body = await parseRequestBody<{ value: number }>(request)
```

### API Retry Logic

**api-retry.ts** (`lib/api-retry.ts`)

Retry failed requests with exponential backoff:

```typescript
import { retryWithBackoff, fetchWithRetry } from '@/lib/api-retry'

// Retry a function
const result = await retryWithBackoff(
  async () => {
    return await someApiCall()
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  }
)

// Fetch with retry
const response = await fetchWithRetry('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

### Socket Connection Management

**Enhanced Socket.IO** (`lib/socket.ts`)

Automatic reconnection with exponential backoff:

```typescript
import { initSocket } from '@/lib/socket'

const socket = initSocket({
  token: 'user-token',
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
  onError: (error) => console.error('Error:', error),
  onReconnecting: (attempt) => console.log(`Reconnecting (${attempt})...`),
  onReconnectFailed: () => console.error('Reconnection failed'),
})
```

**useSocketConnection Hook** (`hooks/use-socket-connection.ts`)

React hook for managing socket connection:

```typescript
import { useSocketConnection } from '@/hooks/use-socket-connection'

function MyComponent() {
  const { status, reconnectAttempt, socket, isConnected } = useSocketConnection(token)
  
  return (
    <div>
      <ConnectionStatus status={status} reconnectAttempt={reconnectAttempt} />
      {isConnected && <YourContent />}
    </div>
  )
}
```

## UI Components

### LoadingButton

**loading-button.tsx** (`components/ui/loading-button.tsx`)

Button with built-in loading state:

```tsx
import { LoadingButton } from '@/components/ui/loading-button'

<LoadingButton
  loading={isLoading}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save
</LoadingButton>
```

### Toast Notifications

Enhanced toast with success variant:

```typescript
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// Success toast
toast({
  title: 'Success',
  description: 'Operation completed',
  variant: 'success',
})

// Error toast
toast({
  title: 'Error',
  description: 'Something went wrong',
  variant: 'destructive',
})

// Default toast
toast({
  title: 'Info',
  description: 'Something happened',
})
```

## Best Practices

### API Routes

1. Use `handleApiError` for consistent error responses
2. Use `createSuccessResponse` for success responses
3. Use helper functions from `api-helpers.ts`
4. Log errors with context

Example:
```typescript
import { handleApiError, createSuccessResponse } from '@/lib/api-error-handler'
import { getAuthenticatedUser, getSessionById } from '@/lib/api-helpers'

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser()
    const { sessionId } = await context.params
    const session = await getSessionById(sessionId)
    
    // Your logic here
    
    return createSuccessResponse({ data: 'success' })
  } catch (error) {
    return handleApiError(error, 'API Route Name')
  }
}
```

### Client Components

1. Wrap components in ErrorBoundary
2. Use loading skeletons for async operations
3. Show user-friendly error messages
4. Provide retry options
5. Use toast for feedback

Example:
```tsx
import { ErrorBoundary } from '@/components/error-boundary'
import { SessionSkeleton } from '@/components/loading/session-skeleton'
import { ApiErrorDisplay } from '@/components/error/api-error-display'
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()
  
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/endpoint')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      // Handle data
    } catch (err) {
      setError(err)
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <SessionSkeleton />
  if (error) return <ApiErrorDisplay error={error} onRetry={fetchData} />
  
  return <YourContent />
}

export default function Page() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### Socket.IO

1. Use `useSocketConnection` hook
2. Show connection status to users
3. Handle reconnection gracefully
4. Provide feedback during reconnection

Example:
```tsx
import { useSocketConnection } from '@/hooks/use-socket-connection'
import { ConnectionStatus } from '@/components/connection-status'

function SessionPage() {
  const { status, reconnectAttempt, isConnected } = useSocketConnection(token)
  
  return (
    <div>
      <ConnectionStatus status={status} reconnectAttempt={reconnectAttempt} />
      {isConnected ? <SessionContent /> : <SessionSkeleton />}
    </div>
  )
}
```

## Testing Error Handling

### Simulate Errors

1. **Network Errors**: Disconnect network
2. **API Errors**: Return error responses from API
3. **Socket Errors**: Stop socket server
4. **Component Errors**: Throw error in component

### Test Cases

- [ ] Error boundary catches component errors
- [ ] 404 page displays for invalid routes
- [ ] Session not found shows appropriate error
- [ ] API errors show user-friendly messages
- [ ] Socket reconnects after disconnection
- [ ] Loading skeletons display during async operations
- [ ] Toast notifications appear for user actions
- [ ] Retry buttons work correctly
- [ ] Error logging captures all errors

## Future Enhancements

1. **Error Monitoring**: Integrate with Sentry or similar service
2. **Analytics**: Track error rates and types
3. **User Feedback**: Allow users to report errors
4. **Offline Support**: Handle offline scenarios gracefully
5. **Error Recovery**: Automatic recovery strategies

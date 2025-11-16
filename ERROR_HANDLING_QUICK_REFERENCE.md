# Error Handling Quick Reference

Quick reference guide for implementing error handling in the application.

## Quick Start

### 1. Client Component with Error Handling

```tsx
"use client"

import { useState } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { ApiErrorDisplay } from '@/components/error/api-error-display'
import { SessionSkeleton } from '@/components/loading'
import { useToast } from '@/hooks/use-toast'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-logger'

function MyComponent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/endpoint')
      if (!response.ok) throw new Error('Failed')
      // Handle success
    } catch (err) {
      const appError = parseApiError(err)
      setError(appError)
      toast({
        title: 'Error',
        description: getUserFriendlyMessage(appError),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <SessionSkeleton />
  if (error) return <ApiErrorDisplay error={error} onRetry={fetchData} />
  return <div>Content</div>
}

export default function Page() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### 2. API Route with Error Handling

```typescript
import { NextRequest } from 'next/server'
import { handleApiError, createSuccessResponse } from '@/lib/api-error-handler'
import { getAuthenticatedUser, getSessionById } from '@/lib/api-helpers'

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Get authenticated user (throws if not authenticated)
    const user = await getAuthenticatedUser()
    
    // Get session (throws if not found)
    const { sessionId } = await context.params
    const session = await getSessionById(sessionId)
    
    // Your logic here
    
    return createSuccessResponse({ data: 'success' })
  } catch (error) {
    return handleApiError(error, 'API Route Name')
  }
}
```

### 3. Socket Connection with Error Handling

```tsx
"use client"

import { useSocketConnection } from '@/hooks/use-socket-connection'
import { ConnectionStatus } from '@/components/connection-status'

function SessionPage() {
  const { status, reconnectAttempt, isConnected } = useSocketConnection(token)
  
  return (
    <div>
      <ConnectionStatus status={status} reconnectAttempt={reconnectAttempt} />
      {isConnected && <SessionContent />}
    </div>
  )
}
```

## Common Patterns

### Show Loading State

```tsx
import { SessionSkeleton } from '@/components/loading'

if (loading) return <SessionSkeleton />
```

### Show Error with Retry

```tsx
import { ApiErrorDisplay } from '@/components/error/api-error-display'

if (error) return <ApiErrorDisplay error={error} onRetry={fetchData} />
```

### Loading Button

```tsx
import { LoadingButton } from '@/components/ui/loading-button'

<LoadingButton loading={saving} loadingText="Saving...">
  Save
</LoadingButton>
```

### Toast Notifications

```tsx
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// Success
toast({
  title: 'Success',
  description: 'Operation completed',
  variant: 'success',
})

// Error
toast({
  title: 'Error',
  description: 'Something went wrong',
  variant: 'destructive',
})
```

### Retry with Backoff

```tsx
import { fetchWithRetry } from '@/lib/api-retry'

const response = await fetchWithRetry('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
}, {
  maxRetries: 3,
  initialDelay: 1000,
})
```

## Available Components

### Loading Skeletons
- `DashboardSkeleton` - Dashboard page
- `SessionSkeleton` - Session page
- `StorySkeleton` - Story display
- `StoryBacklogSkeleton` - Story list
- `GitHubRepositorySkeleton` - GitHub repo selector
- `GitHubIssueListSkeleton` - GitHub issues
- `GitHubProjectSkeleton` - GitHub projects

### Error Components
- `ErrorBoundary` - Catch React errors
- `ApiErrorDisplay` - Display API errors
- `SessionNotFound` - Session not found page
- `ConnectionStatus` - Socket connection status

### UI Components
- `LoadingButton` - Button with loading state
- `Alert` - Alert messages
- `Toast` - Toast notifications

## Error Codes

Common error codes you can use:

- `ErrorCode.AUTH_FAILED` - Authentication failed
- `ErrorCode.UNAUTHORIZED` - Not authorized
- `ErrorCode.SESSION_NOT_FOUND` - Session not found
- `ErrorCode.SESSION_ENDED` - Session ended
- `ErrorCode.NOT_SESSION_HOST` - Not session host
- `ErrorCode.GITHUB_API_ERROR` - GitHub API error
- `ErrorCode.NETWORK_ERROR` - Network error
- `ErrorCode.SOCKET_ERROR` - Socket error
- `ErrorCode.API_ERROR` - Generic API error

## Helper Functions

### API Helpers
```typescript
import { 
  getAuthenticatedUser,
  getSessionById,
  validateSessionHost,
  validateSessionParticipant,
  validateSessionActive,
} from '@/lib/api-helpers'
```

### Error Handling
```typescript
import {
  logError,
  createAppError,
  getUserFriendlyMessage,
  parseApiError,
  ErrorCode,
} from '@/lib/error-logger'
```

### API Error Handler
```typescript
import {
  handleApiError,
  createSuccessResponse,
  validateRequiredFields,
} from '@/lib/api-error-handler'
```

## Loading Pages

Create `loading.tsx` in route folders:

```tsx
import { SessionSkeleton } from '@/components/loading'

export default function Loading() {
  return <SessionSkeleton />
}
```

## Error Pages

- `app/not-found.tsx` - 404 page (already created)
- `app/error.tsx` - Error page (already created)
- `app/global-error.tsx` - Global error (already created)

## Best Practices

1. ✅ Always wrap client components in `ErrorBoundary`
2. ✅ Show loading skeletons for async operations
3. ✅ Use `ApiErrorDisplay` for API errors with retry
4. ✅ Use `toast` for user feedback
5. ✅ Use `LoadingButton` for async actions
6. ✅ Use helper functions in API routes
7. ✅ Log errors with context
8. ✅ Show connection status for real-time features
9. ✅ Provide retry options for failed operations
10. ✅ Use user-friendly error messages

## Testing Checklist

- [ ] Error boundary catches component errors
- [ ] Loading skeletons display correctly
- [ ] API errors show user-friendly messages
- [ ] Retry buttons work
- [ ] Toast notifications appear
- [ ] Socket reconnects automatically
- [ ] Loading states work correctly
- [ ] Error pages display properly

"use client"

/**
 * Example component demonstrating error handling best practices
 * This file serves as a reference for implementing error handling in client components
 */

import { useState, useEffect } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { ApiErrorDisplay } from '@/components/error/api-error-display'
import { SessionSkeleton } from '@/components/loading/session-skeleton'
import { LoadingButton } from '@/components/ui/loading-button'
import { useToast } from '@/hooks/use-toast'
import { fetchWithRetry } from '@/lib/api-retry'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-logger'
import type { AppError } from '@/lib/error-logger'

interface ExampleData {
  id: string
  name: string
}

function ExampleComponentInner() {
  const [data, setData] = useState<ExampleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Fetch data with error handling and retry logic
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use fetchWithRetry for automatic retry on failure
      const response = await fetchWithRetry('/api/example', {
        method: 'GET',
      }, {
        maxRetries: 3,
        initialDelay: 1000,
      })

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      // Parse error and set state
      const appError = parseApiError(err)
      setError(appError)

      // Show error toast
      toast({
        title: 'Error',
        description: getUserFriendlyMessage(appError),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Save data with error handling
  const saveData = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      // Show success toast
      toast({
        title: 'Success',
        description: 'Data saved successfully',
        variant: 'success',
      })
    } catch (err) {
      const appError = parseApiError(err)
      
      toast({
        title: 'Error',
        description: getUserFriendlyMessage(appError),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading skeleton
  if (loading) {
    return <SessionSkeleton />
  }

  // Show error with retry option
  if (error) {
    return <ApiErrorDisplay error={error} onRetry={fetchData} />
  }

  // Show content
  return (
    <div className="space-y-4">
      <h1>Example Component</h1>
      <p>Data: {data?.name}</p>
      
      <LoadingButton
        loading={saving}
        loadingText="Saving..."
        onClick={saveData}
      >
        Save
      </LoadingButton>
    </div>
  )
}

/**
 * Wrap component in ErrorBoundary to catch React errors
 */
export function ErrorHandlingExample() {
  return (
    <ErrorBoundary>
      <ExampleComponentInner />
    </ErrorBoundary>
  )
}

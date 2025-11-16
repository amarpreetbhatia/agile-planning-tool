"use client"

import { useEffect, useState } from 'react'
import { useToast } from './use-toast'
import { initSocket, disconnectSocket, getSocket } from '@/lib/socket'
import { getUserFriendlyMessage, ErrorCode, createAppError } from '@/lib/error-logger'

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed'

export function useSocketConnection(token: string | null) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (!token) {
      return
    }

    const socket = initSocket({
      token,
      onConnect: () => {
        setStatus('connected')
        setReconnectAttempt(0)
        
        // Show success toast only if we were reconnecting
        if (reconnectAttempt > 0) {
          toast({
            title: 'Reconnected',
            description: 'Real-time connection restored',
          })
        }
      },
      onDisconnect: () => {
        setStatus('disconnected')
      },
      onError: (error) => {
        const appError = createAppError(
          ErrorCode.SOCKET_ERROR,
          error.message
        )
        
        // Only show error toast if we've failed multiple times
        if (reconnectAttempt > 2) {
          toast({
            title: 'Connection Error',
            description: getUserFriendlyMessage(appError),
            variant: 'destructive',
          })
        }
      },
      onReconnecting: (attempt) => {
        setStatus('reconnecting')
        setReconnectAttempt(attempt)
        
        // Show reconnecting toast after first attempt
        if (attempt === 1) {
          toast({
            title: 'Connection Lost',
            description: 'Attempting to reconnect...',
          })
        }
      },
      onReconnectFailed: () => {
        setStatus('failed')
        toast({
          title: 'Connection Failed',
          description: 'Unable to establish real-time connection. Please refresh the page.',
          variant: 'destructive',
        })
      },
    })

    return () => {
      disconnectSocket()
    }
  }, [token, toast, reconnectAttempt])

  return {
    status,
    reconnectAttempt,
    socket: getSocket(),
    isConnected: status === 'connected',
  }
}

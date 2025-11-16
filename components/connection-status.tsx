"use client"

import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ConnectionStatus } from '@/hooks/use-socket-connection'

interface ConnectionStatusProps {
  status: ConnectionStatus
  reconnectAttempt?: number
}

export function ConnectionStatus({ status, reconnectAttempt = 0 }: ConnectionStatusProps) {
  if (status === 'connected') {
    return null // Don't show anything when connected
  }

  const statusConfig: Record<ConnectionStatus, {
    icon: typeof WifiOff | typeof Loader2
    label: string
    variant: 'secondary' | 'destructive'
    description: string
    animate?: boolean
  }> = {
    connected: {
      icon: Wifi,
      label: 'Connected',
      variant: 'secondary',
      description: 'Real-time connection active',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Disconnected',
      variant: 'secondary',
      description: 'Real-time updates unavailable',
    },
    reconnecting: {
      icon: Loader2,
      label: `Reconnecting${reconnectAttempt > 0 ? ` (${reconnectAttempt})` : ''}`,
      variant: 'secondary',
      description: 'Attempting to restore connection...',
      animate: true,
    },
    failed: {
      icon: WifiOff,
      label: 'Connection Failed',
      variant: 'destructive',
      description: 'Please refresh the page',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="gap-1.5">
            <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

'use client';

import { useSocket } from '@/hooks/use-socket';
import { Badge } from '@/components/ui/badge';

export function SocketStatus() {
  const { isConnected } = useSocket();

  return (
    <Badge variant={isConnected ? 'default' : 'secondary'}>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </Badge>
  );
}

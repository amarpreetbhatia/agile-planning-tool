'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { initSocket, disconnectSocket, getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/socket-server';

export function useSocket() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    if (!session?.user?.accessToken) {
      return;
    }

    // Initialize socket connection
    const socketInstance = initSocket({
      token: session.user.accessToken,
      onConnect: () => {
        setIsConnected(true);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onError: (error) => {
        console.error('Socket error:', error);
        setIsConnected(false);
      },
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      disconnectSocket();
      setIsConnected(false);
      setSocket(null);
    };
  }, [session?.user?.accessToken]);

  return {
    socket,
    isConnected,
  };
}

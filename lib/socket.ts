import { io, Socket } from 'socket.io-client';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@/socket-server';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export interface SocketConfig {
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Initialize Socket.IO client connection
 */
export function initSocket(config: SocketConfig): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) {
    return socket;
  }

  const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

  socket = io(url, {
    path: '/api/socket',
    auth: {
      token: config.token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket?.id);
    config.onConnect?.();
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
    config.onDisconnect?.();
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
    config.onError?.(error);
  });

  socket.on('error', (message: string) => {
    console.error('Socket.IO error:', message);
    config.onError?.(new Error(message));
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}

/**
 * Disconnect and cleanup socket connection
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a session room
 */
export function joinSession(sessionId: string) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('session:join', sessionId);
}

/**
 * Leave a session room
 */
export function leaveSession(sessionId: string) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('session:leave', sessionId);
}

/**
 * Cast a vote
 */
export function castVote(sessionId: string, value: number) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('vote:cast', sessionId, value);
}

/**
 * Change a vote
 */
export function changeVote(sessionId: string, value: number) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('vote:change', sessionId, value);
}

/**
 * Select a story (host only)
 */
export function selectStory(sessionId: string, story: any) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('story:select', sessionId, story);
}

/**
 * Reveal round results (host only)
 */
export function revealRound(sessionId: string) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('round:reveal', sessionId);
}

/**
 * Finalize estimate (host only)
 */
export function finalizeEstimate(sessionId: string, value: number) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('estimate:finalize', sessionId, value);
}

/**
 * End session (host only)
 */
export function endSession(sessionId: string) {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('session:end', sessionId);
}

/**
 * Subscribe to participant joined events
 */
export function onParticipantJoined(callback: (participant: any) => void) {
  socket?.on('participant:joined', callback);
  return () => socket?.off('participant:joined', callback);
}

/**
 * Subscribe to participant left events
 */
export function onParticipantLeft(callback: (userId: string) => void) {
  socket?.on('participant:left', callback);
  return () => socket?.off('participant:left', callback);
}

/**
 * Subscribe to vote cast events
 */
export function onVoteCast(callback: (userId: string, hasVoted: boolean) => void) {
  socket?.on('vote:cast', callback);
  return () => socket?.off('vote:cast', callback);
}

/**
 * Subscribe to story selected events
 */
export function onStorySelected(callback: (story: any) => void) {
  socket?.on('story:selected', callback);
  return () => socket?.off('story:selected', callback);
}

/**
 * Subscribe to round revealed events
 */
export function onRoundRevealed(callback: (results: any) => void) {
  socket?.on('round:revealed', callback);
  return () => socket?.off('round:revealed', callback);
}

/**
 * Subscribe to estimate finalized events
 */
export function onEstimateFinalized(callback: (value: number) => void) {
  socket?.on('estimate:finalized', callback);
  return () => socket?.off('estimate:finalized', callback);
}

/**
 * Subscribe to session ended events
 */
export function onSessionEnded(callback: () => void) {
  socket?.on('session:ended', callback);
  return () => socket?.off('session:ended', callback);
}

/**
 * Check if socket is connected
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}

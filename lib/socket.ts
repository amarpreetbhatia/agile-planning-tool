import { io, Socket } from 'socket.io-client';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@/socket-server';
import { logError, createAppError, ErrorCode } from './error-logger';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export interface SocketConfig {
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onReconnecting?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

/**
 * Calculate exponential backoff delay
 */
function getReconnectDelay(attempt: number): number {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Initialize Socket.IO client connection with enhanced error handling
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
    reconnectionDelayMax: 30000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket?.id);
    reconnectAttempts = 0;
    config.onConnect?.();
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
    
    // Log disconnect reason
    logError(
      createAppError(ErrorCode.SOCKET_ERROR, `Disconnected: ${reason}`),
      'Socket.IO'
    );
    
    config.onDisconnect?.();
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.error(`Socket.IO connection error (attempt ${reconnectAttempts}):`, error);
    
    logError(
      createAppError(
        ErrorCode.SOCKET_ERROR,
        `Connection error: ${error.message}`,
        undefined,
        { attempt: reconnectAttempts }
      ),
      'Socket.IO'
    );
    
    config.onError?.(error);
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      config.onReconnecting?.(reconnectAttempts);
    } else {
      config.onReconnectFailed?.();
    }
  });

  socket.on('error', (message: string) => {
    console.error('Socket.IO error:', message);
    
    logError(
      createAppError(ErrorCode.SOCKET_ERROR, message),
      'Socket.IO'
    );
    
    config.onError?.(new Error(message));
  });

  // Handle reconnection attempts
  socket.io.on('reconnect_attempt', (attempt) => {
    console.log(`Reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
    config.onReconnecting?.(attempt);
  });

  socket.io.on('reconnect_failed', () => {
    console.error('Socket.IO reconnection failed after maximum attempts');
    
    logError(
      createAppError(
        ErrorCode.SOCKET_ERROR,
        'Failed to reconnect after maximum attempts'
      ),
      'Socket.IO'
    );
    
    config.onReconnectFailed?.();
  });

  socket.io.on('reconnect', (attempt) => {
    console.log(`Socket.IO reconnected after ${attempt} attempts`);
    reconnectAttempts = 0;
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
    console.warn('Socket not connected, waiting for connection...');
    // Wait for connection and retry
    socket?.once('connect', () => {
      console.log('Socket connected, joining session:', sessionId);
      socket?.emit('session:join', sessionId);
    });
    return;
  }
  socket.emit('session:join', sessionId);
}

/**
 * Leave a session room
 */
export function leaveSession(sessionId: string) {
  if (!socket?.connected) {
    console.warn('Socket not connected, cannot leave session');
    return;
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

/**
 * Send typing indicator
 */
export function sendTypingIndicator(sessionId: string, isTyping: boolean) {
  if (!socket?.connected) {
    console.warn('Socket not connected, cannot send typing indicator');
    return;
  }
  socket.emit('chat:typing', sessionId, isTyping);
}

/**
 * Subscribe to chat message events
 */
export function onChatMessage(callback: (message: any) => void) {
  socket?.on('chat:message', callback);
  return () => socket?.off('chat:message', callback);
}

/**
 * Subscribe to typing indicator events
 */
export function onChatTyping(callback: (userId: string, username: string, isTyping: boolean) => void) {
  socket?.on('chat:typing', callback);
  return () => socket?.off('chat:typing', callback);
}

/**
 * Subscribe to vote reminder events
 */
export function onVoteReminder(callback: (message: string) => void) {
  socket?.on('vote:reminder', callback);
  return () => socket?.off('vote:reminder', callback);
}

/**
 * Subscribe to vote status events (includes voting mode and value for open mode)
 */
export function onVoteStatus(callback: (userId: string, hasVoted: boolean, votingMode: string, value?: number) => void) {
  socket?.on('vote:status', callback);
  return () => socket?.off('vote:status', callback);
}

/**
 * Subscribe to voting mode changed events
 */
export function onVotingModeChanged(callback: (votingMode: string) => void) {
  socket?.on('voting-mode:changed', callback);
  return () => socket?.off('voting-mode:changed', callback);
}

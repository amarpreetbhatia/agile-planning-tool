import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export interface ClientToServerEvents {
  'session:join': (sessionId: string) => void;
  'session:leave': (sessionId: string) => void;
  'vote:cast': (sessionId: string, value: number) => void;
  'vote:change': (sessionId: string, value: number) => void;
  'story:select': (sessionId: string, story: any) => void;
  'round:reveal': (sessionId: string) => void;
  'estimate:finalize': (sessionId: string, value: number) => void;
  'session:end': (sessionId: string) => void;
  'chat:typing': (sessionId: string, isTyping: boolean) => void;
}

export interface ServerToClientEvents {
  'participant:joined': (participant: any) => void;
  'participant:left': (userId: string) => void;
  'vote:cast': (userId: string, hasVoted: boolean) => void;
  'story:selected': (story: any) => void;
  'round:revealed': (results: any) => void;
  'estimate:finalized': (value: number) => void;
  'session:ended': () => void;
  'error': (message: string) => void;
  'chat:message': (message: any) => void;
  'chat:typing': (userId: string, username: string, isTyping: boolean) => void;
  'story:comment': (storyId: string, comment: any) => void;
}

export interface SocketData {
  userId?: string;
  username?: string;
  sessionId?: string;
}

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
> | null = null;

export function initSocketServer(httpServer?: HTTPServer) {
  // Check if io is already available globally (set by server.js)
  if ((global as any).io) {
    io = (global as any).io;
  }

  if (io) {
    setupSocketHandlers(io);
    return io;
  }

  // Fallback: create new instance if httpServer is provided
  if (httpServer) {
    io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      {},
      SocketData
    >(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/api/socket',
    });
    
    setupSocketHandlers(io);
    return io;
  }

  throw new Error('Socket.IO server not initialized and no HTTP server provided');
}

function setupSocketHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
) {

  // Authentication middleware
  io.use(async (socket: TypedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;

      if (!decoded || !decoded.sub) {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user data to socket
      socket.data.userId = decoded.sub;
      socket.data.username = decoded.name || 'Unknown';
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id} (User: ${socket.data.username})`);

    // Session join handler
    socket.on('session:join', async (sessionId: string) => {
      try {
        socket.join(sessionId);
        socket.data.sessionId = sessionId;
        console.log(`User ${socket.data.username} joined session ${sessionId}`);
        
        // Update participant online status in database
        const mongoose = await import('mongoose');
        const Session = (await import('./models/Session')).default;
        
        if (mongoose.default.connection.readyState === 1) {
          const session = await Session.findOne({ sessionId });
          if (session) {
            const participant = session.participants.find(
              (p: any) => p.userId.toString() === socket.data.userId
            );
            if (participant) {
              participant.isOnline = true;
              await session.save();
            }
          }
        }
        
        // Notify other participants
        socket.to(sessionId).emit('participant:joined', {
          userId: socket.data.userId,
          username: socket.data.username,
          joinedAt: new Date(),
          isOnline: true,
        });
      } catch (error) {
        console.error('Error in session:join handler:', error);
        socket.emit('error', 'Failed to join session');
      }
    });

    // Session leave handler
    socket.on('session:leave', async (sessionId: string) => {
      try {
        socket.leave(sessionId);
        console.log(`User ${socket.data.username} left session ${sessionId}`);
        
        // Update participant online status in database
        const mongoose = await import('mongoose');
        const Session = (await import('./models/Session')).default;
        
        if (mongoose.default.connection.readyState === 1) {
          const session = await Session.findOne({ sessionId });
          if (session) {
            const participant = session.participants.find(
              (p: any) => p.userId.toString() === socket.data.userId
            );
            if (participant) {
              participant.isOnline = false;
              await session.save();
            }
          }
        }
        
        // Notify other participants
        socket.to(sessionId).emit('participant:left', socket.data.userId!);
        socket.data.sessionId = undefined;
      } catch (error) {
        console.error('Error in session:leave handler:', error);
        socket.emit('error', 'Failed to leave session');
      }
    });

    // Vote cast handler
    socket.on('vote:cast', (sessionId: string, value: number) => {
      console.log(`User ${socket.data.username} cast vote ${value} in session ${sessionId}`);
      
      // Broadcast voting status (not the actual value)
      socket.to(sessionId).emit('vote:cast', socket.data.userId!, true);
    });

    // Vote change handler
    socket.on('vote:change', (sessionId: string, value: number) => {
      console.log(`User ${socket.data.username} changed vote to ${value} in session ${sessionId}`);
      
      // Broadcast voting status update
      socket.to(sessionId).emit('vote:cast', socket.data.userId!, true);
    });

    // Story select handler (host only - validation should be done in API)
    socket.on('story:select', (sessionId: string, story: any) => {
      console.log(`Story selected in session ${sessionId}:`, story.title);
      
      // Broadcast to all participants in the session
      io!.to(sessionId).emit('story:selected', story);
    });

    // Round reveal handler (host only - validation should be done in API)
    socket.on('round:reveal', (sessionId: string) => {
      console.log(`Round revealed in session ${sessionId}`);
      // Results will be broadcast from API after calculation
    });

    // Estimate finalize handler (host only - validation should be done in API)
    socket.on('estimate:finalize', (sessionId: string, value: number) => {
      console.log(`Estimate finalized in session ${sessionId}: ${value}`);
      
      // Broadcast to all participants
      io!.to(sessionId).emit('estimate:finalized', value);
    });

    // Session end handler (host only - validation should be done in API)
    socket.on('session:end', (sessionId: string) => {
      console.log(`Session ended: ${sessionId}`);
      
      // Broadcast to all participants
      io!.to(sessionId).emit('session:ended');
      
      // Disconnect all sockets in the room
      const socketsInRoom = io!.sockets.adapter.rooms.get(sessionId);
      if (socketsInRoom) {
        socketsInRoom.forEach((socketId) => {
          const socket = io!.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(sessionId);
          }
        });
      }
    });

    // Chat typing indicator handler
    socket.on('chat:typing', (sessionId: string, isTyping: boolean) => {
      // Broadcast typing status to other participants (not to sender)
      socket.to(sessionId).emit('chat:typing', socket.data.userId!, socket.data.username!, isTyping);
    });

    // Disconnection handler
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id} (User: ${socket.data.username})`);
      
      // Update participant online status in database
      if (socket.data.sessionId && socket.data.userId) {
        try {
          const mongoose = await import('mongoose');
          const Session = (await import('./models/Session')).default;
          
          if (mongoose.default.connection.readyState === 1) {
            const session = await Session.findOne({ sessionId: socket.data.sessionId });
            if (session) {
              const participant = session.participants.find(
                (p: any) => p.userId.toString() === socket.data.userId
              );
              if (participant) {
                participant.isOnline = false;
                await session.save();
              }
            }
          }
          
          // Notify session participants
          socket.to(socket.data.sessionId).emit('participant:left', socket.data.userId);
        } catch (error) {
          console.error('Error updating participant status on disconnect:', error);
        }
      }
    });
  });
}

export function getSocketServer() {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}

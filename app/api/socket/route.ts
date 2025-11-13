import { NextRequest } from 'next/server';
import { Server as HTTPServer } from 'http';
import { initSocketServer } from '@/socket-server';

// This is a workaround for Next.js App Router to support Socket.IO
// Socket.IO needs an HTTP server, but Next.js App Router doesn't expose it directly
// In production, you may need to use a custom server or deploy Socket.IO separately

let socketInitialized = false;

export async function GET(req: NextRequest) {
  if (!socketInitialized) {
    try {
      // In development, we can access the server through the global object
      // This is set up in the custom server or through Next.js internals
      const httpServer = (global as any).httpServer as HTTPServer;
      
      if (httpServer) {
        initSocketServer(httpServer);
        socketInitialized = true;
        console.log('Socket.IO server initialized');
      } else {
        console.warn('HTTP server not available. Socket.IO requires a custom server setup.');
        return new Response(
          JSON.stringify({ 
            error: 'Socket.IO requires custom server setup',
            message: 'Please use a custom server for Socket.IO support'
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error('Failed to initialize Socket.IO:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize Socket.IO',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return new Response(
    JSON.stringify({ 
      status: 'Socket.IO server running',
      path: '/api/socket'
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

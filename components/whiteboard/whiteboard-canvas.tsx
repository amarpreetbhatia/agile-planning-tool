'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Tldraw, Editor, TLRecord, TLStoreSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { useSocket } from '@/hooks/use-socket';
import { throttle } from 'lodash';

interface WhiteboardCanvasProps {
  sessionId: string;
  onSnapshot?: (data: TLStoreSnapshot) => void;
  initialData?: TLStoreSnapshot;
  readOnly?: boolean;
}

export function WhiteboardCanvas({
  sessionId,
  onSnapshot,
  initialData,
  readOnly = false,
}: WhiteboardCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const { socket, isConnected } = useSocket();
  const [isReady, setIsReady] = useState(false);
  const isApplyingRemoteChange = useRef(false);

  // Handle editor mount
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    setIsReady(true);

    // Load initial data if provided
    if (initialData) {
      try {
        // tldraw v2 uses different API for loading snapshots
        editor.store.mergeRemoteChanges(() => {
          editor.store.put(Object.values(initialData.store));
        });
      } catch (error) {
        console.error('Error loading initial whiteboard data:', error);
      }
    }
  }, [initialData]);

  // Throttled function to broadcast changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const broadcastChange = useCallback(
    throttle((data: TLStoreSnapshot) => {
      if (socket && isConnected && !isApplyingRemoteChange.current) {
        socket.emit('whiteboard:update', sessionId, data);
      }
    }, 100), // Throttle to 100ms for performance
    [socket, isConnected, sessionId]
  );

  // Listen for store changes and broadcast
  useEffect(() => {
    if (!editorRef.current || readOnly) return;

    const editor = editorRef.current;

    const handleChange = () => {
      if (isApplyingRemoteChange.current) return;
      
      try {
        // Get all records from the store
        const records = editor.store.allRecords();
        const snapshot = { store: records };
        broadcastChange(snapshot as any);
      } catch (error) {
        console.error('Error getting whiteboard snapshot:', error);
      }
    };

    // Listen to store changes
    const unsubscribe = editor.store.listen(handleChange, {
      source: 'user',
      scope: 'document',
    });

    return () => {
      unsubscribe();
    };
  }, [isReady, readOnly, broadcastChange]);

  // Listen for remote changes
  useEffect(() => {
    if (!socket || !isConnected || !editorRef.current) return;

    const handleRemoteUpdate = (data: any, userId: string, username: string) => {
      if (!editorRef.current) return;

      try {
        isApplyingRemoteChange.current = true;
        // Apply remote changes using mergeRemoteChanges
        editorRef.current.store.mergeRemoteChanges(() => {
          if (data.store) {
            editorRef.current!.store.put(Object.values(data.store));
          }
        });
      } catch (error) {
        console.error('Error applying remote whiteboard update:', error);
      } finally {
        // Reset flag after a short delay to ensure the change is fully applied
        setTimeout(() => {
          isApplyingRemoteChange.current = false;
        }, 50);
      }
    };

    socket.on('whiteboard:update', handleRemoteUpdate);

    return () => {
      socket.off('whiteboard:update', handleRemoteUpdate);
    };
  }, [socket, isConnected]);

  // Export snapshot function
  const exportSnapshot = useCallback(async () => {
    if (!editorRef.current) return null;

    try {
      // Get all records from the store
      const records = editorRef.current.store.allRecords();
      const snapshot = { store: records };
      
      if (onSnapshot) {
        onSnapshot(snapshot as any);
      }

      return snapshot;
    } catch (error) {
      console.error('Error exporting whiteboard snapshot:', error);
      return null;
    }
  }, [onSnapshot]);

  // Expose export function via ref
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any).exportSnapshot = exportSnapshot;
    }
  }, [exportSnapshot]);

  return (
    <div className="w-full h-full">
      <Tldraw
        onMount={handleMount}
        autoFocus={!readOnly}
        inferDarkMode
      />
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './use-socket';
import { useToast } from './use-toast';

interface WhiteboardSnapshot {
  _id: string;
  sessionId: string;
  storyId?: string;
  createdBy: string;
  data: any;
  imageUrl?: string;
  title?: string;
  createdAt: string;
}

export function useWhiteboard(sessionId: string) {
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<WhiteboardSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch snapshots
  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/whiteboard/snapshots`);
      const result = await response.json();

      if (result.success) {
        setSnapshots(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch snapshots');
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load whiteboard snapshots',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  // Save snapshot
  const saveSnapshot = useCallback(
    async (data: any, title?: string, storyId?: string) => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/whiteboard/snapshots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data,
            title: title || `Snapshot ${new Date().toLocaleString()}`,
            storyId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSnapshots((prev) => [result.data, ...prev]);
          
          // Broadcast snapshot creation
          if (socket && isConnected) {
            socket.emit('whiteboard:snapshot', sessionId, result.data._id);
          }

          return result.data;
        } else {
          throw new Error(result.error?.message || 'Failed to save snapshot');
        }
      } catch (error) {
        console.error('Error saving snapshot:', error);
        throw error;
      }
    },
    [sessionId, socket, isConnected]
  );

  // Delete snapshot
  const deleteSnapshot = useCallback(
    async (snapshotId: string) => {
      try {
        const response = await fetch(
          `/api/sessions/${sessionId}/whiteboard/snapshots/${snapshotId}`,
          {
            method: 'DELETE',
          }
        );

        const result = await response.json();

        if (result.success) {
          setSnapshots((prev) => prev.filter((s) => s._id !== snapshotId));
          return true;
        } else {
          throw new Error(result.error?.message || 'Failed to delete snapshot');
        }
      } catch (error) {
        console.error('Error deleting snapshot:', error);
        throw error;
      }
    },
    [sessionId]
  );

  // Attach snapshot to story
  const attachToStory = useCallback(
    async (snapshotId: string, storyId: string) => {
      try {
        const response = await fetch(
          `/api/sessions/${sessionId}/whiteboard/snapshots/${snapshotId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ storyId }),
          }
        );

        const result = await response.json();

        if (result.success) {
          setSnapshots((prev) =>
            prev.map((s) => (s._id === snapshotId ? result.data : s))
          );
          return result.data;
        } else {
          throw new Error(result.error?.message || 'Failed to attach snapshot');
        }
      } catch (error) {
        console.error('Error attaching snapshot:', error);
        throw error;
      }
    },
    [sessionId]
  );

  // Listen for new snapshots
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewSnapshot = (data: { snapshotId: string }) => {
      // Refresh snapshots when a new one is created
      fetchSnapshots();
      
      toast({
        title: 'New snapshot',
        description: 'A team member saved a whiteboard snapshot',
      });
    };

    socket.on('whiteboard:snapshot', handleNewSnapshot);

    return () => {
      socket.off('whiteboard:snapshot', handleNewSnapshot);
    };
  }, [socket, isConnected, fetchSnapshots, toast]);

  // Initial fetch
  useEffect(() => {
    fetchSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    snapshots,
    loading,
    saveSnapshot,
    deleteSnapshot,
    attachToStory,
    refreshSnapshots: fetchSnapshots,
  };
}

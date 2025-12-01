'use client';

import { useState, useEffect, useCallback } from 'react';
import { IExternalEmbed } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/use-socket';

interface UseEmbedsOptions {
  sessionId: string;
  enabled?: boolean;
}

export function useEmbeds({ sessionId, enabled = true }: UseEmbedsOptions) {
  const [embeds, setEmbeds] = useState<IExternalEmbed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { socket } = useSocket();

  // Fetch embeds
  const fetchEmbeds = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/embeds`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch embeds');
      }

      setEmbeds(data.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching embeds:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, enabled]);

  // Listen for Socket.IO events
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleEmbedAdded = (embed: IExternalEmbed) => {
      setEmbeds((prev) => [...prev, embed]);
      toast({
        title: 'Embed added',
        description: `${embed.title} has been added to the session`,
      });
    };

    const handleEmbedRemoved = (embedId: string) => {
      setEmbeds((prev) => prev.filter((e) => e.id !== embedId));
      toast({
        title: 'Embed removed',
        description: 'An embed has been removed from the session',
      });
    };

    const handleEmbedStateUpdated = (embedId: string, panelState: IExternalEmbed['panelState']) => {
      setEmbeds((prev) =>
        prev.map((e) => (e.id === embedId ? { ...e, panelState } : e))
      );
    };

    socket.on('embed:added', handleEmbedAdded);
    socket.on('embed:removed', handleEmbedRemoved);
    socket.on('embed:state-updated', handleEmbedStateUpdated);

    return () => {
      socket.off('embed:added', handleEmbedAdded);
      socket.off('embed:removed', handleEmbedRemoved);
      socket.off('embed:state-updated', handleEmbedStateUpdated);
    };
  }, [socket, enabled, toast]);

  // Add embed
  const addEmbed = useCallback(
    async (url: string, title: string) => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/embeds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, title }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to add embed');
        }

        setEmbeds((prev) => [...prev, data.data]);
        
        toast({
          title: 'Embed added',
          description: 'External tool has been added to the session',
        });

        return data.data;
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [sessionId, toast]
  );

  // Remove embed
  const removeEmbed = useCallback(
    async (embedId: string) => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/embeds/${embedId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to remove embed');
        }

        setEmbeds((prev) => prev.filter((e) => e.id !== embedId));
        
        toast({
          title: 'Embed removed',
          description: 'External tool has been removed from the session',
        });
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [sessionId, toast]
  );

  // Update embed panel state
  const updateEmbedState = useCallback(
    async (embedId: string, panelState: IExternalEmbed['panelState']) => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/embeds/${embedId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ panelState }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to update embed');
        }

        setEmbeds((prev) =>
          prev.map((e) => (e.id === embedId ? { ...e, panelState } : e))
        );
      } catch (err: any) {
        console.error('Error updating embed state:', err);
        // Don't show toast for state updates as they happen frequently
      }
    },
    [sessionId]
  );

  // Initial fetch
  useEffect(() => {
    fetchEmbeds();
  }, [fetchEmbeds]);

  return {
    embeds,
    isLoading,
    error,
    addEmbed,
    removeEmbed,
    updateEmbedState,
    refetch: fetchEmbeds,
  };
}

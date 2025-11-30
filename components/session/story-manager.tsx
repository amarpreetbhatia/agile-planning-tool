'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { IStory } from '@/types';
import { StoryDisplay } from './story-display';
import { StoryBacklog } from './story-backlog';
import { useToast } from '@/hooks/use-toast';
import { getSocket, onStorySelected } from '@/lib/socket';

interface StoryManagerProps {
  sessionId: string;
  initialStories: IStory[];
  initialCurrentStory?: IStory;
  isHost: boolean;
}

export function StoryManager({
  sessionId,
  initialStories,
  initialCurrentStory,
  isHost,
}: StoryManagerProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [stories, setStories] = useState<IStory[]>(initialStories);
  const [currentStory, setCurrentStory] = useState<IStory | null>(
    initialCurrentStory || null
  );
  const [isSelecting, setIsSelecting] = useState(false);

  // Subscribe to real-time story selection updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const unsubscribeStorySelected = onStorySelected((story: IStory | null) => {
      setCurrentStory(story);
      
      if (story) {
        toast({
          title: 'Story Selected',
          description: `Now estimating: ${story.title}`,
        });
      } else {
        toast({
          title: 'Story Cleared',
          description: 'No story is currently selected.',
        });
      }
    });

    // Listen for story reordering
    const handleStoriesReordered = (data: { stories: IStory[] }) => {
      setStories(data.stories);
    };

    // Listen for story status updates
    const handleStoryStatusUpdated = (data: { storyId: string; status: string }) => {
      setStories((prev) =>
        prev.map((s) =>
          s.id === data.storyId ? { ...s, status: data.status as any } : s
        )
      );
    };

    // Listen for bulk updates
    const handleStoriesBulkUpdated = (data: { stories: IStory[] }) => {
      setStories(data.stories);
    };

    socket.on('stories:reordered', handleStoriesReordered);
    socket.on('story:status-updated', handleStoryStatusUpdated);
    socket.on('stories:bulk-updated', handleStoriesBulkUpdated);

    return () => {
      unsubscribeStorySelected();
      socket.off('stories:reordered', handleStoriesReordered);
      socket.off('story:status-updated', handleStoryStatusUpdated);
      socket.off('stories:bulk-updated', handleStoriesBulkUpdated);
    };
  }, [toast]);

  const handleStorySelect = async (story: IStory) => {
    if (!isHost) {
      toast({
        title: 'Permission Denied',
        description: 'Only the host can select stories.',
        variant: 'destructive',
      });
      return;
    }

    setIsSelecting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ story }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to select story');
      }

      const data = await response.json();
      setCurrentStory(data.story);

      toast({
        title: 'Story Selected',
        description: `Now estimating: ${story.title}`,
      });
    } catch (error) {
      console.error('Error selecting story:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to select story',
        variant: 'destructive',
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const handleStoryClear = async () => {
    if (!isHost) return;

    setIsSelecting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/story`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear story');
      }

      setCurrentStory(null);

      toast({
        title: 'Story Cleared',
        description: 'No story is currently selected.',
      });
    } catch (error) {
      console.error('Error clearing story:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clear story',
        variant: 'destructive',
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const handleStoryCreate = async (story: IStory) => {
    try {
      // Add story to session's story list
      const response = await fetch(`/api/sessions/${sessionId}/github/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stories: [story] }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add story');
      }

      // Update local state
      setStories((prev) => [...prev, story]);

      toast({
        title: 'Story Created',
        description: `"${story.title}" has been added to the backlog.`,
      });
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create story',
        variant: 'destructive',
      });
    }
  };

  const handleStoriesUpdate = (updatedStories: IStory[]) => {
    setStories(updatedStories);
  };

  return (
    <div className="space-y-6">
      <StoryDisplay
        story={currentStory}
        isHost={isHost}
        onClearStory={isHost ? handleStoryClear : undefined}
      />
      
      <StoryBacklog
        sessionId={sessionId}
        stories={stories}
        currentStoryId={currentStory?.id}
        isHost={isHost}
        onStorySelect={handleStorySelect}
        onStoryCreate={handleStoryCreate}
        onStoriesUpdate={handleStoriesUpdate}
      />
    </div>
  );
}

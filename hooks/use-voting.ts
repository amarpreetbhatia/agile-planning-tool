'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CardValue } from '@/components/poker/poker-card';

interface UseVotingOptions {
  sessionId: string;
  currentStoryId?: string;
  initialValue?: CardValue | null;
  initialHasVoted?: boolean;
  onVoteSuccess?: () => void;
}

interface VoteResponse {
  success: boolean;
  vote: {
    value: number;
    votedAt: Date;
    isChange: boolean;
  };
}

export function useVoting({ 
  sessionId, 
  currentStoryId, 
  initialValue = null,
  initialHasVoted = false,
  onVoteSuccess 
}: UseVotingOptions) {
  const [selectedValue, setSelectedValue] = useState<CardValue | null>(initialValue);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  // Update state when initial values change
  useEffect(() => {
    setSelectedValue(initialValue);
    setHasVoted(initialHasVoted);
  }, [initialValue, initialHasVoted]);

  // Reset vote when story changes
  useEffect(() => {
    setSelectedValue(null);
    setHasVoted(false);
  }, [currentStoryId]);

  const castVote = useCallback(
    async (value: CardValue, comment?: string) => {
      if (!currentStoryId) {
        toast({
          title: 'No Active Story',
          description: 'Please wait for the host to select a story.',
          variant: 'destructive',
        });
        return;
      }

      setIsVoting(true);

      try {
        const response = await fetch(`/api/sessions/${sessionId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value, comment }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to cast vote');
        }

        const data: VoteResponse = await response.json();

        // Optimistic update
        setSelectedValue(value);
        setHasVoted(true);

        toast({
          title: data.vote.isChange ? 'Vote Updated' : 'Vote Cast',
          description: data.vote.isChange
            ? `Your vote has been changed to ${value}`
            : `You voted ${value}`,
        });

        onVoteSuccess?.();
      } catch (error) {
        console.error('Error casting vote:', error);
        toast({
          title: 'Vote Failed',
          description: error instanceof Error ? error.message : 'Failed to cast vote',
          variant: 'destructive',
        });
      } finally {
        setIsVoting(false);
      }
    },
    [sessionId, currentStoryId, toast, onVoteSuccess]
  );

  const changeVote = useCallback(
    async (value: CardValue, comment?: string) => {
      // Same as castVote - the API handles both cases
      await castVote(value, comment);
    },
    [castVote]
  );

  return {
    selectedValue,
    hasVoted,
    isVoting,
    castVote,
    changeVote,
  };
}

'use client';

import { useEffect, useState } from 'react';
import { PokerCardSelector } from '@/components/poker/poker-card-selector';
import { useVoting } from '@/hooks/use-voting';
import { onStorySelected } from '@/lib/socket';
import { IStory } from '@/types';
import { createPortal } from 'react-dom';
import { CardValue } from '@/components/poker/poker-card';

interface SessionVotingHandlerProps {
  sessionId: string;
  userId: string;
  isParticipant: boolean;
  initialStory?: IStory | null;
}

export function SessionVotingHandler({
  sessionId,
  userId,
  isParticipant,
  initialStory,
}: SessionVotingHandlerProps) {
  const [currentStory, setCurrentStory] = useState<IStory | null>(initialStory || null);
  const [mounted, setMounted] = useState(false);
  const [initialVote, setInitialVote] = useState<CardValue | null>(null);
  const [initialHasVoted, setInitialHasVoted] = useState(false);

  const { selectedValue, hasVoted, isVoting, castVote } = useVoting({
    sessionId,
    currentStoryId: currentStory?.id,
    initialValue: initialVote,
    initialHasVoted,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial voting status
  useEffect(() => {
    if (!currentStory) return;

    const fetchVotingStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/votes`);
        if (response.ok) {
          const data = await response.json();
          if (data.currentUserVote) {
            setInitialVote(data.currentUserVote.value);
            setInitialHasVoted(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch voting status:', error);
      }
    };

    fetchVotingStatus();
  }, [sessionId, currentStory]);

  useEffect(() => {
    // Subscribe to story selection events
    const unsubscribe = onStorySelected((story: IStory) => {
      setCurrentStory(story);
      setInitialVote(null);
      setInitialHasVoted(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isParticipant || !mounted) {
    return null;
  }

  const container = document.getElementById('poker-card-selector-container');
  if (!container) {
    return null;
  }

  return createPortal(
    <PokerCardSelector
      currentStory={currentStory}
      selectedValue={selectedValue}
      onCardSelect={castVote}
      hasVoted={hasVoted}
      isRoundActive={!!currentStory}
    />,
    container
  );
}

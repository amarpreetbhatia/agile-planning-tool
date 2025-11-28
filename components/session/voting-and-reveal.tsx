'use client';

import { useEffect, useState } from 'react';
import { onVoteCast } from '@/lib/socket';
import { ISerializedParticipant } from '@/types';
import { RevealControl } from '@/components/session/reveal-control';
import { ResponsiveParticipantList } from '@/components/session/responsive-participant-list';

interface VotingAndRevealProps {
  participants: ISerializedParticipant[];
  currentStory?: {
    id: string;
    title: string;
  } | null;
  sessionId: string;
  isHost: boolean;
  className?: string;
}

interface VoteStatus {
  [userId: string]: boolean;
}

export function VotingAndReveal({
  participants,
  currentStory,
  sessionId,
  isHost,
  className,
}: VotingAndRevealProps) {
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({});

  // Fetch initial vote status
  useEffect(() => {
    if (!currentStory) {
      setVoteStatus({});
      return;
    }

    const fetchVotingStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/votes`);
        if (response.ok) {
          const data = await response.json();
          if (data.voteStatus) {
            setVoteStatus(data.voteStatus);
          }
        }
      } catch (error) {
        console.error('Failed to fetch voting status:', error);
      }
    };

    fetchVotingStatus();
  }, [sessionId, currentStory]);

  useEffect(() => {
    // Subscribe to vote cast events
    const unsubscribe = onVoteCast((userId: string, hasVoted: boolean) => {
      setVoteStatus((prev) => ({
        ...prev,
        [userId]: hasVoted,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!currentStory) {
    return null;
  }

  const votedCount = Object.values(voteStatus).filter(Boolean).length;
  const totalParticipants = participants.filter((p) => p.isOnline).length;

  return (
    <div className={className}>
      {/* Reveal Control (shows results when revealed) */}
      <RevealControl
        sessionId={sessionId}
        isHost={isHost}
        currentStory={currentStory}
        participants={participants}
        voteStatus={voteStatus}
        className="mb-6"
      />

      {/* Participant Voting Status */}
      <ResponsiveParticipantList
        participants={participants}
        voteStatus={voteStatus}
        votedCount={votedCount}
        totalParticipants={totalParticipants}
      />
    </div>
  );
}

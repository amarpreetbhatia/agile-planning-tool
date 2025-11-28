'use client';

import { useEffect, useState } from 'react';
import { onVoteCast, onVoteStatus, onVotingModeChanged, onRevote } from '@/lib/socket';
import { ISerializedParticipant } from '@/types';
import { RevealControl } from '@/components/session/reveal-control';
import { ResponsiveParticipantList } from '@/components/session/responsive-participant-list';
import { VotingModeSelector } from '@/components/session/voting-mode-selector';
import { VoteHistoryPanel } from '@/components/session/vote-history-panel';

interface VotingAndRevealProps {
  participants: ISerializedParticipant[];
  currentStory?: {
    id: string;
    title: string;
  } | null;
  sessionId: string;
  isHost: boolean;
  votingMode?: 'anonymous' | 'open';
  className?: string;
}

interface VoteStatus {
  [userId: string]: boolean;
}

interface VoteValues {
  [userId: string]: number;
}

export function VotingAndReveal({
  participants,
  currentStory,
  sessionId,
  isHost,
  votingMode: initialVotingMode = 'anonymous',
  className,
}: VotingAndRevealProps) {
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({});
  const [voteValues, setVoteValues] = useState<VoteValues>({});
  const [votingMode, setVotingMode] = useState<'anonymous' | 'open'>(initialVotingMode);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch initial vote status
  useEffect(() => {
    if (!currentStory) {
      setVoteStatus({});
      setVoteValues({});
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
          if (data.voteValues) {
            setVoteValues(data.voteValues);
          }
          if (data.votingMode) {
            setVotingMode(data.votingMode);
          }
        }
      } catch (error) {
        console.error('Failed to fetch voting status:', error);
      }
    };

    fetchVotingStatus();
  }, [sessionId, currentStory]);

  useEffect(() => {
    // Subscribe to vote cast events (legacy)
    const unsubscribeVoteCast = onVoteCast((userId: string, hasVoted: boolean) => {
      setVoteStatus((prev) => ({
        ...prev,
        [userId]: hasVoted,
      }));
    });

    // Subscribe to vote status events (includes voting mode and value)
    const unsubscribeVoteStatus = onVoteStatus((userId: string, hasVoted: boolean, mode: string, value?: number) => {
      setVoteStatus((prev) => ({
        ...prev,
        [userId]: hasVoted,
      }));
      
      // Update vote values if in open mode and value is provided
      if (mode === 'open' && value !== undefined) {
        setVoteValues((prev) => ({
          ...prev,
          [userId]: value,
        }));
      }
    });

    // Subscribe to voting mode changed events
    const unsubscribeVotingMode = onVotingModeChanged((newMode: string) => {
      setVotingMode(newMode as 'anonymous' | 'open');
      // Clear vote values when switching to anonymous mode
      if (newMode === 'anonymous') {
        setVoteValues({});
      }
    });

    // Subscribe to re-vote events
    const unsubscribeRevote = onRevote((data) => {
      // Clear vote status and values when re-vote starts
      setVoteStatus({});
      setVoteValues({});
      // Show history panel when there are multiple rounds
      if (data.roundNumber > 1) {
        setShowHistory(true);
      }
    });

    return () => {
      unsubscribeVoteCast();
      unsubscribeVoteStatus();
      unsubscribeVotingMode();
      unsubscribeRevote();
    };
  }, []);

  if (!currentStory) {
    return null;
  }

  const votedCount = Object.values(voteStatus).filter(Boolean).length;
  const totalParticipants = participants.filter((p) => p.isOnline).length;

  return (
    <div className={className}>
      {/* Voting Mode Selector (host only) */}
      {currentStory && (
        <div className="mb-4">
          <VotingModeSelector
            sessionId={sessionId}
            currentMode={votingMode}
            isHost={isHost}
            onModeChanged={(newMode) => setVotingMode(newMode)}
          />
        </div>
      )}

      {/* Reveal Control (shows results when revealed) */}
      <RevealControl
        sessionId={sessionId}
        isHost={isHost}
        currentStory={currentStory}
        participants={participants}
        voteStatus={voteStatus}
        votingMode={votingMode}
        className="mb-6"
      />

      {/* Vote History Panel (shows when there are multiple rounds) */}
      {showHistory && currentStory && (
        <VoteHistoryPanel
          sessionId={sessionId}
          storyId={currentStory.id}
          className="mb-6"
        />
      )}

      {/* Participant Voting Status */}
      <ResponsiveParticipantList
        participants={participants}
        voteStatus={voteStatus}
        voteValues={votingMode === 'open' ? voteValues : undefined}
        votedCount={votedCount}
        totalParticipants={totalParticipants}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Loader2 } from 'lucide-react';
import { useReveal } from '@/hooks/use-reveal';
import { useRevote } from '@/hooks/use-revote';
import { EstimateResults } from '@/components/session/estimate-results';
import { onRoundRevealed, onEstimateFinalized, onRevote } from '@/lib/socket';
import { ISerializedParticipant } from '@/types';

interface Vote {
  userId: string;
  username: string;
  value: number;
  votedAt: Date;
}

interface EstimateResultsData {
  votes: Vote[];
  average: number;
  min: number;
  max: number;
  storyId: string;
  storyTitle: string;
}

interface RevealControlProps {
  sessionId: string;
  isHost: boolean;
  currentStory?: {
    id: string;
    title: string;
  } | null;
  participants: ISerializedParticipant[];
  voteStatus: Record<string, boolean>;
  votingMode?: 'anonymous' | 'open';
  className?: string;
}

export function RevealControl({
  sessionId,
  isHost,
  currentStory,
  participants,
  voteStatus,
  votingMode = 'anonymous',
  className,
}: RevealControlProps) {
  const [revealedResults, setRevealedResults] = useState<EstimateResultsData | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalEstimate, setFinalEstimate] = useState<number | undefined>(undefined);
  const [currentRound, setCurrentRound] = useState(1);
  
  const { isRevealing, revealEstimates } = useReveal({
    sessionId,
    onRevealSuccess: (results) => {
      setRevealedResults(results);
    },
  });

  const { isRevoting, initiateRevote } = useRevote({
    sessionId,
    onRevoteSuccess: (roundNumber) => {
      setCurrentRound(roundNumber);
      setRevealedResults(null);
      setIsFinalized(false);
      setFinalEstimate(undefined);
    },
  });

  // Reset revealed results and finalization when story changes
  useEffect(() => {
    setRevealedResults(null);
    setIsFinalized(false);
    setFinalEstimate(undefined);
    setCurrentRound(1);
  }, [currentStory?.id]);

  // Listen for reveal events from Socket.IO
  useEffect(() => {
    const unsubscribe = onRoundRevealed((results: EstimateResultsData) => {
      setRevealedResults(results);
      setIsFinalized(false);
      setFinalEstimate(undefined);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for finalization events from Socket.IO
  useEffect(() => {
    const unsubscribe = onEstimateFinalized((value: number) => {
      setIsFinalized(true);
      setFinalEstimate(value);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for re-vote events from Socket.IO
  useEffect(() => {
    const unsubscribe = onRevote((data) => {
      setCurrentRound(data.roundNumber);
      setRevealedResults(null);
      setIsFinalized(false);
      setFinalEstimate(undefined);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleFinalized = () => {
    // Refresh the page or update state as needed
    // The socket event will handle updating the UI
  };

  const handleRevote = async () => {
    try {
      await initiateRevote();
    } catch (error) {
      console.error('Failed to initiate re-vote:', error);
    }
  };

  if (!currentStory) {
    return null;
  }

  const votedCount = Object.values(voteStatus).filter(Boolean).length;
  const totalParticipants = participants.filter((p) => p.isOnline).length;
  const allVoted = totalParticipants > 0 && votedCount === totalParticipants;
  const canReveal = isHost && votedCount > 0 && !revealedResults;
  const canRevote = isHost && !!revealedResults && !isFinalized && currentRound < 3;

  // If results are revealed, show them
  if (revealedResults && revealedResults.storyId === currentStory.id) {
    return (
      <div className={className}>
        <EstimateResults
          votes={revealedResults.votes}
          average={revealedResults.average}
          min={revealedResults.min}
          max={revealedResults.max}
          storyTitle={revealedResults.storyTitle}
          sessionId={sessionId}
          isHost={isHost}
          isFinalized={isFinalized}
          finalEstimate={finalEstimate}
          onFinalized={handleFinalized}
          currentRound={currentRound}
          canRevote={canRevote}
          onRevote={handleRevote}
          isRevoting={isRevoting}
        />
      </div>
    );
  }

  // Show reveal control for host
  if (isHost) {
    const hasPartialVotes = votedCount > 0 && !allVoted;
    
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Voting Progress</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {currentRound > 1 && (
                <Badge variant="outline">Round {currentRound}</Badge>
              )}
              <Badge variant={allVoted ? 'default' : 'secondary'}>
                {votedCount} / {totalParticipants}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {allVoted
              ? 'All participants have voted! Ready to reveal.'
              : `Waiting for ${totalParticipants - votedCount} participant${
                  totalParticipants - votedCount !== 1 ? 's' : ''
                }...`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={revealEstimates}
            disabled={!canReveal || isRevealing}
            className="w-full"
            size="lg"
            variant={allVoted ? 'default' : 'outline'}
          >
            {isRevealing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revealing...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {allVoted ? 'Reveal Estimates' : 'Reveal Anyway'}
              </>
            )}
          </Button>
          {!canReveal && votedCount === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Waiting for participants to vote
            </p>
          )}
          {allVoted && (
            <p className="text-xs text-primary text-center">
              All votes are in! Click to reveal.
            </p>
          )}
          {hasPartialVotes && (
            <p className="text-xs text-muted-foreground text-center">
              You can reveal now with partial votes, or wait for everyone.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show waiting message for participants
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Voting Progress</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {currentRound > 1 && (
              <Badge variant="outline">Round {currentRound}</Badge>
            )}
            <Badge variant={allVoted ? 'default' : 'secondary'}>
              {votedCount} / {totalParticipants}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {allVoted
            ? 'All votes are in! Waiting for host to reveal...'
            : `${votedCount} participant${votedCount !== 1 ? 's' : ''} voted so far`}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

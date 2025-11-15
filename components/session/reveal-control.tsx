'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Loader2 } from 'lucide-react';
import { useReveal } from '@/hooks/use-reveal';
import { EstimateResults } from '@/components/session/estimate-results';
import { onRoundRevealed } from '@/lib/socket';
import { IParticipant } from '@/types';

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
  participants: IParticipant[];
  voteStatus: Record<string, boolean>;
  className?: string;
}

export function RevealControl({
  sessionId,
  isHost,
  currentStory,
  participants,
  voteStatus,
  className,
}: RevealControlProps) {
  const [revealedResults, setRevealedResults] = useState<EstimateResultsData | null>(null);
  const { isRevealing, revealEstimates } = useReveal({
    sessionId,
    onRevealSuccess: (results) => {
      setRevealedResults(results);
    },
  });

  // Reset revealed results when story changes
  useEffect(() => {
    setRevealedResults(null);
  }, [currentStory?.id]);

  // Listen for reveal events from Socket.IO
  useEffect(() => {
    const unsubscribe = onRoundRevealed((results: EstimateResultsData) => {
      setRevealedResults(results);
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
  const allVoted = totalParticipants > 0 && votedCount === totalParticipants;
  const canReveal = isHost && votedCount > 0 && !revealedResults;

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
        />
      </div>
    );
  }

  // Show reveal control for host
  if (isHost) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Voting Progress</CardTitle>
            </div>
            <Badge variant={allVoted ? 'default' : 'secondary'}>
              {votedCount} / {totalParticipants}
            </Badge>
          </div>
          <CardDescription>
            {allVoted
              ? 'All participants have voted! Ready to reveal.'
              : `Waiting for ${totalParticipants - votedCount} participant${
                  totalParticipants - votedCount !== 1 ? 's' : ''
                }...`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={revealEstimates}
            disabled={!canReveal || isRevealing}
            className="w-full"
            size="lg"
          >
            {isRevealing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revealing...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Reveal Estimates
              </>
            )}
          </Button>
          {!canReveal && votedCount === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Waiting for participants to vote
            </p>
          )}
          {allVoted && (
            <p className="text-xs text-primary text-center mt-2">
              All votes are in! Click to reveal.
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
          <Badge variant={allVoted ? 'default' : 'secondary'}>
            {votedCount} / {totalParticipants}
          </Badge>
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

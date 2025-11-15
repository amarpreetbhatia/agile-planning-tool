'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Users } from 'lucide-react';
import { getSocket, onVoteCast } from '@/lib/socket';
import { IParticipant } from '@/types';
import { RevealControl } from '@/components/session/reveal-control';

interface VotingAndRevealProps {
  participants: IParticipant[];
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
  }, [sessionId, currentStory?.id]);

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Participants</CardTitle>
            </div>
            <Badge variant="secondary">
              {votedCount} / {totalParticipants} voted
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants
              .filter((p) => p.isOnline)
              .map((participant) => {
                const hasVoted = voteStatus[participant.userId.toString()] || false;
                const initials = participant.username
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={participant.userId.toString()}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.avatarUrl} alt={participant.username} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{participant.username}</span>
                    </div>
                    {hasVoted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

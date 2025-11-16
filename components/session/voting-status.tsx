'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Users } from 'lucide-react';
import { getSocket, onVoteCast } from '@/lib/socket';
import { IParticipant } from '@/types';

interface VotingStatusProps {
  participants: IParticipant[];
  currentStory?: {
    id: string;
    title: string;
  } | null;
  sessionId: string;
  className?: string;
}

interface VoteStatus {
  [userId: string]: boolean;
}

export function VotingStatus({ participants, currentStory, sessionId, className }: VotingStatusProps) {
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
  const allVoted = totalParticipants > 0 && votedCount === totalParticipants;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Voting Status</CardTitle>
          </div>
          <Badge variant={allVoted ? 'default' : 'secondary'}>
            {votedCount} / {totalParticipants}
          </Badge>
        </div>
        <CardDescription>
          {allVoted
            ? 'All participants have voted!'
            : `Waiting for ${totalParticipants - votedCount} participant${totalParticipants - votedCount !== 1 ? 's' : ''}...`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
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
                  <motion.div
                    key={participant.userId.toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

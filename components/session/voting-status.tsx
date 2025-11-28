'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Users, X } from 'lucide-react';
import { getSocket, onVoteCast } from '@/lib/socket';
import { ISerializedParticipant } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface VotingStatusProps {
  participants: ISerializedParticipant[];
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
  const [roundStartTime, setRoundStartTime] = useState<Date | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const { toast } = useToast();

  // Fetch initial vote status
  useEffect(() => {
    if (!currentStory) {
      setVoteStatus({});
      setRoundStartTime(null);
      setShowReminder(false);
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
          // Set round start time
          setRoundStartTime(new Date());
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

  // Listen for vote reminders
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleVoteReminder = (message: string) => {
      setShowReminder(true);
      toast({
        title: 'Voting Reminder',
        description: message,
        duration: 5000,
      });
    };

    socket.on('vote:reminder', handleVoteReminder);

    return () => {
      socket.off('vote:reminder', handleVoteReminder);
    };
  }, [toast]);

  // Track time and send reminder after 2 minutes
  useEffect(() => {
    if (!roundStartTime || !currentStory) return;

    const reminderTimeout = setTimeout(() => {
      const socket = getSocket();
      if (!socket) return;

      // Check if current user has voted
      const onlineParticipants = participants.filter((p) => p.isOnline);
      const currentUserParticipant = onlineParticipants.find((p) => {
        // We'll check if they haven't voted
        return !voteStatus[p.userId];
      });

      // If there are non-voters, the server will send reminders
      // This is just a client-side timer
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearTimeout(reminderTimeout);
  }, [roundStartTime, currentStory, participants, voteStatus]);

  const dismissReminder = () => {
    setShowReminder(false);
  };

  if (!currentStory) {
    return null;
  }

  const onlineParticipants = participants.filter((p) => p.isOnline);
  const votedCount = Object.values(voteStatus).filter(Boolean).length;
  const totalParticipants = onlineParticipants.length;
  const allVoted = totalParticipants > 0 && votedCount === totalParticipants;
  const voteProgress = totalParticipants > 0 ? (votedCount / totalParticipants) * 100 : 0;

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
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${voteProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {Math.round(voteProgress)}% voted
          </p>
        </div>

        {/* Reminder Banner */}
        <AnimatePresence>
          {showReminder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-primary flex-1">
                  Don&apos;t forget to cast your vote! The team is waiting.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={dismissReminder}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participant List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {onlineParticipants.map((participant) => {
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

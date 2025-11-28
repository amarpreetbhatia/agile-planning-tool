'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Users } from 'lucide-react';
import { ISerializedParticipant } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveParticipantListProps {
  participants: ISerializedParticipant[];
  voteStatus: { [userId: string]: boolean };
  votedCount: number;
  totalParticipants: number;
  compact?: boolean;
  className?: string;
}

export function ResponsiveParticipantList({
  participants,
  voteStatus,
  votedCount,
  totalParticipants,
  compact = false,
  className,
}: ResponsiveParticipantListProps) {
  const isMobile = useIsMobile();

  // Mobile: More compact layout
  if (isMobile || compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Participants</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {votedCount} / {totalParticipants}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={participant.avatarUrl} alt={participant.username} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          {participant.username}
                        </span>
                      </div>
                      {hasVoted ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
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

  // Desktop/Tablet: Standard layout
  return (
    <Card className={className}>
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
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
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

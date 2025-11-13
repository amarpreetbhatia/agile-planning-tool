'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IParticipant } from '@/types';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSocket } from '@/lib/socket';

interface RealTimeParticipantListProps {
  initialParticipants: IParticipant[];
  hostId: string;
  sessionId: string;
}

export function RealTimeParticipantList({
  initialParticipants,
  hostId,
  sessionId,
}: RealTimeParticipantListProps) {
  const [participants, setParticipants] = useState<IParticipant[]>(initialParticipants);
  const { toast } = useToast();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Handle participant joined
    const handleParticipantJoined = (participant: IParticipant) => {
      setParticipants((prev) => {
        // Check if participant already exists
        const exists = prev.some(
          (p) => p.userId.toString() === participant.userId.toString()
        );
        
        if (exists) {
          // Update existing participant's online status
          return prev.map((p) =>
            p.userId.toString() === participant.userId.toString()
              ? { ...p, isOnline: true }
              : p
          );
        }
        
        // Add new participant
        return [...prev, participant];
      });

      // Show toast notification
      toast({
        title: 'Participant joined',
        description: `${participant.username} joined the session`,
      });
    };

    // Handle participant left
    const handleParticipantLeft = (userId: string) => {
      setParticipants((prev) => {
        const participant = prev.find((p) => p.userId.toString() === userId);
        
        if (participant) {
          // Show toast notification
          toast({
            title: 'Participant left',
            description: `${participant.username} left the session`,
            variant: 'default',
          });
        }
        
        // Update participant's online status instead of removing
        return prev.map((p) =>
          p.userId.toString() === userId ? { ...p, isOnline: false } : p
        );
      });
    };

    // Subscribe to events
    socket.on('participant:joined', handleParticipantJoined);
    socket.on('participant:left', handleParticipantLeft);

    // Cleanup
    return () => {
      socket.off('participant:joined', handleParticipantJoined);
      socket.off('participant:left', handleParticipantLeft);
    };
  }, [sessionId, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {participants.map((participant) => {
              const isHost = participant.userId.toString() === hostId;
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
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={participant.avatarUrl}
                        alt={participant.username}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    {participant.isOnline && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {participant.username}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isHost && (
                        <Badge variant="secondary" className="text-xs">
                          Host
                        </Badge>
                      )}
                      <span
                        className={`text-xs ${
                          participant.isOnline
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {participant.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

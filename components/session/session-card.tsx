'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Clock, ArrowRight, FolderKanban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SessionCardProps {
  sessionId: string;
  name: string;
  projectName?: string;
  status: 'active' | 'archived';
  participantCount: number;
  participants: Array<{
    username: string;
    avatarUrl: string;
    isOnline: boolean;
  }>;
  currentStory?: {
    title: string;
  };
  updatedAt: Date;
  isHost: boolean;
}

export default function SessionCard({
  sessionId,
  name,
  projectName,
  status,
  participantCount,
  participants,
  currentStory,
  updatedAt,
  isHost,
}: SessionCardProps) {
  const statusColor = status === 'active' ? 'default' : 'secondary';
  const displayParticipants = participants.slice(0, 3);
  const remainingCount = participantCount - 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="hover:shadow-lg transition-shadow h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="line-clamp-1">{name}</CardTitle>
              <CardDescription className="space-y-1">
                {projectName && (
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-3 w-3" />
                    <span className="line-clamp-1">{projectName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                </div>
              </CardDescription>
            </div>
            <Badge variant={statusColor}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStory && (
            <motion.div 
              className="text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-muted-foreground">Current Story:</p>
              <p className="font-medium line-clamp-1">{currentStory.title}</p>
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </span>
            </div>

            <div className="flex -space-x-2">
              {displayParticipants.map((participant, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={participant.avatarUrl} alt={participant.username} />
                    <AvatarFallback>
                      {participant.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
              {remainingCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + displayParticipants.length * 0.05 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
                >
                  +{remainingCount}
                </motion.div>
              )}
            </div>
          </div>

          <Button asChild className="w-full">
            <Link href={`/sessions/${sessionId}`}>
              {isHost ? 'Manage Session' : 'Join Session'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

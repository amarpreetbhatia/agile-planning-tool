'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IParticipant } from '@/types';
import { Users } from 'lucide-react';

interface ParticipantListProps {
  participants: IParticipant[];
  hostId: string;
}

export function ParticipantList({ participants, hostId }: ParticipantListProps) {
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
          {participants.map((participant) => {
            const isHost = participant.userId.toString() === hostId;
            const initials = participant.username
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={participant.userId.toString()}
                className="flex items-center gap-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={participant.avatarUrl}
                    alt={participant.username}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
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
                    {participant.isOnline && (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">
                          Online
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

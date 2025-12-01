'use client';

import { Whiteboard } from '@/components/whiteboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Paintbrush } from 'lucide-react';

interface SessionWhiteboardProps {
  sessionId: string;
  currentUserId: string;
  isHost: boolean;
  currentStoryId?: string;
}

export function SessionWhiteboard({
  sessionId,
  currentUserId,
  isHost,
  currentStoryId,
}: SessionWhiteboardProps) {
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Collaborative Whiteboard</CardTitle>
              <CardDescription>
                Sketch ideas and diagrams together in real-time
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Whiteboard
            sessionId={sessionId}
            currentUserId={currentUserId}
            isHost={isHost}
            currentStoryId={currentStoryId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import SessionCard from './session-card';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

interface Session {
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
  updatedAt: string;
  isHost: boolean;
}

interface SessionListProps {
  sessions: Session[];
}

export default function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No active sessions</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Create a new session to start estimating with your team
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Your Sessions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.sessionId}
            sessionId={session.sessionId}
            name={session.name}
            projectName={session.projectName}
            status={session.status}
            participantCount={session.participantCount}
            participants={session.participants}
            currentStory={session.currentStory}
            updatedAt={new Date(session.updatedAt)}
            isHost={session.isHost}
          />
        ))}
      </div>
    </div>
  );
}

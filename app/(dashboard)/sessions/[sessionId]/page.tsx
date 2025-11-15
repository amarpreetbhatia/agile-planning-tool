import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SessionLink } from '@/components/session/session-link';
import { SessionJoinHandler } from '@/components/session/session-join-handler';
import { GitHubIntegrationDialog } from '@/components/github/github-integration-dialog';
import { StoryManager } from '@/components/session/story-manager';
import { VotingAndReveal } from '@/components/session/voting-and-reveal';
import { SessionVotingHandler } from '@/components/session/session-voting-handler';
import { EndSessionControl } from '@/components/session/end-session-control';
import { SessionEndHandler } from '@/components/session/session-end-handler';
import { AlertCircle } from 'lucide-react';

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { sessionId } = await params;

  await connectDB();
  const sessionData = await Session.findOne({ sessionId }).lean();

  if (!sessionData) {
    return (
      <main className="container max-w-4xl py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Session Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The session you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Check if session is archived - redirect to summary page
  if (sessionData.status === 'archived') {
    redirect(`/sessions/${sessionId}/summary`);
  }

  // Get current user from database
  const user = await User.findOne({ githubId: session.user.githubId });
  if (!user) {
    redirect('/login');
  }

  // Check if user is already a participant
  const isParticipant = sessionData.participants.some(
    (p) => p.userId.toString() === user._id.toString()
  );

  const isHost = sessionData.hostId.toString() === user._id.toString();

  return (
    <main className="container max-w-7xl py-8">
      <SessionJoinHandler sessionId={sessionId} isParticipant={isParticipant} />
      <SessionEndHandler sessionId={sessionId} />
      <SessionVotingHandler
        sessionId={sessionId}
        userId={user._id.toString()}
        isParticipant={isParticipant}
        initialStory={sessionData.currentStory}
      />

      <div className="space-y-6">
        {/* Session Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {sessionData.name}
                </h1>
                <Badge variant={sessionData.status === 'active' ? 'default' : 'secondary'}>
                  {sessionData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Session ID: {sessionData.sessionId}
              </p>
            </div>
            <EndSessionControl sessionId={sessionData.sessionId} isHost={isHost} />
          </div>
        </div>

        <Separator />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Planning Poker Session</CardTitle>
                  {isHost && (
                    <GitHubIntegrationDialog
                      sessionId={sessionData.sessionId}
                      isHost={isHost}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Welcome to the estimation session! Select a story from the backlog to begin estimation.
                </p>
                {isHost && (
                  <p className="text-sm text-primary mt-4">
                    You are the host of this session.
                  </p>
                )}
              </CardContent>
            </Card>

            <StoryManager
              sessionId={sessionData.sessionId}
              initialStories={sessionData.stories || []}
              initialCurrentStory={sessionData.currentStory}
              isHost={isHost}
            />

            {/* Poker Card Selection - Voting handled by SessionVotingHandler */}
            {isParticipant && (
              <div id="poker-card-selector-container">
                {/* This will be populated by SessionVotingHandler */}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <SessionLink sessionId={sessionData.sessionId} />
            <VotingAndReveal
              participants={sessionData.participants}
              currentStory={sessionData.currentStory}
              sessionId={sessionData.sessionId}
              isHost={isHost}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

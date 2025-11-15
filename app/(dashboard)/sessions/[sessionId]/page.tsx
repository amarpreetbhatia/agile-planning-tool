import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionJoinHandler } from '@/components/session/session-join-handler';
import { GitHubIntegrationDialog } from '@/components/github/github-integration-dialog';
import { StoryManager } from '@/components/session/story-manager';
import { SessionVotingHandler } from '@/components/session/session-voting-handler';
import { SessionEndHandler } from '@/components/session/session-end-handler';
import { SessionPageLayout } from '@/components/session/session-page-layout';
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
    <>
      <SessionJoinHandler sessionId={sessionId} isParticipant={isParticipant} />
      <SessionEndHandler sessionId={sessionId} />
      <SessionVotingHandler
        sessionId={sessionId}
        userId={user._id.toString()}
        isParticipant={isParticipant}
        initialStory={sessionData.currentStory}
      />

      <SessionPageLayout
        sessionName={sessionData.name}
        sessionId={sessionData.sessionId}
        status={sessionData.status}
        isHost={isHost}
        participants={sessionData.participants}
        currentStory={sessionData.currentStory}
        githubIntegration={
          isHost ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>GitHub Integration</CardTitle>
                  <GitHubIntegrationDialog
                    sessionId={sessionData.sessionId}
                    isHost={isHost}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Import stories from your GitHub projects
                </p>
              </CardContent>
            </Card>
          ) : null
        }
        storyManager={
          <StoryManager
            sessionId={sessionData.sessionId}
            initialStories={sessionData.stories || []}
            initialCurrentStory={sessionData.currentStory}
            isHost={isHost}
          />
        }
        pokerCards={
          isParticipant ? (
            <div id="poker-card-selector-container">
              {/* This will be populated by SessionVotingHandler */}
            </div>
          ) : null
        }
      />
    </>
  );
}

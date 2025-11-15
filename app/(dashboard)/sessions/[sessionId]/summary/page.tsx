import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import Estimate from '@/models/Estimate';
import User from '@/models/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionSummary } from '@/components/session/session-summary';
import { SessionSummary as SessionSummaryType } from '@/app/api/sessions/[sessionId]/end/route';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SessionSummaryPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function SessionSummaryPage({ params }: SessionSummaryPageProps) {
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

  // Get current user from database
  const user = await User.findOne({ githubId: session.user.githubId });
  if (!user) {
    redirect('/login');
  }

  // Check if user was a participant or host
  const isParticipant = sessionData.participants.some(
    (p) => p.userId.toString() === user._id.toString()
  );
  const isHost = sessionData.hostId.toString() === user._id.toString();

  if (!isParticipant && !isHost) {
    return (
      <main className="container max-w-4xl py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don&apos;t have permission to view this session summary.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Get all estimates for this session
  const estimates = await Estimate.find({
    sessionId: sessionData._id,
  }).sort({ createdAt: 1 }).lean();

  // Build session summary
  const estimatedStories = estimates.map((estimate) => {
    const numericVotes = estimate.votes.filter((v) => v.value >= 0);
    const values = numericVotes.map((v) => v.value);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;

    // Find the story from session stories
    const story = sessionData.stories.find((s) => s.id === estimate.storyId);

    return {
      storyId: estimate.storyId,
      storyTitle: story?.title || 'Unknown Story',
      finalEstimate: estimate.finalEstimate,
      votes: estimate.votes.map((v) => ({
        username: v.username,
        value: v.value,
      })),
      average,
      min,
      max,
    };
  });

  const summary: SessionSummaryType = {
    sessionId: sessionData.sessionId,
    sessionName: sessionData.name,
    hostName: user.username,
    participantCount: sessionData.participants.length,
    estimatedStories,
    totalStories: sessionData.stories.length,
    endedAt: sessionData.updatedAt,
  };

  return (
    <main className="container max-w-6xl py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <SessionSummary summary={summary} />
    </main>
  );
}

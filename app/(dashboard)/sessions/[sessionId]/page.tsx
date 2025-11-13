import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <Card>
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
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

  return (
    <main className="container max-w-6xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{sessionData.name}</h1>
          <p className="text-muted-foreground">Session ID: {sessionData.sessionId}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This session page will be fully implemented in the next tasks.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Participants: {sessionData.participants.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

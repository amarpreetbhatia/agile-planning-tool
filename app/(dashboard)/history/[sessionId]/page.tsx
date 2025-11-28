import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SessionHistoryDetail from '@/components/session/session-history-detail';

export default async function SessionHistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { sessionId } = await params;

  return (
    <main className="container py-8">
      <SessionHistoryDetail sessionId={sessionId} />
    </main>
  );
}

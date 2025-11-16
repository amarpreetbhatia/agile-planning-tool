import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SessionHistoryList from '@/components/session/session-history-list';

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <main className="container py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session History</h1>
          <p className="text-muted-foreground">
            View and manage your archived estimation sessions
          </p>
        </div>

        <SessionHistoryList />
      </div>
    </main>
  );
}

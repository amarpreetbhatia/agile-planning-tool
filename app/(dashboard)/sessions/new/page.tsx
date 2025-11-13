import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SessionCreateForm from '@/components/session/session-create-form';

export default async function NewSessionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <main className="container max-w-2xl py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Session</h1>
          <p className="text-muted-foreground">
            Start a new estimation session and invite your team
          </p>
        </div>

        <SessionCreateForm />
      </div>
    </main>
  );
}

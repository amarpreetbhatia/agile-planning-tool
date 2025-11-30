import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationPreferencesClient from '@/components/notifications/notification-preferences-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Notification Preferences',
  description: 'Manage your notification preferences',
};

export default async function NotificationPreferencesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Manage how you receive notifications about sessions and projects
        </p>
      </div>

      <Suspense fallback={<PreferencesSkeleton />}>
        <NotificationPreferencesClient />
      </Suspense>
    </div>
  );
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

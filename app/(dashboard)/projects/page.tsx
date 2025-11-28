import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import ProjectsList from '@/components/project/projects-list';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Projects | Agile Planning Tool',
  description: 'Manage your planning projects',
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<ProjectsListSkeleton />}>
        <ProjectsList />
      </Suspense>
    </div>
  );
}

function ProjectsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

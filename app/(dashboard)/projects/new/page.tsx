import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import ProjectForm from '@/components/project/project-form';

export const metadata = {
  title: 'Create Project | Agile Planning Tool',
  description: 'Create a new planning project',
};

export default async function NewProjectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Set up a new project to organize your team&apos;s planning sessions
        </p>
      </div>
      <ProjectForm mode="create" />
    </div>
  );
}

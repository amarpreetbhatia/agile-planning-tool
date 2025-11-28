import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { validateProjectAccess } from '@/lib/permissions';
import ProjectForm from '@/components/project/project-form';

export const metadata = {
  title: 'Project Settings | Agile Planning Tool',
  description: 'Manage project settings',
};

interface ProjectSettingsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { projectId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  await connectDB();

  const user = await User.findOne({ githubId: session.user.githubId });
  if (!user) {
    redirect('/login');
  }

  const result = await validateProjectAccess(projectId, user._id, 'admin');

  if (!result) {
    redirect('/projects');
  }

  if (!result.permission.hasPermission) {
    redirect(`/projects/${projectId}`);
  }

  // Convert Mongoose document to plain object
  const project = JSON.parse(JSON.stringify(result.project));

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Project Settings</h1>
        <p className="text-muted-foreground">
          Update settings for {project.name}
        </p>
      </div>
      <ProjectForm
        mode="edit"
        projectId={project.projectId}
        initialData={{
          name: project.name,
          description: project.description,
          settings: project.settings,
        }}
      />
    </div>
  );
}

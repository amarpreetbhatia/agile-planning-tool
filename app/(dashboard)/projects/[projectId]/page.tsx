import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { validateProjectAccess } from '@/lib/permissions';
import { ProjectDashboard } from '@/components/project';

export const metadata = {
  title: 'Project | Agile Planning Tool',
  description: 'Project dashboard',
};

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
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

  const result = await validateProjectAccess(projectId, user._id, 'member');

  if (!result || !result.permission.hasPermission) {
    redirect('/projects');
  }

  // Convert Mongoose document to plain object
  const project = JSON.parse(JSON.stringify(result.project));

  return (
    <div className="container mx-auto py-8 px-4">
      <ProjectDashboard project={project} userRole={result.permission.role!} />
    </div>
  );
}

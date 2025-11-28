import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { validateProjectAccess } from '@/lib/permissions';
import { MembersPageClient } from '@/components/project';

export const metadata = {
  title: 'Team Members | Agile Planning Tool',
  description: 'Manage project team members',
};

interface MembersPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectMembersPage({ params }: MembersPageProps) {
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
    <MembersPageClient
      project={project}
      currentUserId={user._id.toString()}
      userRole={result.permission.role!}
    />
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IProject, IInvitation, ProjectRole } from '@/types';
import { MemberList } from './member-list';
import { InvitationDialog } from './invitation-dialog';
import { PendingInvitations } from './pending-invitations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface MembersPageClientProps {
  project: IProject;
  currentUserId: string;
  userRole: ProjectRole;
}

export function MembersPageClient({
  project: initialProject,
  currentUserId,
  userRole,
}: MembersPageClientProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [invitations, setInvitations] = useState<IInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch(
        `/api/projects/${project.projectId}/invitations`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.projectId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setProject(data.data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchProject();
    if (isAdmin) {
      fetchInvitations();
    }
  };

  // Combine owner and members for display
  const allMembers = [
    {
      userId: project.ownerId,
      username:
        project.members.find(
          (m) => m.userId.toString() === project.ownerId.toString()
        )?.username || 'Owner',
      avatarUrl:
        project.members.find(
          (m) => m.userId.toString() === project.ownerId.toString()
        )?.avatarUrl || '',
      role: 'owner' as const,
      joinedAt: project.createdAt,
    },
    ...project.members.filter(
      (m) => m.userId.toString() !== project.ownerId.toString()
    ),
  ];

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${project.projectId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">Team Members</p>
        </div>
        {isAdmin && (
          <InvitationDialog
            projectId={project.projectId}
            onInvitationSent={handleRefresh}
          />
        )}
      </div>

      <div className="space-y-6">
        {isAdmin && invitations.length > 0 && (
          <PendingInvitations
            invitations={invitations}
            projectId={project.projectId}
            onInvitationCancelled={handleRefresh}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Members ({allMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberList
              members={allMembers}
              ownerId={project.ownerId.toString()}
              currentUserId={currentUserId}
              projectId={project.projectId}
              isOwner={userRole === 'owner'}
              isAdmin={isAdmin}
              onMemberRemoved={handleRefresh}
              onRoleChanged={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

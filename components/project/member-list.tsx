'use client';

import { useState } from 'react';
import { IProjectMember } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Shield, User, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MemberListProps {
  members: IProjectMember[];
  ownerId: string;
  currentUserId: string;
  projectId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onMemberRemoved?: () => void;
  onRoleChanged?: () => void;
}

export function MemberList({
  members,
  ownerId,
  currentUserId,
  projectId,
  isOwner,
  isAdmin,
  onMemberRemoved,
  onRoleChanged,
}: MemberListProps) {
  const { toast } = useToast();
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<IProjectMember | null>(
    null
  );
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const handleRemoveMember = async (member: IProjectMember) => {
    setRemovingMember(member.userId.toString());
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${member.userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to remove member');
      }

      toast({
        title: 'Success',
        description: data.message || 'Member removed successfully',
      });

      onMemberRemoved?.();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setRemovingMember(null);
      setMemberToRemove(null);
    }
  };

  const handleChangeRole = async (
    member: IProjectMember,
    newRole: 'admin' | 'member'
  ) => {
    setChangingRole(member.userId.toString());
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${member.userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to change role');
      }

      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });

      onRoleChanged?.();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to change role',
        variant: 'destructive',
      });
    } finally {
      setChangingRole(null);
    }
  };

  const getRoleIcon = (role: string, isOwner: boolean) => {
    if (isOwner) return <Crown className="h-4 w-4" />;
    if (role === 'admin') return <Shield className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getRoleBadgeVariant = (role: string, isOwner: boolean) => {
    if (isOwner) return 'default';
    if (role === 'admin') return 'secondary';
    return 'outline';
  };

  const canManageMember = (member: IProjectMember) => {
    const memberIsOwner = member.userId.toString() === ownerId;
    const isSelf = member.userId.toString() === currentUserId;

    // Owner can manage everyone except themselves
    if (isOwner && !isSelf) return true;

    // Admin can manage members (not admins or owner)
    if (isAdmin && !memberIsOwner && member.role === 'member') return true;

    // Anyone can leave (remove themselves)
    if (isSelf && !memberIsOwner) return true;

    return false;
  };

  return (
    <>
      <div className="space-y-4">
        {members.map((member) => {
          const memberIsOwner = member.userId.toString() === ownerId;
          const isSelf = member.userId.toString() === currentUserId;
          const canManage = canManageMember(member);

          return (
            <div
              key={member.userId.toString()}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.avatarUrl} alt={member.username} />
                  <AvatarFallback>
                    {member.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.username}</p>
                    {isSelf && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {getRoleIcon(member.role, memberIsOwner)}
                    <Badge
                      variant={getRoleBadgeVariant(member.role, memberIsOwner)}
                      className="text-xs"
                    >
                      {memberIsOwner ? 'Owner' : member.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && !isSelf && !memberIsOwner && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(
                              member,
                              member.role === 'admin' ? 'member' : 'admin'
                            )
                          }
                          disabled={changingRole === member.userId.toString()}
                        >
                          {member.role === 'admin'
                            ? 'Change to Member'
                            : 'Change to Admin'}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setMemberToRemove(member)}
                      disabled={removingMember === member.userId.toString()}
                      className="text-destructive"
                    >
                      {isSelf ? 'Leave Project' : 'Remove Member'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToRemove?.userId.toString() === currentUserId
                ? 'Leave Project'
                : 'Remove Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.userId.toString() === currentUserId
                ? 'Are you sure you want to leave this project? You will need to be re-invited to join again.'
                : `Are you sure you want to remove ${memberToRemove?.username} from this project? They will need to be re-invited to join again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {memberToRemove?.userId.toString() === currentUserId
                ? 'Leave'
                : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

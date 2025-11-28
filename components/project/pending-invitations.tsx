'use client';

import { useState } from 'react';
import { IInvitation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Mail, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PendingInvitationsProps {
  invitations: IInvitation[];
  projectId: string;
  onInvitationCancelled?: () => void;
}

export function PendingInvitations({
  invitations,
  projectId,
  onInvitationCancelled,
}: PendingInvitationsProps) {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [invitationToCancel, setInvitationToCancel] =
    useState<IInvitation | null>(null);

  const handleCancelInvitation = async (invitation: IInvitation) => {
    setCancelling(invitation._id.toString());
    try {
      const response = await fetch(
        `/api/projects/${projectId}/invitations/${invitation._id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to cancel invitation');
      }

      toast({
        title: 'Success',
        description: 'Invitation cancelled successfully',
      });

      onInvitationCancelled?.();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to cancel invitation',
        variant: 'destructive',
      });
    } finally {
      setCancelling(null);
      setInvitationToCancel(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitations.map((invitation) => {
              const invitedBy = invitation.invitedBy as any;
              const invitedUser = invitation.invitedUser as any;

              return (
                <div
                  key={invitation._id.toString()}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {invitedUser?.username ||
                            invitation.invitedGithubUsername ||
                            invitation.invitedEmail}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {invitation.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>Invited by {invitedBy?.username}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(
                              new Date(invitation.createdAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInvitationToCancel(invitation)}
                    disabled={cancelling === invitation._id.toString()}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!invitationToCancel}
        onOpenChange={(open) => !open && setInvitationToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation? The recipient
              will no longer be able to accept it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                invitationToCancel && handleCancelInvitation(invitationToCancel)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

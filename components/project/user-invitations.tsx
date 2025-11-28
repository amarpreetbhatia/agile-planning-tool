'use client';

import { useState, useEffect } from 'react';
import { IInvitation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { LoadingButton } from '@/components/ui/loading-button';

export function UserInvitations() {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<IInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations/me');
      const data = await response.json();

      if (response.ok && data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (invitation: IInvitation) => {
    setResponding(invitation._id.toString());
    try {
      const response = await fetch(
        `/api/invitations/${invitation._id}/accept`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to accept invitation');
      }

      toast({
        title: 'Success',
        description: 'You have joined the project!',
      });

      // Remove from list
      setInvitations((prev) =>
        prev.filter((inv) => inv._id.toString() !== invitation._id.toString())
      );
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setResponding(null);
    }
  };

  const handleDecline = async (invitation: IInvitation) => {
    setResponding(invitation._id.toString());
    try {
      const response = await fetch(
        `/api/invitations/${invitation._id}/decline`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to decline invitation');
      }

      toast({
        title: 'Invitation Declined',
        description: 'You have declined the invitation',
      });

      // Remove from list
      setInvitations((prev) =>
        prev.filter((inv) => inv._id.toString() !== invitation._id.toString())
      );
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to decline invitation',
        variant: 'destructive',
      });
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Project Invitations
          <Badge variant="default">{invitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const project = invitation.projectId as any;
            const invitedBy = invitation.invitedBy as any;

            return (
              <div
                key={invitation._id.toString()}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{project?.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {invitation.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project?.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Invited by {invitedBy?.username} •{' '}
                    {formatDistanceToNow(new Date(invitation.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <LoadingButton
                    size="sm"
                    onClick={() => handleAccept(invitation)}
                    loading={responding === invitation._id.toString()}
                    disabled={responding !== null}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </LoadingButton>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(invitation)}
                    disabled={responding !== null}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

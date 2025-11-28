'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingButton } from '@/components/ui/loading-button';

interface InvitationDialogProps {
  projectId: string;
  onInvitationSent?: () => void;
}

export function InvitationDialog({
  projectId,
  onInvitationSent,
}: InvitationDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!githubUsername && !email) {
      toast({
        title: 'Error',
        description: 'Please provide either a GitHub username or email',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUsername: githubUsername || undefined,
          email: email || undefined,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to send invitation');
      }

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });

      setOpen(false);
      setGithubUsername('');
      setEmail('');
      setRole('member');
      onInvitationSent?.();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite a team member to join this project. They will receive an
              invitation that they can accept or decline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="githubUsername">GitHub Username</Label>
              <Input
                id="githubUsername"
                placeholder="octocat"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground">
                Preferred method if the user has a GitHub account
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="flex-1 border-t" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground">
                Use email if GitHub username is unknown
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as 'admin' | 'member')}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Admins can manage project settings and invite members
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <LoadingButton type="submit" loading={isSubmitting}>
              Send Invitation
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

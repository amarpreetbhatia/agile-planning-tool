'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EndSessionControlProps {
  sessionId: string;
  isHost: boolean;
}

export function EndSessionControl({ sessionId, isHost }: EndSessionControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!isHost) {
    return null;
  }

  const handleEndSession = async () => {
    setIsEnding(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to end session');
      }

      const data = await response.json();

      toast({
        title: 'Session Ended',
        description: `${data.summary.sessionName} has been archived successfully.`,
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to end session',
        variant: 'destructive',
      });
      setIsEnding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          End Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to end this session? This will:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Archive the session and prevent new participants from joining</li>
            <li>Disconnect all participants from the session</li>
            <li>Save all estimates and voting history</li>
            <li>Redirect all participants to the dashboard</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            This action cannot be undone, but you can still view the session summary and estimates.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isEnding}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleEndSession}
            disabled={isEnding}
          >
            {isEnding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                End Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

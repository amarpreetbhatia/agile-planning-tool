'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onSessionEnded } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface SessionEndHandlerProps {
  sessionId: string;
}

export function SessionEndHandler({ sessionId }: SessionEndHandlerProps) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to session ended events
    const unsubscribe = onSessionEnded(() => {
      toast({
        title: 'Session Ended',
        description: 'The host has ended this session. Redirecting to dashboard...',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, router, toast]);

  return null;
}

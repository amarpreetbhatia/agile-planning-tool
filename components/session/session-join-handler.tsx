'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/use-socket';
import { joinSession as joinSocketSession, leaveSession } from '@/lib/socket';

interface SessionJoinHandlerProps {
  sessionId: string;
  isParticipant: boolean;
}

export function SessionJoinHandler({
  sessionId,
  isParticipant,
}: SessionJoinHandlerProps) {
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Auto-join if not already a participant
    if (!isParticipant && !isJoining) {
      setIsJoining(true);
      joinSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParticipant, sessionId]);

  // Join Socket.IO room when connected
  useEffect(() => {
    if (isConnected && socket && isParticipant) {
      try {
        joinSocketSession(sessionId);
        console.log('Joined Socket.IO room:', sessionId);
      } catch (error) {
        console.error('Failed to join Socket.IO room:', error);
      }
    }

    // Leave room on unmount
    return () => {
      if (isConnected && socket) {
        try {
          leaveSession(sessionId);
          console.log('Left Socket.IO room:', sessionId);
        } catch (error) {
          console.error('Failed to leave Socket.IO room:', error);
        }
      }
    };
  }, [isConnected, socket, sessionId, isParticipant]);

  const joinSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      toast({
        title: 'Joined session',
        description: `You have joined ${data.name}`,
      });

      // Refresh the page to show updated participant list
      router.refresh();
    } catch (error) {
      toast({
        title: 'Failed to join session',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  return null;
}

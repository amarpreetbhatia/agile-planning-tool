import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseRevoteOptions {
  sessionId: string;
  onRevoteSuccess?: (roundNumber: number) => void;
}

interface RevoteResponse {
  success: boolean;
  roundNumber: number;
  message: string;
}

export function useRevote({ sessionId, onRevoteSuccess }: UseRevoteOptions) {
  const [isRevoting, setIsRevoting] = useState(false);
  const { toast } = useToast();

  const initiateRevote = async () => {
    setIsRevoting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/revote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate re-vote');
      }

      const result = data as RevoteResponse;

      toast({
        title: 'Re-vote Started',
        description: `Round ${result.roundNumber} has begun. All participants can vote again.`,
      });

      if (onRevoteSuccess) {
        onRevoteSuccess(result.roundNumber);
      }

      return result;
    } catch (error) {
      console.error('Error initiating re-vote:', error);
      toast({
        title: 'Re-vote Failed',
        description: error instanceof Error ? error.message : 'Failed to start re-vote',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsRevoting(false);
    }
  };

  return {
    isRevoting,
    initiateRevote,
  };
}

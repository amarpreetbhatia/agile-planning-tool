'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Vote {
  userId: string;
  username: string;
  value: number;
  votedAt: Date;
}

interface EstimateResults {
  votes: Vote[];
  average: number;
  min: number;
  max: number;
  storyId: string;
  storyTitle: string;
}

interface UseRevealOptions {
  sessionId: string;
  onRevealSuccess?: (results: EstimateResults) => void;
}

export function useReveal({ sessionId, onRevealSuccess }: UseRevealOptions) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [results, setResults] = useState<EstimateResults | null>(null);
  const { toast } = useToast();

  const revealEstimates = useCallback(async () => {
    setIsRevealing(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reveal estimates');
      }

      const data = await response.json();

      setResults(data.results);

      toast({
        title: 'Estimates Revealed',
        description: `Average estimate: ${data.results.average}`,
      });

      onRevealSuccess?.(data.results);

      return data.results;
    } catch (error) {
      console.error('Error revealing estimates:', error);
      toast({
        title: 'Reveal Failed',
        description:
          error instanceof Error ? error.message : 'Failed to reveal estimates',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsRevealing(false);
    }
  }, [sessionId, toast, onRevealSuccess]);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    isRevealing,
    results,
    revealEstimates,
    clearResults,
  };
}

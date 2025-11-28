import { useState, useEffect } from 'react';

interface Vote {
  userId: string;
  username: string;
  value: number;
  comment?: string;
  votedAt: Date;
}

interface RoundStatistics {
  average: number;
  min: number;
  max: number;
}

interface RoundHistory {
  roundNumber: number;
  votes: Vote[];
  revealedAt?: Date;
  finalizedAt?: Date;
  finalEstimate?: number;
  statistics?: RoundStatistics | null;
}

interface VoteHistoryResponse {
  success: boolean;
  storyId: string;
  history: RoundHistory[];
  totalRounds: number;
}

interface UseVoteHistoryOptions {
  sessionId: string;
  storyId?: string;
  enabled?: boolean;
}

export function useVoteHistory({ sessionId, storyId, enabled = true }: UseVoteHistoryOptions) {
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !storyId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/sessions/${sessionId}/vote-history?storyId=${encodeURIComponent(storyId)}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch vote history');
        }

        const data: VoteHistoryResponse = await response.json();
        setHistory(data.history);
      } catch (err) {
        console.error('Error fetching vote history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vote history');
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [sessionId, storyId, enabled]);

  const refetch = async () => {
    if (!storyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/vote-history?storyId=${encodeURIComponent(storyId)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch vote history');
      }

      const data: VoteHistoryResponse = await response.json();
      setHistory(data.history);
    } catch (err) {
      console.error('Error fetching vote history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vote history');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    history,
    isLoading,
    error,
    refetch,
    totalRounds: history.length,
    currentRound: history.length > 0 ? history[history.length - 1] : null,
  };
}

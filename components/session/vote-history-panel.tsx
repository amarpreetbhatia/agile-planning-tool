'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight, 
  CheckCircle2,
  History,
  MessageSquare
} from 'lucide-react';
import { useVoteHistory } from '@/hooks/use-vote-history';
import { Skeleton } from '@/components/ui/skeleton';

interface VoteHistoryPanelProps {
  sessionId: string;
  storyId?: string;
  className?: string;
}

export function VoteHistoryPanel({ sessionId, storyId, className }: VoteHistoryPanelProps) {
  const { history, isLoading, error, totalRounds } = useVoteHistory({
    sessionId,
    storyId,
    enabled: !!storyId,
  });

  // Format card value for display
  const formatValue = (value: number): string => {
    if (value === -1) return '?';
    if (value === -2) return '☕';
    return value.toString();
  };

  // Get icon for statistics
  const getStatIcon = (type: 'min' | 'max' | 'avg') => {
    if (type === 'min') return <TrendingDown className="h-3 w-3" />;
    if (type === 'max') return <TrendingUp className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  if (!storyId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Vote History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Vote History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (totalRounds === 0) {
    return null;
  }

  // Only show history if there are multiple rounds
  if (totalRounds === 1) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Vote History</CardTitle>
          </div>
          <Badge variant="secondary">{totalRounds} Rounds</Badge>
        </div>
        <CardDescription>
          See how estimates evolved across voting rounds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((round, index) => (
          <motion.div
            key={round.roundNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-3"
          >
            {/* Round Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={round.finalizedAt ? 'default' : 'outline'}>
                  Round {round.roundNumber}
                </Badge>
                {round.finalizedAt && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
                {round.finalEstimate !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    Final: {round.finalEstimate}
                  </span>
                )}
              </div>
              {round.statistics && (
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    {getStatIcon('min')}
                    <span>{formatValue(round.statistics.min)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    {getStatIcon('avg')}
                    <span>{round.statistics.average}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    {getStatIcon('max')}
                    <span>{formatValue(round.statistics.max)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Votes */}
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                {round.votes.map((vote) => (
                  <motion.div
                    key={vote.userId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1 + index * 0.05,
                      type: 'spring',
                      stiffness: 200,
                    }}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                      vote.comment
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted'
                    }`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://github.com/${vote.username}.png`} />
                      <AvatarFallback>
                        {vote.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{vote.username}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatValue(vote.value)}
                    </Badge>
                    {vote.comment && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MessageSquare className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{vote.comment}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </motion.div>
                ))}
              </TooltipProvider>
            </div>

            {/* Vote Changes Visualization */}
            {index < history.length - 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  <span>Changes in next round</span>
                </div>
                <div className="pl-5 space-y-1">
                  {round.votes.map((prevVote) => {
                    const nextRound = history[index + 1];
                    const nextVote = nextRound?.votes.find(
                      (v) => v.userId === prevVote.userId
                    );
                    
                    if (!nextVote || nextVote.value === prevVote.value) {
                      return null;
                    }

                    return (
                      <motion.div
                        key={prevVote.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {prevVote.username}:
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatValue(prevVote.value)}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {formatValue(nextVote.value)}
                        </Badge>
                        {Math.abs(nextVote.value - prevVote.value) > 0 && (
                          <span
                            className={
                              nextVote.value > prevVote.value
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }
                          >
                            {nextVote.value > prevVote.value ? '↑' : '↓'}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {index < history.length - 1 && <Separator />}
          </motion.div>
        ))}

        {/* Convergence Summary */}
        {totalRounds > 1 && history[0]?.statistics && history[history.length - 1]?.statistics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              Convergence Analysis
            </h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Initial range:</span>
                <span className="font-medium">
                  {formatValue(history[0].statistics.min)} -{' '}
                  {formatValue(history[0].statistics.max)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Final range:</span>
                <span className="font-medium">
                  {formatValue(history[history.length - 1].statistics.min)} -{' '}
                  {formatValue(history[history.length - 1].statistics.max)}
                </span>
              </div>
              {history[0].statistics.max - history[0].statistics.min >
                history[history.length - 1].statistics.max -
                  history[history.length - 1].statistics.min && (
                <p className="text-green-600 dark:text-green-400 mt-2">
                  ✓ Estimates converged across rounds
                </p>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

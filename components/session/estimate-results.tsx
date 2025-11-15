'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Vote {
  userId: string;
  username: string;
  value: number;
  votedAt: Date;
}

interface EstimateResultsProps {
  votes: Vote[];
  average: number;
  min: number;
  max: number;
  storyTitle: string;
}

export function EstimateResults({
  votes,
  average,
  min,
  max,
  storyTitle,
}: EstimateResultsProps) {
  // Group votes by value
  const votesByValue = votes.reduce((acc, vote) => {
    const key = vote.value.toString();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(vote);
    return acc;
  }, {} as Record<string, Vote[]>);

  // Sort values for display
  const sortedValues = Object.keys(votesByValue).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return numA - numB;
  });

  // Format card value for display
  const formatValue = (value: number): string => {
    if (value === -1) return '?';
    if (value === -2) return '☕';
    return value.toString();
  };

  // Get color for card based on min/max
  const getCardColor = (value: number): string => {
    if (value < 0) return 'bg-muted'; // Special cards
    if (value === min && value === max) return 'bg-primary/20'; // Consensus
    if (value === min) return 'bg-green-500/20 border-green-500';
    if (value === max) return 'bg-red-500/20 border-red-500';
    return 'bg-muted';
  };

  // Get icon for statistics
  const getStatIcon = (type: 'min' | 'max' | 'avg') => {
    if (type === 'min') return <TrendingDown className="h-4 w-4" />;
    if (type === 'max') return <TrendingUp className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Estimation Results</CardTitle>
        <p className="text-sm text-muted-foreground">{storyTitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center p-4 rounded-lg bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              {getStatIcon('min')}
              <span className="text-xs font-medium">MIN</span>
            </div>
            <span className="text-2xl font-bold mt-2">{formatValue(min)}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center p-4 rounded-lg bg-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-2 text-primary">
              {getStatIcon('avg')}
              <span className="text-xs font-medium">AVG</span>
            </div>
            <span className="text-2xl font-bold mt-2">{average}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center p-4 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              {getStatIcon('max')}
              <span className="text-xs font-medium">MAX</span>
            </div>
            <span className="text-2xl font-bold mt-2">{formatValue(max)}</span>
          </motion.div>
        </div>

        <Separator />

        {/* Vote Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Vote Breakdown</h3>
          <div className="space-y-3">
            {sortedValues.map((valueStr, index) => {
              const value = parseFloat(valueStr);
              const votesForValue = votesByValue[valueStr];
              const isMin = value === min && value >= 0;
              const isMax = value === max && value >= 0;

              return (
                <motion.div
                  key={valueStr}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getCardColor(
                    value
                  )}`}
                >
                  {/* Card Value */}
                  <div className="flex-shrink-0">
                    <motion.div
                      initial={{ rotateY: 90 }}
                      animate={{ rotateY: 0 }}
                      transition={{
                        delay: 0.5 + index * 0.1,
                        duration: 0.6,
                        ease: 'easeOut',
                      }}
                      className="w-12 h-16 flex items-center justify-center rounded-lg bg-background border-2 shadow-sm"
                    >
                      <span className="text-2xl font-bold">
                        {formatValue(value)}
                      </span>
                    </motion.div>
                  </div>

                  {/* Voters */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {votesForValue.length}{' '}
                        {votesForValue.length === 1 ? 'vote' : 'votes'}
                      </Badge>
                      {isMin && value !== max && (
                        <Badge
                          variant="outline"
                          className="text-xs border-green-500 text-green-600 dark:text-green-400"
                        >
                          Lowest
                        </Badge>
                      )}
                      {isMax && value !== min && (
                        <Badge
                          variant="outline"
                          className="text-xs border-red-500 text-red-600 dark:text-red-400"
                        >
                          Highest
                        </Badge>
                      )}
                      {isMin && isMax && (
                        <Badge
                          variant="outline"
                          className="text-xs border-primary text-primary"
                        >
                          Consensus
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {votesForValue.map((vote) => (
                        <motion.div
                          key={vote.userId}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.6 + index * 0.1,
                            type: 'spring',
                            stiffness: 200,
                          }}
                          className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/50"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://github.com/${vote.username}.png`} />
                            <AvatarFallback>
                              {vote.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {vote.username}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

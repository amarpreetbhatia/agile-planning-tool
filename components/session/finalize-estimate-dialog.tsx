'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinalizeEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  storyTitle: string;
  average: number;
  min: number;
  max: number;
  onFinalized: () => void;
}

export function FinalizeEstimateDialog({
  open,
  onOpenChange,
  sessionId,
  storyTitle,
  average,
  min,
  max,
  onFinalized,
}: FinalizeEstimateDialogProps) {
  const [finalEstimate, setFinalEstimate] = useState<string>(average.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFinalize = async () => {
    const estimateValue = parseFloat(finalEstimate);

    // Validate input
    if (isNaN(estimateValue) || estimateValue < 0) {
      toast({
        title: 'Invalid estimate',
        description: 'Please enter a valid positive number',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalEstimate: estimateValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to finalize estimate');
      }

      toast({
        title: 'Estimate finalized!',
        description: `Final estimate: ${estimateValue} story points${
          data.githubUpdated ? ' (GitHub issue updated)' : ''
        }`,
      });

      onFinalized();
      onOpenChange(false);
    } catch (error) {
      console.error('Error finalizing estimate:', error);
      toast({
        title: 'Failed to finalize',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (value: number) => {
    setFinalEstimate(value.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Finalize Estimate
          </DialogTitle>
          <DialogDescription>
            Set the final consensus estimate for this story
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Story Title */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Story</Label>
            <p className="text-sm font-medium">{storyTitle}</p>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingDown className="h-3 w-3" />
                <span className="text-xs font-medium">MIN</span>
              </div>
              <span className="text-xl font-bold mt-1">{min}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/20"
            >
              <div className="flex items-center gap-1 text-primary">
                <Minus className="h-3 w-3" />
                <span className="text-xs font-medium">AVG</span>
              </div>
              <span className="text-xl font-bold mt-1">{average}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">MAX</span>
              </div>
              <span className="text-xl font-bold mt-1">{max}</span>
            </motion.div>
          </div>

          {/* Quick Select Options */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {[min, average, max].filter((v, i, arr) => arr.indexOf(v) === i).map((value) => (
                <Badge
                  key={value}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleQuickSelect(value)}
                >
                  {value}
                </Badge>
              ))}
              {/* Common Fibonacci values */}
              {[1, 2, 3, 5, 8, 13, 21].filter(v => ![min, average, max].includes(v)).slice(0, 4).map((value) => (
                <Badge
                  key={value}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleQuickSelect(value)}
                >
                  {value}
                </Badge>
              ))}
            </div>
          </div>

          {/* Final Estimate Input */}
          <div className="space-y-2">
            <Label htmlFor="finalEstimate">Final Estimate (Story Points)</Label>
            <Input
              id="finalEstimate"
              type="number"
              min="0"
              step="0.5"
              value={finalEstimate}
              onChange={(e) => setFinalEstimate(e.target.value)}
              placeholder="Enter final estimate"
              disabled={isSubmitting}
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Enter the team&apos;s consensus estimate for this story
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={isSubmitting || !finalEstimate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Finalize Estimate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

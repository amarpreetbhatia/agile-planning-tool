'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { FinalizeEstimateDialog } from './finalize-estimate-dialog';
import { ConfettiCelebration } from './confetti-celebration';

interface FinalizeControlProps {
  sessionId: string;
  storyTitle: string;
  average: number;
  min: number;
  max: number;
  isHost: boolean;
  isRevealed: boolean;
  isFinalized: boolean;
  onFinalized?: () => void;
}

export function FinalizeControl({
  sessionId,
  storyTitle,
  average,
  min,
  max,
  isHost,
  isRevealed,
  isFinalized,
  onFinalized,
}: FinalizeControlProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleFinalized = () => {
    // Show confetti celebration
    setShowConfetti(true);
    
    // Hide confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    // Call parent callback
    onFinalized?.();
  };

  // Don't show button if not host or not revealed
  if (!isHost || !isRevealed) {
    return null;
  }

  // Show finalized state
  if (isFinalized) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          Estimate Finalized
        </span>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        size="lg"
        className="w-full"
      >
        <CheckCircle2 className="h-5 w-5" />
        Finalize Estimate
      </Button>

      <FinalizeEstimateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sessionId={sessionId}
        storyTitle={storyTitle}
        average={average}
        min={min}
        max={max}
        onFinalized={handleFinalized}
      />

      <ConfettiCelebration show={showConfetti} />
    </>
  );
}

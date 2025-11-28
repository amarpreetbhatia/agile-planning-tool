'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VotingModeSelectorProps {
  sessionId: string;
  currentMode: 'anonymous' | 'open';
  isHost: boolean;
  disabled?: boolean;
  onModeChanged?: (newMode: 'anonymous' | 'open') => void;
}

export function VotingModeSelector({
  sessionId,
  currentMode,
  isHost,
  disabled = false,
  onModeChanged,
}: VotingModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<'anonymous' | 'open'>(currentMode);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleModeSelect = (value: string) => {
    const newMode = value as 'anonymous' | 'open';
    if (newMode !== currentMode) {
      setSelectedMode(newMode);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmChange = async () => {
    setIsChanging(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/voting-mode`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votingMode: selectedMode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change voting mode');
      }

      toast({
        title: 'Voting mode changed',
        description: `Voting is now ${selectedMode === 'anonymous' ? 'anonymous' : 'open'}`,
      });

      onModeChanged?.(selectedMode);
    } catch (error) {
      console.error('Error changing voting mode:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change voting mode',
        variant: 'destructive',
      });
      // Reset to current mode on error
      setSelectedMode(currentMode);
    } finally {
      setIsChanging(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCancelChange = () => {
    setSelectedMode(currentMode);
    setShowConfirmDialog(false);
  };

  if (!isHost) {
    // Display current mode for non-host participants
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          {currentMode === 'anonymous' ? (
            <>
              <EyeOff className="h-3 w-3" />
              Anonymous Voting
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Open Voting
            </>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={currentMode}
          onValueChange={handleModeSelect}
          disabled={disabled || isChanging}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anonymous">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                <span>Anonymous</span>
              </div>
            </SelectItem>
            <SelectItem value="open">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Open</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {isChanging && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Voting Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMode === 'open' ? (
                <>
                  Switching to <strong>Open Voting</strong> will show vote values as they are cast.
                  All participants will see who voted what in real-time.
                </>
              ) : (
                <>
                  Switching to <strong>Anonymous Voting</strong> will hide vote values until you
                  reveal them. Participants will only see who has voted, not their values.
                </>
              )}
              <br />
              <br />
              This change will apply to the current and future rounds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Change Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

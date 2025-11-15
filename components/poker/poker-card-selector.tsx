'use client';

import { useState } from 'react';
import { PokerCardGrid } from './poker-card-grid';
import { CardValue } from './poker-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { CheckCircle2, Circle } from 'lucide-react';

interface PokerCardSelectorProps {
  currentStory?: {
    id: string;
    title: string;
    description?: string;
  } | null;
  selectedValue?: CardValue | null;
  onCardSelect: (value: CardValue) => void;
  hasVoted?: boolean;
  isRoundActive?: boolean;
  className?: string;
}

export function PokerCardSelector({
  currentStory,
  selectedValue,
  onCardSelect,
  hasVoted = false,
  isRoundActive = true,
  className,
}: PokerCardSelectorProps) {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCardSelect = (value: CardValue) => {
    onCardSelect(value);
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  if (!currentStory) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Planning Poker</CardTitle>
          <CardDescription>
            Waiting for the host to select a story to estimate...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isRoundActive) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Round Complete</CardTitle>
          <CardDescription>
            Waiting for the next story...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cast Your Vote</CardTitle>
              <CardDescription>
                {hasVoted ? 'You have voted' : 'Select your estimate'}
              </CardDescription>
            </div>
            {hasVoted ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Voted
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Circle className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button className="w-full" size="lg">
                {selectedValue ? `Change Vote (${selectedValue})` : 'Select Card'}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Select Your Estimate</SheetTitle>
                <SheetDescription>
                  Choose a card that represents your estimate for this story
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-6">
                <PokerCardGrid
                  selectedValue={selectedValue}
                  onCardSelect={handleCardSelect}
                  disabled={!isRoundActive}
                />
              </div>
            </SheetContent>
          </Sheet>

          {selectedValue && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Current selection: <span className="font-semibold text-foreground">{selectedValue}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Desktop/Tablet: Inline grid
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cast Your Vote</CardTitle>
            <CardDescription>
              Select a card to estimate the current story
            </CardDescription>
          </div>
          {hasVoted ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Voted
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Circle className="h-3 w-3" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <PokerCardGrid
          selectedValue={selectedValue}
          onCardSelect={handleCardSelect}
          disabled={!isRoundActive}
        />
        {selectedValue && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Current selection: <span className="font-semibold text-foreground">{selectedValue}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

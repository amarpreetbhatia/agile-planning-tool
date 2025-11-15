'use client';

import { PokerCard, CardValue } from './poker-card';
import { cn } from '@/lib/utils';

interface PokerCardGridProps {
  selectedValue?: CardValue | null;
  onCardSelect: (value: CardValue) => void;
  disabled?: boolean;
  className?: string;
}

const CARD_VALUES: CardValue[] = [1, 2, 3, 5, 8, 13, 21, '?', '☕'];

export function PokerCardGrid({
  selectedValue,
  onCardSelect,
  disabled = false,
  className,
}: PokerCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-2 sm:gap-3 md:gap-4',
        // Responsive grid: 3 cols on mobile, 4 cols on tablet, 5 cols on desktop
        'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5',
        // Ensure cards are touch-friendly on mobile
        'touch-manipulation',
        className
      )}
    >
      {CARD_VALUES.map((value) => (
        <PokerCard
          key={value}
          value={value}
          isSelected={selectedValue === value}
          onClick={() => onCardSelect(value)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

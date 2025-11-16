'use client';

import { motion } from 'framer-motion';
import { PokerCard, CardValue } from './poker-card';
import { cn } from '@/lib/utils';

interface PokerCardGridProps {
  selectedValue?: CardValue | null;
  onCardSelect: (value: CardValue) => void;
  disabled?: boolean;
  className?: string;
}

const CARD_VALUES: CardValue[] = [1, 2, 3, 5, 8, 13, 21, '?', '☕'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function PokerCardGrid({
  selectedValue,
  onCardSelect,
  disabled = false,
  className,
}: PokerCardGridProps) {
  return (
    <motion.div
      className={cn(
        'grid gap-2 sm:gap-3 md:gap-4',
        // Responsive grid: 3 cols on mobile, 4 cols on tablet, 5 cols on desktop
        'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5',
        // Ensure cards are touch-friendly on mobile
        'touch-manipulation',
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {CARD_VALUES.map((value, index) => (
        <motion.div key={value} variants={cardVariants}>
          <PokerCard
            value={value}
            isSelected={selectedValue === value}
            onClick={() => onCardSelect(value)}
            disabled={disabled}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

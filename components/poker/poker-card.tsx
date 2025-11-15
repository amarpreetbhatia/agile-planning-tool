'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type CardValue = 1 | 2 | 3 | 5 | 8 | 13 | 21 | '?' | '☕';

interface PokerCardProps {
  value: CardValue;
  isSelected?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PokerCard({
  value,
  isSelected = false,
  isRevealed = false,
  onClick,
  disabled = false,
  className,
}: PokerCardProps) {
  const getCardGradient = (val: CardValue) => {
    // Different gradients for different card values
    if (val === '?') return 'from-purple-500 to-pink-500';
    if (val === '☕') return 'from-amber-500 to-orange-500';
    
    // Fibonacci values get blue/purple gradients with increasing intensity
    const numValue = val as number;
    if (numValue <= 3) return 'from-blue-400 to-blue-600';
    if (numValue <= 8) return 'from-blue-500 to-purple-600';
    return 'from-purple-500 to-indigo-700';
  };

  const getCardLabel = (val: CardValue) => {
    if (val === '?') return 'Unknown';
    if (val === '☕') return 'Break';
    return `${val} points`;
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative aspect-[2/3] rounded-xl overflow-hidden',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:scale-105 active:scale-95',
        className
      )}
      whileHover={!disabled ? { y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      initial={false}
      animate={{
        scale: isSelected ? 1.05 : 1,
        rotateY: isRevealed ? 180 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      aria-label={getCardLabel(value)}
      aria-pressed={isSelected}
    >
      {/* Card Front */}
      <div
        className={cn(
          'absolute inset-0 backface-hidden',
          'bg-gradient-to-br',
          getCardGradient(value),
          'flex items-center justify-center',
          'border-2',
          isSelected ? 'border-white shadow-lg shadow-primary/50' : 'border-white/20'
        )}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <span className="text-white font-bold text-4xl md:text-5xl drop-shadow-lg">
          {value}
        </span>
      </div>

      {/* Card Back (for reveal animation) */}
      <div
        className={cn(
          'absolute inset-0 backface-hidden',
          'bg-gradient-to-br from-slate-700 to-slate-900',
          'flex items-center justify-center',
          'border-2 border-slate-600'
        )}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <div className="w-12 h-16 rounded border-2 border-slate-500 bg-slate-800" />
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 border-4 border-white rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.button>
  );
}

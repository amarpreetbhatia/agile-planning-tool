'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiCelebrationProps {
  show: boolean;
  duration?: number;
}

const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
];

export function ConfettiCelebration({ show, duration = 3000 }: ConfettiCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const pieces: ConfettiPiece[] = [];
      const count = 50;

      for (let i = 0; i < count; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100, // Percentage across screen
          y: -10, // Start above screen
          rotation: Math.random() * 360,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 10 + 5, // 5-15px
          delay: Math.random() * 0.5, // 0-0.5s delay
        });
      }

      setConfetti(pieces);

      // Clear confetti after duration
      const timer = setTimeout(() => {
        setConfetti([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: `${piece.x}vw`,
              y: '-10vh',
              rotate: piece.rotation,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              rotate: piece.rotation + 720, // Two full rotations
              opacity: [1, 1, 0],
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random() * 2, // 2-4 seconds
              delay: piece.delay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

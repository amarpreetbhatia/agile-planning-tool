/**
 * Animation Utilities
 * 
 * This file contains reusable animation variants and configurations
 * for Framer Motion animations throughout the application.
 */

import { Variants } from 'framer-motion';

/**
 * Page transition animations
 * Used for smooth transitions between pages
 */
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Card flip animation
 * Used for poker cards during reveal
 */
export const cardFlipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
  back: {
    rotateY: 180,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Slide in/out animations
 * Used for participant join/leave
 */
export const slideVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Fade in/out animations
 * Used for general content transitions
 */
export const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Scale animations
 * Used for button press feedback
 */
export const scaleVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
};

/**
 * Stagger container animations
 * Used for lists and grids
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * Stagger item animations
 * Used with stagger containers
 */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * Pulse animation configuration
 * Used for voting indicators
 */
export const pulseAnimation = {
  scale: [1, 1.2, 1],
  opacity: [0.5, 1, 0.5],
};

export const pulseTransition = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

/**
 * Pop animation
 * Used for checkmarks and success indicators
 */
export const popVariants: Variants = {
  initial: {
    scale: 0,
  },
  animate: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
};

/**
 * Bounce animation
 * Used for attention-grabbing elements
 */
export const bounceVariants: Variants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

/**
 * Shimmer animation configuration
 * Used for loading states
 */
export const shimmerAnimation = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
};

export const shimmerTransition = {
  duration: 2,
  repeat: Infinity,
  ease: 'linear' as const,
};

/**
 * Spring configuration presets
 */
export const springConfigs = {
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 10,
  },
};

/**
 * Easing presets
 */
export const easings = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  anticipate: [0.36, 0.66, 0.04, 1],
};

# Poker Card Components

This directory contains the planning poker card selection UI components.

## Components

### PokerCard

A single poker card component with Fibonacci values and special cards.

**Features:**
- Fibonacci sequence values: 1, 2, 3, 5, 8, 13, 21
- Special cards: ? (Unknown), ☕ (Break)
- Gradient backgrounds based on card value
- Hover and selection animations with Framer Motion
- Card flip animation for reveal functionality
- Accessible with ARIA labels and keyboard support

**Props:**
- `value`: CardValue - The card value to display
- `isSelected`: boolean - Whether the card is currently selected
- `isRevealed`: boolean - Whether to show the card flip animation
- `onClick`: () => void - Handler for card selection
- `disabled`: boolean - Whether the card is disabled
- `className`: string - Additional CSS classes

### PokerCardGrid

A responsive grid layout for displaying all poker cards.

**Features:**
- Responsive grid: 3 columns on mobile, 4 on tablet, 5 on desktop
- Manages all card values (Fibonacci + special cards)
- Handles card selection state

**Props:**
- `selectedValue`: CardValue | null - Currently selected card value
- `onCardSelect`: (value: CardValue) => void - Handler for card selection
- `disabled`: boolean - Whether all cards are disabled
- `className`: string - Additional CSS classes

### PokerCardSelector

The main component that integrates poker cards with session context.

**Features:**
- Responsive design: Bottom sheet on mobile, inline grid on desktop/tablet
- Shows voting status (voted/pending)
- Displays current story context
- Handles round state (active/complete)
- Mobile-optimized with bottom sheet for card selection

**Props:**
- `currentStory`: Story object or null - The story being estimated
- `selectedValue`: CardValue | null - Currently selected card value
- `onCardSelect`: (value: CardValue) => void - Handler for card selection
- `hasVoted`: boolean - Whether the user has voted
- `isRoundActive`: boolean - Whether the estimation round is active
- `className`: string - Additional CSS classes

## Usage

```tsx
import { PokerCardSelector } from '@/components/poker';

<PokerCardSelector
  currentStory={currentStory}
  selectedValue={selectedValue}
  onCardSelect={(value) => {
    // Handle vote casting
    console.log('Card selected:', value);
  }}
  hasVoted={hasVoted}
  isRoundActive={isRoundActive}
/>
```

## Card Values

- **1, 2, 3**: Small tasks (blue gradient)
- **5, 8**: Medium tasks (blue-purple gradient)
- **13, 21**: Large tasks (purple-indigo gradient)
- **?**: Unknown/Need more info (purple-pink gradient)
- **☕**: Break time (amber-orange gradient)

## Animations

- **Hover**: Cards lift up slightly on hover
- **Selection**: Selected cards scale up and show a white border
- **Tap**: Cards scale down on tap for tactile feedback
- **Flip**: Cards can flip to reveal (for future reveal functionality)

## Responsive Behavior

### Mobile (< 640px)
- Bottom sheet for card selection
- Button to open card selector
- Full-width layout
- Touch-optimized tap targets

### Tablet (640px - 1024px)
- Inline card grid (4 columns)
- Compact spacing
- Hover effects enabled

### Desktop (> 1024px)
- Inline card grid (5 columns)
- Larger cards
- Full hover and animation effects

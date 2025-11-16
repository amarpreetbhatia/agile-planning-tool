# Animations and Micro-interactions Guide

This document describes all animations and micro-interactions implemented in the Agile Estimation Poker application.

## Overview

The application uses Framer Motion for animations and custom CSS for additional effects. All animations are designed to be smooth, performant, and enhance the user experience without being distracting.

## Implemented Animations

### 1. Card Flip Animation (Estimate Reveal)

**Location:** `components/poker/poker-card.tsx`

**Description:** Poker cards flip from back to front when estimates are revealed, creating a dramatic reveal effect.

**Implementation:**
- Uses `rotateY` transform for 3D flip effect
- Duration: 0.6s with easeOut timing
- Cards flip individually with staggered timing in results view
- Backface visibility hidden for clean flip

**Trigger:** When host reveals estimates

### 2. Participant Join/Leave Animations

**Location:** `components/session/responsive-participant-list.tsx`, `components/session/voting-status.tsx`

**Description:** Participants slide in from the left when joining and slide out to the right when leaving.

**Implementation:**
- Initial state: `opacity: 0, x: -20`
- Animate to: `opacity: 1, x: 0`
- Exit state: `opacity: 0, x: 20`
- Spring animation with stiffness: 300, damping: 25
- Uses AnimatePresence for smooth exit animations

**Trigger:** Real-time when participants join/leave session

### 3. Voting Pulse Indicator

**Location:** `components/session/voting-status.tsx`

**Description:** Empty circle indicators pulse while waiting for votes, creating a subtle "waiting" effect.

**Implementation:**
- Animates scale: `[1, 1.2, 1]`
- Animates opacity: `[0.5, 1, 0.5]`
- Duration: 2s
- Infinite repeat with easeInOut
- Stops pulsing when vote is cast

**Trigger:** Active while participant hasn't voted

### 4. Button Press Scale Feedback

**Location:** `components/ui/button.tsx`

**Description:** All buttons scale down slightly when pressed, providing tactile feedback.

**Implementation:**
- Uses `whileTap={{ scale: 0.95 }}`
- Spring animation with stiffness: 400, damping: 17
- Applied to all non-asChild buttons automatically

**Trigger:** On button press/tap

### 5. Page Transition Fade Effects

**Location:** `components/layout/page-transition.tsx`

**Description:** Pages fade in and slide up when entering, fade out and slide down when exiting.

**Implementation:**
- Initial: `opacity: 0, y: 20`
- Animate: `opacity: 1, y: 0` (0.3s easeOut)
- Exit: `opacity: 0, y: -20` (0.2s easeIn)
- Uses AnimatePresence with mode="wait"

**Trigger:** On route changes

**Usage:**
```tsx
<PageTransition>
  {children}
</PageTransition>
```

### 6. Confetti Effect (Estimate Finalization)

**Location:** `components/session/confetti-celebration.tsx`

**Description:** Colorful confetti pieces fall from top to bottom when an estimate is finalized.

**Implementation:**
- 50 confetti pieces with random colors, sizes, and positions
- Falls from -10vh to 110vh
- Rotates 720 degrees during fall
- Duration: 2-4 seconds (randomized)
- Fades out at the end
- Auto-clears after 3 seconds

**Trigger:** When host finalizes an estimate

### 7. Hover Effects on Interactive Elements

**Location:** Multiple components + `app/globals.css`

**Description:** Cards, buttons, and interactive elements lift slightly on hover.

**Implementation:**

**Session Cards:**
- Hover: `y: -4` with shadow increase
- Transition: 0.2s duration

**Poker Cards:**
- Hover: `y: -4, scale: 1.05`
- Active: `scale: 0.95`
- Spring animation

**CSS Utilities:**
- `.hover-lift`: translateY(-2px) + shadow
- `.hover-scale`: scale(1.05)
- `.interactive`: Combined hover effects

**Trigger:** Mouse hover or touch

### 8. Loading Spinner Animations

**Location:** `components/ui/spinner.tsx`

**Description:** Multiple spinner variants for different loading states.

**Variants:**

**Spinner (Circular):**
- Rotates 360 degrees continuously
- 1s duration, linear timing
- Border animation with primary color

**SpinnerDots:**
- Three dots that scale and fade in sequence
- Staggered delay: 0.2s between dots
- 1s duration per cycle

**SpinnerPulse:**
- Single circle that scales and fades
- Scale: [1, 1.2, 1]
- Opacity: [1, 0.5, 1]
- 1.5s duration

**Trigger:** During async operations

### 9. Staggered Card Grid Animation

**Location:** `components/poker/poker-card-grid.tsx`

**Description:** Poker cards appear in sequence when the grid loads.

**Implementation:**
- Container uses staggerChildren: 0.05s
- Each card: `opacity: 0, y: 20, scale: 0.8` → `opacity: 1, y: 0, scale: 1`
- Spring animation with stiffness: 300, damping: 24

**Trigger:** When poker card grid mounts

### 10. Story Selection Animation

**Location:** `components/session/story-display.tsx`

**Description:** Story cards animate in when selected and out when changed.

**Implementation:**
- Initial: `opacity: 0, y: 20, scale: 0.95`
- Animate: `opacity: 1, y: 0, scale: 1`
- Exit: `opacity: 0, y: -20, scale: 0.95`
- Spring animation for smooth feel
- Content fades in with staggered delays

**Trigger:** When host selects a new story

### 11. Loading Skeleton Animations

**Location:** `components/loading/session-skeleton.tsx`

**Description:** Skeleton screens animate in with staggered timing.

**Implementation:**
- Container stagger: 0.1s between items
- Items: `opacity: 0, y: 20` → `opacity: 1, y: 0`
- Pulse animation on skeleton elements
- Shimmer effect on loading bars

**Trigger:** While page/data is loading

### 12. Estimate Results Animation

**Location:** `components/session/estimate-results.tsx`

**Description:** Results animate in with staggered timing for statistics and vote breakdown.

**Implementation:**
- Statistics cards: Staggered 0.1s delays
- Vote cards: Flip animation (rotateY: 90 → 0)
- Voter avatars: Scale from 0 to 1
- Checkmarks: Pop animation on appearance

**Trigger:** When estimates are revealed

### 13. Session Card Hover

**Location:** `components/session/session-card.tsx`

**Description:** Session cards on dashboard lift and show shadow on hover.

**Implementation:**
- Hover: `y: -4` with increased shadow
- Participant avatars scale in with stagger
- Smooth transitions on all elements

**Trigger:** Mouse hover on session cards

## CSS Animation Utilities

**Location:** `app/globals.css`

### Custom Animations

```css
@keyframes pulse-glow
@keyframes shimmer
```

### Utility Classes

- `.animate-pulse-glow`: Pulsing glow effect
- `.animate-shimmer`: Shimmer loading effect
- `.hover-scale`: Scale on hover
- `.hover-lift`: Lift on hover
- `.backface-hidden`: For card flips
- `.interactive`: Combined interactive effects

## Animation Library

**Location:** `lib/animations.ts`

Reusable animation variants and configurations:
- `pageTransitionVariants`
- `cardFlipVariants`
- `slideVariants`
- `fadeVariants`
- `scaleVariants`
- `staggerContainerVariants`
- `staggerItemVariants`
- `pulseAnimation`
- `popVariants`
- `bounceVariants`
- Spring configuration presets
- Easing presets

## Performance Considerations

1. **GPU Acceleration:** All animations use transform and opacity properties for GPU acceleration
2. **Will-change:** Applied to frequently animated elements
3. **Reduced Motion:** Respects user's prefers-reduced-motion setting
4. **Lazy Loading:** Animations only run when components are visible
5. **Cleanup:** All animations properly clean up on unmount

## Best Practices

1. **Consistency:** All animations use consistent timing and easing
2. **Purpose:** Every animation serves a functional purpose
3. **Subtlety:** Animations enhance without distracting
4. **Performance:** Animations are optimized for 60fps
5. **Accessibility:** Animations respect user preferences

## Testing Animations

To test animations:
1. Enable slow motion in browser DevTools
2. Test on different devices and screen sizes
3. Test with reduced motion enabled
4. Verify animations don't block interactions
5. Check performance with Chrome DevTools Performance tab

## Future Enhancements

Potential animation improvements:
- Gesture-based animations for mobile
- More sophisticated card shuffle animations
- Animated charts for estimate statistics
- Celebration animations for consensus
- Animated transitions between estimation rounds

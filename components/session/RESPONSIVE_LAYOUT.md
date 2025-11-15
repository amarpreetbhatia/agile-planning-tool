# Responsive Session Page Layout

This document describes the responsive layout implementation for the planning poker session page.

## Overview

The session page adapts to three different screen sizes:
- **Mobile** (< 640px): Single column with bottom sheet for cards
- **Tablet** (640px - 1024px): Two columns with side drawer
- **Desktop** (> 1024px): Three columns (participants | main | details)

## Components

### SessionPageLayout
Main layout component that orchestrates the responsive behavior.

**Props:**
- `sessionName`: Session name
- `sessionId`: Unique session identifier
- `status`: Session status ('active' | 'archived')
- `isHost`: Whether current user is the host
- `participants`: Array of session participants
- `currentStory`: Currently selected story
- `storyManager`: Story management component
- `pokerCards`: Poker card selector component
- `githubIntegration`: GitHub integration component (optional)

### SessionHeader
Responsive header component that displays session information.

**Responsive Behavior:**
- Mobile: Compact layout with smaller text
- Desktop: Full-size layout with larger text

### CollapsibleStoryDisplay
Mobile-optimized story display with expand/collapse functionality.

**Features:**
- Always shows title and badges
- Collapsible description section
- Line-clamped preview when collapsed
- Smooth expand/collapse animation

### ResponsiveParticipantList
Participant list that adapts to screen size.

**Responsive Behavior:**
- Mobile: Compact layout with smaller avatars
- Desktop: Standard layout with full-size avatars

## Layout Breakpoints

Using Tailwind CSS breakpoints:
- `sm`: 640px (mobile to tablet)
- `md`: 768px
- `lg`: 1024px (tablet to desktop)

## Mobile Layout (< 640px)

### Structure
```
┌─────────────────────────┐
│ Sticky Header           │
│ [Session Name] [Menu]   │
├─────────────────────────┤
│                         │
│ Scrollable Content      │
│ - Collapsible Story     │
│ - Story Manager         │
│                         │
│                         │
├─────────────────────────┤
│ Fixed Bottom Sheet      │
│ [Poker Cards]           │
└─────────────────────────┘
```

### Features
- Sticky header with hamburger menu
- Collapsible story display
- Fixed bottom sheet for poker cards
- Swipe gestures:
  - Swipe from left edge → Open participants drawer
- Participants accessible via button in header
- Touch-optimized tap targets (min 44x44px)

### Swipe Gestures
- **Left edge swipe right**: Opens participants drawer
- Minimum swipe distance: 50px
- Horizontal swipes only (vertical scrolling preserved)

## Tablet Layout (640px - 1024px)

### Structure
```
┌─────────────────────────────────────┐
│ Header                              │
├──────────────────┬──────────────────┤
│                  │                  │
│ Left Column      │ Right Column     │
│ - Story          │ - Session Link   │
│ - Controls       │ - Participants   │
│ - Poker Cards    │ - Voting Status  │
│                  │                  │
└──────────────────┴──────────────────┘
```

### Features
- Two-column grid layout
- Side drawer for additional info (optional)
- Both columns independently scrollable
- Larger tap targets than mobile

## Desktop Layout (> 1024px)

### Structure
```
┌────────────────────────────────────────────────┐
│ Header                                         │
├──────────┬─────────────────────┬───────────────┤
│          │                     │               │
│ Left     │ Main Content        │ Right Panel   │
│ Sidebar  │ - Story Display     │ (Reserved)    │
│          │ - GitHub Integration│               │
│ - Link   │ - Story Manager     │               │
│ - Parts  │ - Poker Cards       │               │
│ - Voting │                     │               │
│          │                     │               │
└──────────┴─────────────────────┴───────────────┘
```

### Features
- Three-column layout
- Persistent left sidebar with participants
- Centered main content (max-width: 4xl)
- Right panel reserved for future features
- All columns independently scrollable

## Touch Optimization

### Mobile-Specific Optimizations
1. **Touch Targets**: Minimum 44x44px for all interactive elements
2. **Touch Manipulation**: CSS `touch-action` for better performance
3. **Swipe Gestures**: Native-feeling swipe interactions
4. **Bottom Sheet**: Fixed positioning for easy thumb access
5. **Reduced Gaps**: Smaller spacing between elements

### Tablet-Specific Optimizations
1. **Larger Touch Targets**: 48x48px minimum
2. **Side Drawers**: Sheet components for contextual info
3. **Grid Layout**: Efficient use of screen space

## Accessibility

### Keyboard Navigation
- All interactive elements keyboard accessible
- Proper focus management in drawers/sheets
- Skip links for main content areas

### Screen Readers
- Semantic HTML structure
- ARIA labels for icon buttons
- Proper heading hierarchy

### Focus Management
- Visible focus indicators
- Focus trap in modal/sheet components
- Logical tab order

## Performance Considerations

### Optimization Strategies
1. **Conditional Rendering**: Only render layout for current breakpoint
2. **CSS-Based Responsiveness**: Use Tailwind utilities for performance
3. **Lazy Loading**: Defer non-critical components
4. **Touch Event Optimization**: Passive event listeners where possible

### Bundle Size
- Responsive hooks are lightweight (< 1KB)
- Layout components use existing UI primitives
- No additional dependencies for responsive behavior

## Usage Example

```tsx
<SessionPageLayout
  sessionName="Sprint Planning"
  sessionId="abc123"
  status="active"
  isHost={true}
  participants={participants}
  currentStory={currentStory}
  storyManager={<StoryManager {...props} />}
  pokerCards={<PokerCardSelector {...props} />}
  githubIntegration={<GitHubIntegration {...props} />}
/>
```

## Testing Responsive Layouts

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different device presets:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

### Manual Testing
- Test on actual devices when possible
- Verify touch interactions on mobile
- Check swipe gestures work correctly
- Ensure all content is accessible

## Future Enhancements

### Potential Improvements
1. **Landscape Mode**: Optimize for landscape orientation on mobile
2. **Split Screen**: Support for iPad split-screen mode
3. **Foldable Devices**: Adapt to foldable screen configurations
4. **Gesture Customization**: Allow users to customize swipe actions
5. **Right Panel Content**: Add estimate history, analytics, etc.

## Related Files

- `components/session/session-page-layout.tsx` - Main layout component
- `components/session/session-header.tsx` - Responsive header
- `components/session/collapsible-story-display.tsx` - Mobile story display
- `components/session/responsive-participant-list.tsx` - Responsive participants
- `hooks/use-mobile.tsx` - Breakpoint detection hooks
- `hooks/use-swipe.ts` - Swipe gesture detection

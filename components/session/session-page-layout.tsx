'use client';

import React, { ReactNode } from 'react';
import { SessionHeader } from './session-header';
import { SessionLink } from './session-link';
import { StoryDisplay } from './story-display';
import { StoryWithComments } from './story-with-comments';
import { CollapsibleStoryDisplay } from './collapsible-story-display';
import { VotingAndReveal } from './voting-and-reveal';
import { EndSessionControl } from './end-session-control';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Users, BookOpen } from 'lucide-react';
import { ISerializedParticipant, IStory } from '@/types';
import { cn } from '@/lib/utils';

interface SessionPageLayoutProps {
  sessionName: string;
  sessionId: string;
  status: 'active' | 'archived';
  isHost: boolean;
  participants: ISerializedParticipant[];
  currentStory?: IStory | null;
  currentUserId: string;
  votingMode?: 'anonymous' | 'open';
  storyManager: ReactNode;
  pokerCards: ReactNode;
  githubIntegration?: ReactNode;
  chatPanel?: ReactNode;
  className?: string;
}

export function SessionPageLayout({
  sessionName,
  sessionId,
  status,
  isHost,
  participants,
  currentStory,
  currentUserId,
  votingMode = 'anonymous',
  storyManager,
  pokerCards,
  githubIntegration,
  chatPanel,
  className,
}: SessionPageLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <MobileSessionPage
          sessionName={sessionName}
          sessionId={sessionId}
          status={status}
          isHost={isHost}
          participants={participants}
          currentStory={currentStory}
          currentUserId={currentUserId}
          votingMode={votingMode}
          storyManager={storyManager}
          pokerCards={pokerCards}
          githubIntegration={githubIntegration}
          className={className}
        />
        {chatPanel}
      </>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <>
        <TabletSessionPage
          sessionName={sessionName}
          sessionId={sessionId}
          status={status}
          isHost={isHost}
          participants={participants}
          currentStory={currentStory}
          currentUserId={currentUserId}
          votingMode={votingMode}
          storyManager={storyManager}
          pokerCards={pokerCards}
          githubIntegration={githubIntegration}
          className={className}
        />
        {chatPanel}
      </>
    );
  }

  // Desktop Layout
  return (
    <DesktopSessionPage
      sessionName={sessionName}
      sessionId={sessionId}
      status={status}
      isHost={isHost}
      participants={participants}
      currentStory={currentStory}
      currentUserId={currentUserId}
      votingMode={votingMode}
      storyManager={storyManager}
      pokerCards={pokerCards}
      githubIntegration={githubIntegration}
      chatPanel={chatPanel}
      className={className}
    />
  );
}

// Mobile: Single column with bottom sheet for cards
function MobileSessionPage({
  sessionName,
  sessionId,
  status,
  isHost,
  participants,
  currentStory,
  storyManager,
  pokerCards,
  githubIntegration,
  className,
}: SessionPageLayoutProps) {
  const [participantsOpen, setParticipantsOpen] = React.useState(false);

  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between gap-2 p-4">
          <SessionHeader
            sessionName={sessionName}
            sessionId={sessionId}
            status={status}
            className="flex-1 min-w-0"
          />
          <div className="flex items-center gap-2 shrink-0">
            {/* Participants drawer */}
            <Sheet open={participantsOpen} onOpenChange={setParticipantsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Users className="h-4 w-4" />
                  <span className="sr-only">View participants</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>Session Info</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4 overflow-auto pb-6">
                  <SessionLink sessionId={sessionId} />
                  <VotingAndReveal
                    participants={participants}
                    currentStory={currentStory}
                    sessionId={sessionId}
                    isHost={isHost}
                    votingMode={votingMode}
                  />
                  {isHost && (
                    <EndSessionControl sessionId={sessionId} isHost={isHost} />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main scrollable content with swipe gesture support */}
      <div 
        className="flex-1 overflow-auto pb-24"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const startX = touch.clientX;
          const startY = touch.clientY;
          
          const handleTouchEnd = (endEvent: TouchEvent) => {
            const endTouch = endEvent.changedTouches[0];
            const deltaX = endTouch.clientX - startX;
            const deltaY = endTouch.clientY - startY;
            
            // Swipe from left edge to open participants
            if (startX < 50 && deltaX > 100 && Math.abs(deltaY) < 50) {
              setParticipantsOpen(true);
            }
            
            document.removeEventListener('touchend', handleTouchEnd);
          };
          
          document.addEventListener('touchend', handleTouchEnd);
        }}
      >
        <div className="p-4 space-y-4">
          {/* Collapsible story display */}
          <CollapsibleStoryDisplay story={currentStory || null} />

          {/* Story manager (host controls) */}
          {githubIntegration}
          {storyManager}
        </div>
      </div>

      {/* Fixed bottom sheet for poker cards */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg">
        <div className="p-4">
          {pokerCards}
        </div>
      </div>
    </div>
  );
}

// Tablet: Two columns with side drawer
function TabletSessionPage({
  sessionName,
  sessionId,
  status,
  isHost,
  participants,
  currentStory,
  currentUserId,
  storyManager,
  pokerCards,
  githubIntegration,
  className,
}: SessionPageLayoutProps) {
  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <SessionHeader
            sessionName={sessionName}
            sessionId={sessionId}
            status={status}
          />
          <div className="flex items-center gap-2">
            {isHost && <EndSessionControl sessionId={sessionId} isHost={isHost} />}
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-6 h-full p-6">
          {/* Left column - Story and controls */}
          <div className="space-y-6 overflow-auto">
            <StoryWithComments
              story={currentStory || null}
              isHost={isHost}
              sessionId={sessionId}
            />
            {githubIntegration}
            {storyManager}
            {pokerCards}
          </div>

          {/* Right column - Participants and session info */}
          <div className="space-y-6 overflow-auto">
            <SessionLink sessionId={sessionId} />
            <VotingAndReveal
              participants={participants}
              currentStory={currentStory}
              sessionId={sessionId}
              isHost={isHost}
              votingMode={votingMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Desktop: Three columns (participants | main | chat)
function DesktopSessionPage({
  sessionName,
  sessionId,
  status,
  isHost,
  participants,
  currentStory,
  currentUserId,
  storyManager,
  pokerCards,
  githubIntegration,
  chatPanel,
  className,
}: SessionPageLayoutProps) {
  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-8 py-4">
          <SessionHeader
            sessionName={sessionName}
            sessionId={sessionId}
            status={status}
          />
          {isHost && <EndSessionControl sessionId={sessionId} isHost={isHost} />}
        </div>
      </div>

      {/* Three column layout */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Left sidebar - Participants */}
          <aside className="w-80 border-r bg-muted/40 overflow-auto">
            <div className="p-6 space-y-6">
              <SessionLink sessionId={sessionId} />
              <VotingAndReveal
                participants={participants}
                currentStory={currentStory}
                sessionId={sessionId}
                isHost={isHost}
                votingMode={votingMode}
              />
            </div>
          </aside>

          {/* Main content - Story and cards */}
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-6 max-w-4xl mx-auto">
              <StoryWithComments
                story={currentStory || null}
                isHost={isHost}
                sessionId={sessionId}
              />
              {githubIntegration}
              {storyManager}
              {pokerCards}
            </div>
          </main>

          {/* Right panel - Chat */}
          {chatPanel}
        </div>
      </div>
    </div>
  );
}

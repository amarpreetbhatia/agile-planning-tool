'use client';

import { ReactNode, useState } from 'react';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Users, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveSessionLayoutProps {
  header: ReactNode;
  storyDisplay: ReactNode;
  pokerCards: ReactNode;
  participantList: ReactNode;
  sessionInfo: ReactNode;
  className?: string;
}

export function ResponsiveSessionLayout({
  header,
  storyDisplay,
  pokerCards,
  participantList,
  sessionInfo,
  className,
}: ResponsiveSessionLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Mobile Layout
  if (isMobile) {
    return (
      <MobileSessionLayout
        header={header}
        storyDisplay={storyDisplay}
        pokerCards={pokerCards}
        participantList={participantList}
        sessionInfo={sessionInfo}
        className={className}
      />
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <TabletSessionLayout
        header={header}
        storyDisplay={storyDisplay}
        pokerCards={pokerCards}
        participantList={participantList}
        sessionInfo={sessionInfo}
        className={className}
      />
    );
  }

  // Desktop Layout
  return (
    <DesktopSessionLayout
      header={header}
      storyDisplay={storyDisplay}
      pokerCards={pokerCards}
      participantList={participantList}
      sessionInfo={sessionInfo}
      className={className}
    />
  );
}

// Mobile Layout: Single column with bottom sheet for cards
function MobileSessionLayout({
  header,
  storyDisplay,
  pokerCards,
  participantList,
  sessionInfo,
  className,
}: ResponsiveSessionLayoutProps) {
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {/* Mobile Header with hamburger menu */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {header}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Story drawer */}
            <Sheet open={storyOpen} onOpenChange={setStoryOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <BookOpen className="h-4 w-4" />
                  <span className="sr-only">View story</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Current Story</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-auto pb-6">
                  {storyDisplay}
                </div>
              </SheetContent>
            </Sheet>

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
                  {sessionInfo}
                  {participantList}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-auto p-4 pb-24">
        <div className="space-y-4">
          {/* Collapsible story preview */}
          <div className="lg:hidden">
            {storyDisplay}
          </div>
        </div>
      </div>

      {/* Bottom sheet for poker cards - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="p-4">
          {pokerCards}
        </div>
      </div>
    </div>
  );
}

// Tablet Layout: Two columns with side drawer
function TabletSessionLayout({
  header,
  storyDisplay,
  pokerCards,
  participantList,
  sessionInfo,
  className,
}: ResponsiveSessionLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {header}
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Participants
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[350px]">
              <SheetHeader>
                <SheetTitle>Session Info</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 overflow-auto pb-6">
                {sessionInfo}
                {participantList}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Two column layout */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-6 h-full p-6">
          {/* Left column - Story and cards */}
          <div className="space-y-6 overflow-auto">
            {storyDisplay}
            {pokerCards}
          </div>

          {/* Right column - Participants (visible on tablet) */}
          <div className="space-y-6 overflow-auto">
            {sessionInfo}
            {participantList}
          </div>
        </div>
      </div>
    </div>
  );
}

// Desktop Layout: Three columns (participants | main | details)
function DesktopSessionLayout({
  header,
  storyDisplay,
  pokerCards,
  participantList,
  sessionInfo,
  className,
}: ResponsiveSessionLayoutProps) {
  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-8 py-4">
          {header}
        </div>
      </div>

      {/* Three column layout */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Left sidebar - Participants */}
          <aside className="w-80 border-r bg-muted/40 overflow-auto">
            <div className="p-6 space-y-6">
              {sessionInfo}
              {participantList}
            </div>
          </aside>

          {/* Main content - Story and cards */}
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-6 max-w-4xl mx-auto">
              {storyDisplay}
              {pokerCards}
            </div>
          </main>

          {/* Right panel - Additional details (can be used for results, etc.) */}
          <aside className="w-96 border-l bg-muted/40 overflow-auto">
            <div className="p-6">
              {/* This space can be used for estimate results, history, etc. */}
              <div className="text-sm text-muted-foreground">
                {/* Additional session details can go here */}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

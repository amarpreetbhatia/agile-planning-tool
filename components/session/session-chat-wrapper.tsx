'use client';

import { useState, useEffect } from 'react';
import { ChatPanel } from './chat-panel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface SessionChatWrapperProps {
  sessionId: string;
  currentUserId: string;
}

export function SessionChatWrapper({ sessionId, currentUserId }: SessionChatWrapperProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load chat open/closed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`chat-open-${sessionId}`);
    if (savedState !== null) {
      setIsOpen(savedState === 'true');
    } else {
      // Default to open on desktop, closed on mobile
      setIsOpen(!isMobile);
    }
  }, [sessionId, isMobile]);

  // Persist chat open/closed state
  useEffect(() => {
    localStorage.setItem(`chat-open-${sessionId}`, String(isOpen));
  }, [isOpen, sessionId]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Mobile: Show as bottom sheet
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] p-0">
            <ChatPanel
              sessionId={sessionId}
              currentUserId={currentUserId}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Show as collapsible sidebar panel
  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-96' : 'w-0'} overflow-hidden`}>
      {isOpen ? (
        <ChatPanel
          sessionId={sessionId}
          currentUserId={currentUserId}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="h-full"
        />
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-20 z-40 h-12 w-12 rounded-full shadow-lg"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}

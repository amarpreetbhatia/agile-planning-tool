'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ExternalLink, X } from 'lucide-react';
import { IStory, IStoryComment } from '@/types';
import { StoryComments } from './story-comments';
import { useSocket } from '@/hooks/use-socket';

interface StoryWithCommentsProps {
  sessionId: string;
  story: IStory | null;
  isHost: boolean;
  onClearStory?: () => void;
}

const storyVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: {
      duration: 0.2,
    }
  },
};

export function StoryWithComments({ 
  sessionId, 
  story, 
  isHost, 
  onClearStory 
}: StoryWithCommentsProps) {
  const [currentStory, setCurrentStory] = useState<IStory | null>(story);
  const { socket } = useSocket();

  // Update story when prop changes
  useEffect(() => {
    setCurrentStory(story);
  }, [story]);

  // Listen for real-time comment updates
  useEffect(() => {
    if (!socket || !currentStory) return;

    const handleStoryComment = (storyId: string, comment: IStoryComment) => {
      if (storyId === currentStory.id) {
        setCurrentStory((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            comments: [...(prev.comments || []), comment],
          };
        });
      }
    };

    socket.on('story:comment', handleStoryComment);

    return () => {
      socket.off('story:comment', handleStoryComment);
    };
  }, [socket, currentStory]);

  if (!currentStory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Current Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No story selected. {isHost && 'Select a story to begin estimation.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStory.id}
        variants={storyVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Current Story
              </CardTitle>
              {isHost && onClearStory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearStory}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear story</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Story details */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold leading-tight">{currentStory.title}</h3>
                {currentStory.source === 'github' && 
                 currentStory.githubIssueNumber && 
                 currentStory.githubRepoFullName && (
                  <a
                    href={`https://github.com/${currentStory.githubRepoFullName}/issues/${currentStory.githubIssueNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentStory.source}
                </Badge>
                {currentStory.githubRepoFullName && currentStory.githubIssueNumber && (
                  <span className="text-xs text-muted-foreground">
                    {currentStory.githubRepoFullName} #{currentStory.githubIssueNumber}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Description */}
            {currentStory.description && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <ScrollArea className="h-[150px] rounded-md border p-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentStory.description}
                  </p>
                </ScrollArea>
              </motion.div>
            )}

            <Separator />

            {/* Comments section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <StoryComments
                sessionId={sessionId}
                storyId={currentStory.id}
                initialComments={currentStory.comments || []}
              />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

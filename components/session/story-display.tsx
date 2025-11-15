'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, ExternalLink, X } from 'lucide-react';
import { IStory } from '@/types';

interface StoryDisplayProps {
  story: IStory | null;
  isHost: boolean;
  onClearStory?: () => void;
}

export function StoryDisplay({ story, isHost, onClearStory }: StoryDisplayProps) {
  if (!story) {
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
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight">{story.title}</h3>
            {story.source === 'github' && story.githubIssueNumber && story.githubRepoFullName && (
              <a
                href={`https://github.com/${story.githubRepoFullName}/issues/${story.githubIssueNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {story.source}
            </Badge>
            {story.githubRepoFullName && story.githubIssueNumber && (
              <span className="text-xs text-muted-foreground">
                {story.githubRepoFullName} #{story.githubIssueNumber}
              </span>
            )}
          </div>
        </div>

        {story.description && (
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {story.description}
              </p>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

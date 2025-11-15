'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { IStory } from '@/types';
import { cn } from '@/lib/utils';

interface CollapsibleStoryDisplayProps {
  story: IStory | null;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsibleStoryDisplay({
  story,
  defaultExpanded = false,
  className,
}: CollapsibleStoryDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!story) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Current Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No story selected
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Current Story
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isExpanded ? 'Collapse' : 'Expand'} story
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Always visible: Title and badges */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">
              {story.title}
            </h3>
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
              <span className="text-xs text-muted-foreground truncate">
                {story.githubRepoFullName} #{story.githubIssueNumber}
              </span>
            )}
          </div>
        </div>

        {/* Collapsible: Description */}
        {isExpanded && story.description && (
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium mb-2">Description</h4>
            <ScrollArea className="h-[150px] rounded-md border p-3">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {story.description}
              </p>
            </ScrollArea>
          </div>
        )}

        {!isExpanded && story.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {story.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

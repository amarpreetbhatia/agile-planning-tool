'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, GitBranch } from 'lucide-react';
import { IStory } from '@/types';

interface ImportedStoriesListProps {
  stories: IStory[];
  onStorySelect?: (story: IStory) => void;
  selectedStoryId?: string;
}

export function ImportedStoriesList({
  stories,
  onStorySelect,
  selectedStoryId,
}: ImportedStoriesListProps) {
  if (stories.length === 0) {
    return null;
  }

  const githubStories = stories.filter((s) => s.source === 'github');

  if (githubStories.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" />
          Imported Stories ({githubStories.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {githubStories.map((story) => (
              <div
                key={story.id}
                className={`p-3 border rounded-md space-y-2 transition-colors ${
                  selectedStoryId === story.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium leading-tight">
                      {story.title}
                    </h4>
                    {story.githubRepoFullName && story.githubIssueNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {story.githubRepoFullName} #{story.githubIssueNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {story.githubIssueNumber && (
                      <a
                        href={`https://github.com/${story.githubRepoFullName}/issues/${story.githubIssueNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                {story.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {story.description}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {story.source}
                  </Badge>
                  {onStorySelect && (
                    <Button
                      variant={selectedStoryId === story.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onStorySelect(story)}
                      disabled={selectedStoryId === story.id}
                    >
                      {selectedStoryId === story.id ? 'Selected' : 'Select'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

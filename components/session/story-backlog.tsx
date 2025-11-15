'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, List, CheckCircle2 } from 'lucide-react';
import { IStory } from '@/types';
import { ManualStoryForm } from './manual-story-form';

interface StoryBacklogProps {
  stories: IStory[];
  currentStoryId?: string;
  isHost: boolean;
  onStorySelect: (story: IStory) => void;
  onStoryCreate: (story: IStory) => void;
}

export function StoryBacklog({
  stories,
  currentStoryId,
  isHost,
  onStorySelect,
  onStoryCreate,
}: StoryBacklogProps) {
  const [filter, setFilter] = useState<'all' | 'github' | 'manual'>('all');

  const filteredStories = stories.filter((story) => {
    if (filter === 'all') return true;
    return story.source === filter;
  });

  const githubCount = stories.filter((s) => s.source === 'github').length;
  const manualCount = stories.filter((s) => s.source === 'manual').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <List className="h-4 w-4" />
            Story Backlog ({stories.length})
          </CardTitle>
          {isHost && <ManualStoryForm onStoryCreate={onStoryCreate} />}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({stories.length})</TabsTrigger>
            <TabsTrigger value="github">GitHub ({githubCount})</TabsTrigger>
            <TabsTrigger value="manual">Manual ({manualCount})</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="mt-4">
            {filteredStories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {filter === 'all'
                    ? 'No stories in backlog.'
                    : `No ${filter} stories.`}
                </p>
                {isHost && filter === 'all' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Import stories from GitHub or create manual stories to get started.
                  </p>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredStories.map((story) => {
                    const isSelected = currentStoryId === story.id;
                    
                    return (
                      <div
                        key={story.id}
                        className={`p-3 border rounded-md space-y-2 transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium leading-tight">
                                {story.title}
                              </h4>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </div>
                            {story.githubRepoFullName && story.githubIssueNumber && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {story.githubRepoFullName} #{story.githubIssueNumber}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {story.source === 'github' && story.githubIssueNumber && (
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
                          {isHost && (
                            <Button
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => onStorySelect(story)}
                              disabled={isSelected}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

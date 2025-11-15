'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { IIssue, IRepository } from '@/types';

interface StoryPreviewProps {
  issues: IIssue[];
  repository: IRepository | null;
}

export function StoryPreview({ issues, repository }: StoryPreviewProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview Selected Stories</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.number}
                className="p-3 border rounded-md space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium leading-tight">
                      {issue.title}
                    </h4>
                    {repository && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {repository.fullName} #{issue.number}
                      </p>
                    )}
                  </div>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {issue.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {issue.body}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {issue.state}
                  </Badge>
                  {issue.labels.slice(0, 2).map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                  {issue.labels.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{issue.labels.length - 2}
                    </span>
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

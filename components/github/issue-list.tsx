'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { IRepository, IIssue } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface IssueListProps {
  repository: IRepository;
  projectId?: string;
  selectedIssues: IIssue[];
  onIssueSelect: (issues: IIssue[]) => void;
}

export function IssueList({
  repository,
  projectId,
  selectedIssues,
  onIssueSelect,
}: IssueListProps) {
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();

  const perPage = 20;

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, projectId, page]);

  const fetchIssues = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        owner: repository.owner,
        repo: repository.name,
        page: page.toString(),
        perPage: perPage.toString(),
      });

      if (projectId) {
        params.append('projectId', projectId);
      }

      const response = await fetch(`/api/github/issues?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch issues');
      }

      const data = await response.json();
      setIssues(data.issues || []);
      setHasMore(data.hasMore || false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load issues';
      setError(errorMessage);
      toast({
        title: 'GitHub API Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchIssues();
  };

  const handleIssueToggle = (issue: IIssue, checked: boolean) => {
    if (checked) {
      onIssueSelect([...selectedIssues, issue]);
    } else {
      onIssueSelect(selectedIssues.filter((i) => i.number !== issue.number));
    }
  };

  const handleSelectAll = () => {
    const allIssueNumbers = new Set(selectedIssues.map((i) => i.number));
    const newIssues = issues.filter((issue) => !allIssueNumbers.has(issue.number));
    onIssueSelect([...selectedIssues, ...newIssues]);
  };

  const handleDeselectAll = () => {
    const currentIssueNumbers = new Set(issues.map((i) => i.number));
    onIssueSelect(selectedIssues.filter((issue) => !currentIssueNumbers.has(issue.number)));
  };

  const isIssueSelected = (issue: IIssue) => {
    return selectedIssues.some((i) => i.number === issue.number);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Issues</h3>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Issues</h3>
        <div className="flex items-center gap-2 p-3 border border-destructive rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button
            onClick={handleRetry}
            className="text-sm text-destructive underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Issues</h3>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No issues found in this repository.
          </p>
        </div>
      </div>
    );
  }

  const allCurrentSelected = issues.every((issue) => isIssueSelected(issue));
  const someCurrentSelected = issues.some((issue) => isIssueSelected(issue));

  return (
    <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Issues ({issues.length})</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={allCurrentSelected ? handleDeselectAll : handleSelectAll}
        >
          {allCurrentSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <ScrollArea className="flex-1 border rounded-md">
        <div className="p-2 space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.number}
              className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={isIssueSelected(issue)}
                onCheckedChange={(checked: boolean) =>
                  handleIssueToggle(issue, checked)
                }
                className="mt-1"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start gap-2">
                  <h4 className="text-sm font-medium leading-tight flex-1">
                    #{issue.number} {issue.title}
                  </h4>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    onClick={(e) => e.stopPropagation()}
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
                  {issue.labels.slice(0, 3).map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                  {issue.labels.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{issue.labels.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

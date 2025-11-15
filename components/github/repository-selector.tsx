'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search } from 'lucide-react';
import { IRepository } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface RepositorySelectorProps {
  selectedRepo: IRepository | null;
  onRepoSelect: (repo: IRepository | null) => void;
}

export function RepositorySelector({
  selectedRepo,
  onRepoSelect,
}: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<IRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/repositories');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch repositories');
      }

      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load repositories';
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

  const filteredRepositories = useMemo(() => {
    if (!searchQuery) return repositories;
    
    const query = searchQuery.toLowerCase();
    return repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.fullName.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query)
    );
  }, [repositories, searchQuery]);

  const handleRetry = () => {
    fetchRepositories();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Select Repository</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Select Repository</Label>
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

  if (repositories.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Select Repository</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No repositories found. Make sure you have access to GitHub repositories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="repository">Select Repository</Label>
      
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={selectedRepo?.fullName || ''}
        onValueChange={(value) => {
          const repo = repositories.find((r) => r.fullName === value);
          onRepoSelect(repo || null);
        }}
      >
        <SelectTrigger id="repository">
          <SelectValue placeholder="Choose a repository" />
        </SelectTrigger>
        <SelectContent>
          {filteredRepositories.map((repo) => (
            <SelectItem key={repo.id} value={repo.fullName}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{repo.fullName}</span>
                {repo.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {repo.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filteredRepositories.length === 0 && searchQuery && (
        <p className="text-sm text-muted-foreground">
          No repositories match your search.
        </p>
      )}
    </div>
  );
}

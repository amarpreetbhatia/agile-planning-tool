'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { IGitHubProject } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ProjectSelectorProps {
  owner: string;
  selectedProject: IGitHubProject | null;
  onProjectSelect: (project: IGitHubProject | null) => void;
}

export function ProjectSelector({
  owner,
  selectedProject,
  onProjectSelect,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<IGitHubProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (owner) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ owner });
      const response = await fetch(`/api/github/projects?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load GitHub projects';
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
    fetchProjects();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Select GitHub Project (Optional)</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Select GitHub Project (Optional)</Label>
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

  if (projects.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Select GitHub Project (Optional)</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No GitHub Projects found for this owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="project">Select GitHub Project (Optional)</Label>
      <Select
        value={selectedProject?.id || ''}
        onValueChange={(value) => {
          const project = projects.find((p) => p.id === value);
          onProjectSelect(project || null);
        }}
      >
        <SelectTrigger id="project">
          <SelectValue placeholder="Choose a project (optional)" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{project.title}</span>
                <span className="text-xs text-muted-foreground">
                  #{project.number}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

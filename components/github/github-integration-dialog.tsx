'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, AlertCircle } from 'lucide-react';
import { RepositorySelector } from './repository-selector';
import { IssueList } from './issue-list';
import { ProjectSelector } from './project-selector';
import { StoryPreview } from './story-preview';
import { IRepository, IIssue, IGitHubProject } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface GitHubIntegrationDialogProps {
  sessionId: string;
  isHost: boolean;
  onStoryImport?: (story: any) => void;
}

export function GitHubIntegrationDialog({
  sessionId,
  isHost,
  onStoryImport,
}: GitHubIntegrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<IRepository | null>(null);
  const [selectedProject, setSelectedProject] = useState<IGitHubProject | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<IIssue[]>([]);
  const [importMode, setImportMode] = useState<'issues' | 'project'>('issues');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImportStories = async () => {
    if (!selectedRepo || selectedIssues.length === 0) {
      toast({
        title: 'No stories selected',
        description: 'Please select at least one issue to import.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/github/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: {
            owner: selectedRepo.owner,
            name: selectedRepo.name,
            fullName: selectedRepo.fullName,
          },
          issues: selectedIssues.map((issue) => ({
            number: issue.number,
            title: issue.title,
            body: issue.body,
            url: issue.url,
          })),
          projectNumber: selectedProject?.number,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import stories');
      }

      const data = await response.json();
      
      toast({
        title: 'Stories imported!',
        description: `Successfully imported ${selectedIssues.length} ${
          selectedIssues.length === 1 ? 'story' : 'stories'
        }.`,
      });

      if (onStoryImport) {
        onStoryImport(data);
      }

      // Reset state and close dialog
      setSelectedIssues([]);
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import stories from GitHub.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isHost) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GitBranch className="h-4 w-4" />
          Import from GitHub
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Stories from GitHub</DialogTitle>
          <DialogDescription>
            Connect to your GitHub repository to import issues as stories for estimation.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={importMode}
          onValueChange={(value) => setImportMode(value as 'issues' | 'project')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="issues">Repository Issues</TabsTrigger>
            <TabsTrigger value="project">GitHub Project</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="flex-1 overflow-hidden flex flex-col space-y-4">
            <RepositorySelector
              selectedRepo={selectedRepo}
              onRepoSelect={setSelectedRepo}
            />

            {selectedRepo && (
              <IssueList
                repository={selectedRepo}
                selectedIssues={selectedIssues}
                onIssueSelect={setSelectedIssues}
              />
            )}
          </TabsContent>

          <TabsContent value="project" className="flex-1 overflow-hidden flex flex-col space-y-4">
            <RepositorySelector
              selectedRepo={selectedRepo}
              onRepoSelect={setSelectedRepo}
            />

            {selectedRepo && (
              <>
                <ProjectSelector
                  owner={selectedRepo.owner}
                  selectedProject={selectedProject}
                  onProjectSelect={setSelectedProject}
                />

                {selectedProject && (
                  <IssueList
                    repository={selectedRepo}
                    projectId={selectedProject.id}
                    selectedIssues={selectedIssues}
                    onIssueSelect={setSelectedIssues}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {selectedIssues.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <StoryPreview issues={selectedIssues} repository={selectedRepo} />
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {selectedIssues.length} {selectedIssues.length === 1 ? 'story' : 'stories'} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIssues([])}
                  disabled={isImporting}
                >
                  Clear Selection
                </Button>
                <Button onClick={handleImportStories} disabled={isImporting}>
                  {isImporting ? 'Importing...' : 'Import Stories'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

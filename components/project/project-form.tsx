'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { IProjectSettings } from '@/types';

interface ProjectFormProps {
  initialData?: {
    name: string;
    description: string;
    settings: IProjectSettings;
  };
  projectId?: string;
  mode: 'create' | 'edit';
}

export default function ProjectForm({ initialData, projectId, mode }: ProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    settings: {
      defaultCardValues: initialData?.settings.defaultCardValues || 'fibonacci',
      customCardValues: initialData?.settings.customCardValues || [],
      defaultVotingMode: initialData?.settings.defaultVotingMode || 'anonymous',
      githubIntegration: {
        defaultRepo: initialData?.settings.githubIntegration?.defaultRepo || '',
        defaultProject: initialData?.settings.githubIntegration?.defaultProject || undefined,
      },
    },
  });

  const [customValues, setCustomValues] = useState(
    initialData?.settings.customCardValues?.join(', ') || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Parse custom card values if selected
    let parsedCustomValues: number[] | undefined;
    if (formData.settings.defaultCardValues === 'custom' && customValues.trim()) {
      parsedCustomValues = customValues
        .split(',')
        .map((v) => parseInt(v.trim()))
        .filter((v) => !isNaN(v));

      if (parsedCustomValues.length === 0) {
        toast({
          title: 'Error',
          description: 'Please provide valid custom card values',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const url = mode === 'create' ? '/api/projects' : `/api/projects/${projectId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          settings: {
            ...formData.settings,
            customCardValues: parsedCustomValues,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Failed to ${mode} project`);
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Project ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      // Redirect to the project page
      router.push(`/projects/${data.data.projectId}`);
    } catch (error) {
      console.error(`Error ${mode}ing project:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} project`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Create a new project to organize your planning sessions'
              : 'Update your project information'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="My Awesome Project"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your project and its goals..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              disabled={isLoading}
              required
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning Settings</CardTitle>
          <CardDescription>
            Configure default settings for estimation sessions in this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardValues">Default Card Values</Label>
            <Select
              value={formData.settings.defaultCardValues}
              onValueChange={(value: 'fibonacci' | 'tshirt' | 'custom') =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, defaultCardValues: value },
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="cardValues">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13, 21)</SelectItem>
                <SelectItem value="tshirt">T-Shirt Sizes (XS, S, M, L, XL, XXL)</SelectItem>
                <SelectItem value="custom">Custom Values</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.settings.defaultCardValues === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customValues">Custom Card Values</Label>
              <Input
                id="customValues"
                type="text"
                placeholder="1, 2, 4, 8, 16"
                value={customValues}
                onChange={(e) => setCustomValues(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter comma-separated numbers (e.g., 1, 2, 4, 8, 16)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="votingMode">Default Voting Mode</Label>
            <Select
              value={formData.settings.defaultVotingMode}
              onValueChange={(value: 'anonymous' | 'open') =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, defaultVotingMode: value },
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="votingMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anonymous">Anonymous (votes hidden until reveal)</SelectItem>
                <SelectItem value="open">Open (votes visible as cast)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration (Optional)</CardTitle>
          <CardDescription>
            Set default GitHub repository for importing stories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultRepo">Default Repository</Label>
            <Input
              id="defaultRepo"
              type="text"
              placeholder="owner/repository"
              value={formData.settings.githubIntegration?.defaultRepo || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    githubIntegration: {
                      ...formData.settings.githubIntegration,
                      defaultRepo: e.target.value,
                    },
                  },
                })
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Format: owner/repository (e.g., facebook/react)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultProject">Default Project Number</Label>
            <Input
              id="defaultProject"
              type="number"
              placeholder="1"
              value={formData.settings.githubIntegration?.defaultProject || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    githubIntegration: {
                      ...formData.settings.githubIntegration,
                      defaultProject: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  },
                })
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              GitHub Project number (optional)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Project' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

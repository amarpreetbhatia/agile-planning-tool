'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ExternalLink, 
  List, 
  CheckCircle2, 
  GripVertical, 
  Search,
  Filter,
  X
} from 'lucide-react';
import { IStory } from '@/types';
import { ManualStoryForm } from './manual-story-form';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StoryBacklogProps {
  sessionId: string;
  stories: IStory[];
  currentStoryId?: string;
  isHost: boolean;
  onStorySelect: (story: IStory) => void;
  onStoryCreate: (story: IStory) => void;
  onStoriesUpdate: (stories: IStory[]) => void;
}

interface SortableStoryItemProps {
  story: IStory;
  isSelected: boolean;
  isHost: boolean;
  onSelect: (story: IStory) => void;
  onStatusChange: (storyId: string, status: string) => void;
}

function SortableStoryItem({
  story,
  isSelected,
  isHost,
  onSelect,
  onStatusChange,
}: SortableStoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'not-ready':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'estimated':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded-md space-y-2 transition-colors ${
        isSelected
          ? 'bg-primary/10 border-primary'
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-2">
        {isHost && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
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

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {story.source}
              </Badge>
              {story.status && (
                <Badge className={`text-xs ${getStatusColor(story.status)}`}>
                  {story.status}
                </Badge>
              )}
              {story.labels && story.labels.length > 0 && (
                <>
                  {story.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </>
              )}
              {story.assignee && (
                <Badge variant="outline" className="text-xs">
                  @{story.assignee}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isHost && (
                <>
                  <Select
                    value={story.status || 'ready'}
                    onValueChange={(value) => onStatusChange(story.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="not-ready">Not Ready</SelectItem>
                      <SelectItem value="estimated">Estimated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSelect(story)}
                    disabled={isSelected}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoryBacklog({
  sessionId,
  stories: initialStories,
  currentStoryId,
  isHost,
  onStorySelect,
  onStoryCreate,
  onStoriesUpdate,
}: StoryBacklogProps) {
  const { toast } = useToast();
  const [stories, setStories] = useState<IStory[]>(initialStories);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'github' | 'manual'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local stories when prop changes
  useEffect(() => {
    setStories(initialStories);
  }, [initialStories]);

  // Sort stories by order
  const sortedStories = [...stories].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter stories
  const filteredStories = sortedStories.filter((story) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = story.title.toLowerCase().includes(query);
      const matchesDescription = story.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && story.status !== statusFilter) {
      return false;
    }

    // Source filter
    if (sourceFilter !== 'all' && story.source !== sourceFilter) {
      return false;
    }

    return true;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedStories.findIndex((s) => s.id === active.id);
    const newIndex = sortedStories.findIndex((s) => s.id === over.id);

    const reorderedStories = arrayMove(sortedStories, oldIndex, newIndex);

    // Update order values
    const updatedStories = reorderedStories.map((story, index) => ({
      ...story,
      order: index,
    }));

    setStories(updatedStories);
    onStoriesUpdate(updatedStories);

    // Send to server
    try {
      const response = await fetch(`/api/sessions/${sessionId}/stories/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyOrders: updatedStories.map((s) => ({ id: s.id, order: s.order })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update story order');
      }

      toast({
        title: 'Stories Reordered',
        description: 'Story order has been updated.',
      });
    } catch (error) {
      console.error('Error updating story order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update story order',
        variant: 'destructive',
      });
      // Revert on error
      setStories(initialStories);
    }
  };

  const handleStatusChange = async (storyId: string, status: string) => {
    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/stories/${storyId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update story status');
      }

      const updatedStories = stories.map((s) =>
        s.id === storyId ? { ...s, status: status as any } : s
      );
      setStories(updatedStories);
      onStoriesUpdate(updatedStories);

      toast({
        title: 'Status Updated',
        description: `Story marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating story status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update story status',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || sourceFilter !== 'all';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <List className="h-4 w-4" />
            Story Backlog ({filteredStories.length}/{stories.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            {isHost && <ManualStoryForm onStoryCreate={onStoryCreate} />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="space-y-3 mb-4 p-3 border rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="not-ready">Not Ready</SelectItem>
                  <SelectItem value="estimated">Estimated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as any)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {filteredStories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'No stories match your filters.'
                : 'No stories in backlog.'}
            </p>
            {isHost && !hasActiveFilters && (
              <p className="text-xs text-muted-foreground mt-2">
                Import stories from GitHub or create manual stories to get started.
              </p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredStories.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filteredStories.map((story) => (
                    <SortableStoryItem
                      key={story.id}
                      story={story}
                      isSelected={currentStoryId === story.id}
                      isHost={isHost}
                      onSelect={onStorySelect}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

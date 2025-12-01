'use client';

import { Button } from '@/components/ui/button';
import { Save, Download, Trash2, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WhiteboardToolbarProps {
  sessionId: string;
  currentStoryId?: string;
  onSaveSnapshot: (title?: string, storyId?: string) => Promise<void>;
  onClear?: () => void;
  onExport?: () => void;
  disabled?: boolean;
}

export function WhiteboardToolbar({
  sessionId,
  currentStoryId,
  onSaveSnapshot,
  onClear,
  onExport,
  disabled = false,
}: WhiteboardToolbarProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [attachToStory, setAttachToStory] = useState(false);

  const handleSaveClick = () => {
    setSnapshotTitle('');
    setAttachToStory(!!currentStoryId);
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async () => {
    setIsSaving(true);
    try {
      const storyId = attachToStory ? currentStoryId : undefined;
      await onSaveSnapshot(snapshotTitle || undefined, storyId);
      
      toast({
        title: 'Snapshot saved',
        description: attachToStory 
          ? 'Whiteboard snapshot saved and attached to current story'
          : 'Whiteboard snapshot saved successfully',
      });
      
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving snapshot:', error);
      toast({
        title: 'Error',
        description: 'Failed to save whiteboard snapshot',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (onClear) {
      if (confirm('Are you sure you want to clear the whiteboard? This cannot be undone.')) {
        onClear();
        toast({
          title: 'Whiteboard cleared',
          description: 'All drawings have been removed',
        });
      }
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      toast({
        title: 'Exporting',
        description: 'Preparing whiteboard export...',
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-background border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveClick}
          disabled={disabled || isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Snapshot
        </Button>

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={disabled}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}

        {onClear && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Whiteboard Snapshot</DialogTitle>
            <DialogDescription>
              Save the current whiteboard state as a snapshot. You can optionally attach it to the current story.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="snapshot-title">Title (optional)</Label>
              <Input
                id="snapshot-title"
                placeholder="Enter a title for this snapshot"
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
              />
            </div>

            {currentStoryId && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="attach-to-story"
                  checked={attachToStory}
                  onChange={(e) => setAttachToStory(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="attach-to-story" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Attach to current story
                  </div>
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Snapshot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

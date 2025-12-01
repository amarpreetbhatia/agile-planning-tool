'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Trash2, Link as LinkIcon, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WhiteboardCanvas } from './whiteboard-canvas';
import { TLStoreSnapshot } from 'tldraw';

interface Snapshot {
  _id: string;
  sessionId: string;
  storyId?: string;
  createdBy: string;
  data: TLStoreSnapshot;
  imageUrl?: string;
  title?: string;
  createdAt: string;
}

interface SnapshotGalleryProps {
  sessionId: string;
  currentUserId: string;
  isHost: boolean;
  onAttachToStory?: (snapshotId: string, storyId: string) => void;
}

export function SnapshotGallery({
  sessionId,
  currentUserId,
  isHost,
  onAttachToStory,
}: SnapshotGalleryProps) {
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Fetch snapshots
  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/whiteboard/snapshots`);
      const result = await response.json();

      if (result.success) {
        setSnapshots(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch snapshots');
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load whiteboard snapshots',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleView = (snapshot: Snapshot) => {
    setSelectedSnapshot(snapshot);
    setShowViewDialog(true);
  };

  const handleDelete = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to delete this snapshot?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/whiteboard/snapshots/${snapshotId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (result.success) {
        setSnapshots(snapshots.filter((s) => s._id !== snapshotId));
        toast({
          title: 'Snapshot deleted',
          description: 'Whiteboard snapshot has been removed',
        });
      } else {
        throw new Error(result.error?.message || 'Failed to delete snapshot');
      }
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete snapshot',
        variant: 'destructive',
      });
    }
  };

  const handleAttach = async (snapshotId: string) => {
    // This would typically open a dialog to select a story
    // For now, we'll just show a toast
    toast({
      title: 'Attach to story',
      description: 'This feature allows attaching snapshots to stories',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading snapshots...</div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-2">No snapshots yet</p>
        <p className="text-sm text-muted-foreground">
          Save whiteboard snapshots to view them here
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {snapshots.map((snapshot) => (
            <Card key={snapshot._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-1">
                      {snapshot.title || 'Untitled Snapshot'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(snapshot.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  {snapshot.storyId && (
                    <Badge variant="secondary" className="ml-2">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Story
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(snapshot)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {(snapshot.createdBy === currentUserId || isHost) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(snapshot._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedSnapshot?.title || 'Untitled Snapshot'}
            </DialogTitle>
            <DialogDescription>
              Created on {selectedSnapshot && new Date(selectedSnapshot.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full">
            {selectedSnapshot && (
              <WhiteboardCanvas
                sessionId={sessionId}
                initialData={selectedSnapshot.data}
                readOnly={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

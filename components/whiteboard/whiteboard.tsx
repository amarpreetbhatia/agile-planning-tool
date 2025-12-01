'use client';

import { useRef, useState } from 'react';
import { WhiteboardCanvas } from './whiteboard-canvas';
import { WhiteboardToolbar } from './whiteboard-toolbar';
import { SnapshotGallery } from './snapshot-gallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Editor, TLStoreSnapshot } from 'tldraw';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/use-socket';

interface WhiteboardProps {
  sessionId: string;
  currentUserId: string;
  isHost: boolean;
  currentStoryId?: string;
}

export function Whiteboard({
  sessionId,
  currentUserId,
  isHost,
  currentStoryId,
}: WhiteboardProps) {
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();
  const editorRef = useRef<Editor | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'gallery'>('canvas');

  const handleSaveSnapshot = async (title?: string, storyId?: string) => {
    // Get the current whiteboard state
    const canvas = document.querySelector('[data-whiteboard-canvas]') as any;
    if (!canvas || !canvas.exportSnapshot) {
      throw new Error('Whiteboard not ready');
    }

    const snapshot = await canvas.exportSnapshot();
    if (!snapshot) {
      throw new Error('Failed to export whiteboard state');
    }

    // Save to database
    const response = await fetch(`/api/sessions/${sessionId}/whiteboard/snapshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: snapshot,
        title: title || `Snapshot ${new Date().toLocaleString()}`,
        storyId: storyId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to save snapshot');
    }

    // Broadcast snapshot creation
    if (socket && isConnected) {
      socket.emit('whiteboard:snapshot', sessionId, result.data._id);
    }

    return result.data;
  };

  const handleClear = () => {
    // This would clear the whiteboard
    // The actual implementation depends on how we expose the editor
    if (editorRef.current) {
      editorRef.current.selectAll();
      editorRef.current.deleteShapes(editorRef.current.getSelectedShapeIds());
    }
  };

  const handleExport = async () => {
    // Export functionality - to be implemented based on tldraw API
    toast({
      title: 'Export',
      description: 'Export functionality will download the whiteboard as an image',
    });
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="w-full justify-start rounded-none h-auto p-0">
            <TabsTrigger value="canvas" className="rounded-none">
              Canvas
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-none">
              Snapshots
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="canvas" className="flex-1 flex flex-col m-0 p-0">
          <WhiteboardToolbar
            sessionId={sessionId}
            currentStoryId={currentStoryId}
            onSaveSnapshot={handleSaveSnapshot}
            onClear={handleClear}
            onExport={handleExport}
            disabled={!isConnected}
          />
          <div className="flex-1 relative" data-whiteboard-canvas>
            <WhiteboardCanvas
              sessionId={sessionId}
              onSnapshot={(data) => {
                // Store reference for export
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="flex-1 m-0 p-0">
          <SnapshotGallery
            sessionId={sessionId}
            currentUserId={currentUserId}
            isHost={isHost}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

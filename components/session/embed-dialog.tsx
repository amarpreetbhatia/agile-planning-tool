'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseEmbedUrl } from '@/lib/embed-parser';
import { Loader2, ExternalLink, FileText, Table, Presentation, Figma } from 'lucide-react';

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEmbed: (url: string, title: string) => Promise<void>;
}

export function EmbedDialog({ open, onOpenChange, onAddEmbed }: EmbedDialogProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<{
    type: string;
    title: string;
    isValid: boolean;
  } | null>(null);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError('');
    
    if (value.trim()) {
      const parsed = parseEmbedUrl(value);
      if (parsed.isValid) {
        setPreviewInfo({
          type: parsed.type,
          title: parsed.title,
          isValid: true,
        });
        if (!title) {
          setTitle(parsed.title);
        }
      } else {
        setPreviewInfo(null);
        setError(parsed.error || 'Invalid URL');
      }
    } else {
      setPreviewInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    const parsed = parseEmbedUrl(url);
    if (!parsed.isValid) {
      setError(parsed.error || 'Invalid URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onAddEmbed(url, title || parsed.title);
      // Reset form
      setUrl('');
      setTitle('');
      setPreviewInfo(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add embed');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmbedIcon = (type: string) => {
    switch (type) {
      case 'miro':
        return <Presentation className="h-5 w-5" />;
      case 'figma':
        return <Figma className="h-5 w-5" />;
      case 'google-docs':
        return <FileText className="h-5 w-5" />;
      case 'google-sheets':
        return <Table className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Embed External Tool</DialogTitle>
          <DialogDescription>
            Add a Miro board, Figma design, Google Doc, or Google Sheet to your session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://miro.com/app/board/..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Supported: Miro, Figma, Google Docs, Google Sheets
              </p>
            </div>

            {previewInfo && previewInfo.isValid && (
              <Alert>
                <div className="flex items-center gap-2">
                  {getEmbedIcon(previewInfo.type)}
                  <AlertDescription>
                    <span className="font-medium capitalize">{previewInfo.type.replace('-', ' ')}</span> detected
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Enter a custom title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !url.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Embed
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

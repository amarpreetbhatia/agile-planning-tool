'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plus } from 'lucide-react';
import { EmbedDialog } from './embed-dialog';
import { EmbedPanel } from './embed-panel';
import { useEmbeds } from '@/hooks/use-embeds';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface EmbedManagerProps {
  sessionId: string;
  isHost: boolean;
}

export function EmbedManager({ sessionId, isHost }: EmbedManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openEmbeds, setOpenEmbeds] = useState<Set<string>>(new Set());
  const { embeds, addEmbed, removeEmbed, updateEmbedState } = useEmbeds({
    sessionId,
    enabled: true,
  });

  const handleAddEmbed = async (url: string, title: string) => {
    await addEmbed(url, title);
  };

  const handleOpenEmbed = (embedId: string) => {
    setOpenEmbeds((prev) => new Set(prev).add(embedId));
  };

  const handleCloseEmbed = async (embedId: string) => {
    setOpenEmbeds((prev) => {
      const next = new Set(prev);
      next.delete(embedId);
      return next;
    });
  };

  const handleRemoveEmbed = async (embedId: string) => {
    await removeEmbed(embedId);
    handleCloseEmbed(embedId);
  };

  const openEmbedsArray = embeds.filter((e) => openEmbeds.has(e.id));

  return (
    <>
      {/* Embed Controls */}
      <div className="flex items-center gap-2">
        {isHost && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Embed
          </Button>
        )}

        {embeds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Embeds
                {embeds.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {embeds.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {embeds.map((embed) => (
                <DropdownMenuItem
                  key={embed.id}
                  onClick={() => handleOpenEmbed(embed.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{embed.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {embed.type.replace('-', ' ')}
                    </span>
                  </div>
                  {openEmbeds.has(embed.id) && (
                    <Badge variant="secondary" className="ml-2">
                      Open
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Embed Dialog */}
      <EmbedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddEmbed={handleAddEmbed}
      />

      {/* Open Embed Panels */}
      {openEmbedsArray.map((embed) => (
        <EmbedPanel
          key={embed.id}
          embed={embed}
          onClose={() => {
            if (isHost) {
              handleRemoveEmbed(embed.id);
            } else {
              handleCloseEmbed(embed.id);
            }
          }}
          onUpdateState={(state) => updateEmbedState(embed.id, state)}
        />
      ))}
    </>
  );
}

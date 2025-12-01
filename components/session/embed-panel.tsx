'use client';

import { useState, useEffect, useRef } from 'react';
import { IExternalEmbed } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Minimize2, Maximize2, Move, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmbedPanelProps {
  embed: IExternalEmbed;
  onClose: () => void;
  onUpdateState: (state: IExternalEmbed['panelState']) => void;
}

export function EmbedPanel({ embed, onClose, onUpdateState }: EmbedPanelProps) {
  const [isMinimized, setIsMinimized] = useState(embed.panelState?.minimized || false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({
    x: embed.panelState?.x || 100,
    y: embed.panelState?.y || 100,
  });
  const [size, setSize] = useState({
    width: embed.panelState?.width || 800,
    height: embed.panelState?.height || 600,
  });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Save state when it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onUpdateState({
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        minimized: isMinimized,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [position, size, isMinimized, onUpdateState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        setSize({
          width: Math.max(400, resizeStart.width + deltaX),
          height: Math.max(300, resizeStart.height + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const openInNewTab = () => {
    window.open(embed.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-50 bg-background border rounded-lg shadow-2xl overflow-hidden',
        isDragging && 'cursor-move',
        isResizing && 'cursor-nwse-resize'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Panel Header */}
      <div className="panel-header flex items-center justify-between px-3 py-2 bg-muted border-b cursor-move">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Move className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">{embed.title}</span>
          <span className="text-xs text-muted-foreground capitalize flex-shrink-0">
            ({embed.type.replace('-', ' ')})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={openInNewTab}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleMinimize}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Panel Content */}
      {!isMinimized && (
        <>
          <div className="relative w-full h-full">
            <iframe
              src={embed.embedUrl}
              className="w-full h-full border-0"
              allow="fullscreen"
              title={embed.title}
            />
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground" />
          </div>
        </>
      )}
    </div>
  );
}

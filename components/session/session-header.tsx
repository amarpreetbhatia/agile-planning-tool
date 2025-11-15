'use client';

import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SessionHeaderProps {
  sessionName: string;
  sessionId: string;
  status: 'active' | 'archived';
  className?: string;
}

export function SessionHeader({
  sessionName,
  sessionId,
  status,
  className,
}: SessionHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={cn('flex flex-col gap-1 min-w-0', className)}>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight truncate">
            {sessionName}
          </h1>
          <Badge
            variant={status === 'active' ? 'default' : 'secondary'}
            className="shrink-0 text-xs"
          >
            {status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          ID: {sessionId}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">
            {sessionName}
          </h1>
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Session ID: {sessionId}
        </p>
      </div>
    </div>
  );
}

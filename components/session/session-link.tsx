'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SessionLinkProps {
  sessionId: string;
}

export function SessionLink({ sessionId }: SessionLinkProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const sessionUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/sessions/${sessionId}`
      : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Session link has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Share Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={sessionUrl}
            readOnly
            className="font-mono text-sm"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Share this link with your team members to invite them to the session.
        </p>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { IStoryComment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface StoryCommentsProps {
  sessionId: string;
  storyId: string;
  initialComments?: IStoryComment[];
  onCommentAdded?: (comment: IStoryComment) => void;
}

export function StoryComments({
  sessionId,
  storyId,
  initialComments = [],
  onCommentAdded,
}: StoryCommentsProps) {
  const [comments, setComments] = useState<IStoryComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [githubSyncError, setGithubSyncError] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Update comments when initialComments change
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setGithubSyncError(null);

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/stories/${storyId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: newComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to add comment');
      }

      // Add the new comment to the list
      const addedComment = data.data.comment;
      setComments((prev) => [...prev, addedComment]);
      setNewComment('');

      // Check for GitHub sync error
      if (data.data.githubSyncError) {
        setGithubSyncError(data.data.githubSyncError);
        toast({
          title: 'Comment added',
          description: 'Comment added but failed to sync to GitHub',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Comment added',
          description: 'Your comment has been posted',
        });
      }

      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(addedComment);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <h4 className="text-sm font-medium">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>
      </div>

      {/* Comments list */}
      {comments.length > 0 ? (
        <ScrollArea ref={scrollAreaRef} className="h-[200px] rounded-md border p-3">
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comment.avatarUrl} alt={comment.username} />
                    <AvatarFallback>
                      {comment.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                      {comment.syncedToGitHub && (
                        <Badge variant="secondary" className="text-xs h-5">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Synced
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {comment.comment}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      ) : (
        <div className="rounded-md border p-6 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}

      {/* GitHub sync error */}
      {githubSyncError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3"
        >
          <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-500">GitHub sync failed</p>
            <p className="text-xs text-muted-foreground mt-1">{githubSyncError}</p>
          </div>
        </motion.div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment... (Ctrl+Enter to submit)"
          className="min-h-[80px] resize-none"
          disabled={isSubmitting}
          maxLength={5000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/5000 characters
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

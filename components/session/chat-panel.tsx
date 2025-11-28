'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Loader2, MessageSquare, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { onChatMessage, onChatTyping, sendTypingIndicator } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  _id: string;
  sessionId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  message: string;
  type: 'text' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

interface ChatPanelProps {
  sessionId: string;
  currentUserId: string;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function ChatPanel({
  sessionId,
  currentUserId,
  isOpen = true,
  onClose,
  className = '',
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/sessions/${sessionId}/messages?limit=50`);
        const data = await response.json();

        if (data.success) {
          setMessages(
            data.data.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
              updatedAt: new Date(msg.updatedAt),
            }))
          );
        } else {
          throw new Error(data.error?.message || 'Failed to fetch messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat messages',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchMessages();
    }
  }, [sessionId, isOpen, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const unsubscribe = onChatMessage((message: any) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          createdAt: new Date(message.createdAt),
          updatedAt: new Date(message.updatedAt),
        },
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Subscribe to typing indicators
  useEffect(() => {
    const unsubscribe = onChatTyping((userId: string, username: string, isTyping: boolean) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (isTyping) {
          newMap.set(userId, username);
        } else {
          newMap.delete(userId);
        }
        return newMap;
      });

      // Clear typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        }, 3000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle typing indicator
  const handleInputChange = useCallback(
    (value: string) => {
      setInputMessage(value);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator
      if (value.length > 0) {
        sendTypingIndicator(sessionId, true);

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingIndicator(sessionId, false);
        }, 2000);
      } else {
        sendTypingIndicator(sessionId, false);
      }
    },
    [sessionId]
  );

  // Send message
  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    if (trimmedMessage.length > 2000) {
      toast({
        title: 'Message too long',
        description: 'Messages cannot exceed 2000 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSending(true);

      // Stop typing indicator
      sendTypingIndicator(sessionId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

      // Clear input
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return null;
  }

  const typingUsersArray = Array.from(typingUsers.values());

  return (
    <div className={`flex flex-col h-full bg-card border rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Chat</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.userId === currentUserId;
              const isSystemMessage = message.type === 'system';

              if (isSystemMessage) {
                return (
                  <div key={message._id} className="flex justify-center">
                    <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {message.message}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message._id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.avatarUrl} alt={message.username} />
                    <AvatarFallback>{message.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{message.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[85%] break-words ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Typing indicators */}
        {typingUsersArray.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground italic">
            {typingUsersArray.length === 1
              ? `${typingUsersArray[0]} is typing...`
              : typingUsersArray.length === 2
              ? `${typingUsersArray[0]} and ${typingUsersArray[1]} are typing...`
              : `${typingUsersArray.length} people are typing...`}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            maxLength={2000}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {inputMessage.length}/2000
        </div>
      </div>
    </div>
  );
}

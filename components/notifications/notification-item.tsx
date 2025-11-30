'use client';

import { INotification } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Check, UserPlus, Calendar, CalendarCheck, MessageSquare, CalendarClock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: INotification;
  onMarkAsRead: (notificationId: string) => void;
  onDismiss: (notificationId: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
}: NotificationItemProps) {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'project_invitation':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'session_created':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'session_starting':
        return <CalendarClock className="h-5 w-5 text-orange-500" />;
      case 'session_ended':
        return <CalendarCheck className="h-5 w-5 text-purple-500" />;
      case 'mention':
        return <MessageSquare className="h-5 w-5 text-pink-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification._id.toString());
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification._id.toString());
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification._id.toString());
  };

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50',
        !notification.read && 'bg-primary/5'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{notification.title}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons (shown on hover) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleMarkAsRead}
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDismiss}
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

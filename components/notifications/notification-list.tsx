'use client';

import { INotification } from '@/types';
import { NotificationItem } from './notification-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCheck, Inbox } from 'lucide-react';

interface NotificationListProps {
  notifications: INotification[];
  loading: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onDismiss: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
  onDismiss,
  onMarkAllAsRead,
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No notifications</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id.toString()}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

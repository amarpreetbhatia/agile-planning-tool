'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Bell } from 'lucide-react';
import { INotificationPreferences } from '@/types';

// Custom Switch component (simple toggle)
function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

export default function NotificationPreferencesClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<INotificationPreferences>({
    email: {
      sessionInvitations: true,
      sessionReminders: true,
      sessionSummaries: true,
      projectInvitations: true,
    },
    inApp: {
      sessionInvitations: true,
      sessionReminders: true,
      projectInvitations: true,
      mentions: true,
    },
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load notification preferences',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Notification preferences saved',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to save preferences',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function updateEmailPreference(key: keyof INotificationPreferences['email'], value: boolean) {
    setPreferences((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value,
      },
    }));
  }

  function updateInAppPreference(key: keyof INotificationPreferences['inApp'], value: boolean) {
    setPreferences((prev) => ({
      ...prev,
      inApp: {
        ...prev.inApp,
        [key]: value,
      },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive notifications via email about sessions and projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-session-invitations">Session Invitations</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you're invited to a planning session
              </p>
            </div>
            <Switch
              id="email-session-invitations"
              checked={preferences.email.sessionInvitations}
              onCheckedChange={(checked) => updateEmailPreference('sessionInvitations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-session-reminders">Session Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders 15 minutes before a session starts
              </p>
            </div>
            <Switch
              id="email-session-reminders"
              checked={preferences.email.sessionReminders}
              onCheckedChange={(checked) => updateEmailPreference('sessionReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-session-summaries">Session Summaries</Label>
              <p className="text-sm text-muted-foreground">
                Get a summary with estimates after a session ends
              </p>
            </div>
            <Switch
              id="email-session-summaries"
              checked={preferences.email.sessionSummaries}
              onCheckedChange={(checked) => updateEmailPreference('sessionSummaries', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-project-invitations">Project Invitations</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you're invited to join a project
              </p>
            </div>
            <Switch
              id="email-project-invitations"
              checked={preferences.email.projectInvitations}
              onCheckedChange={(checked) => updateEmailPreference('projectInvitations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive notifications within the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp-session-invitations">Session Invitations</Label>
              <p className="text-sm text-muted-foreground">
                Show in-app notifications for session invitations
              </p>
            </div>
            <Switch
              id="inapp-session-invitations"
              checked={preferences.inApp.sessionInvitations}
              onCheckedChange={(checked) => updateInAppPreference('sessionInvitations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp-session-reminders">Session Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Show in-app reminders before sessions start
              </p>
            </div>
            <Switch
              id="inapp-session-reminders"
              checked={preferences.inApp.sessionReminders}
              onCheckedChange={(checked) => updateInAppPreference('sessionReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp-project-invitations">Project Invitations</Label>
              <p className="text-sm text-muted-foreground">
                Show in-app notifications for project invitations
              </p>
            </div>
            <Switch
              id="inapp-project-invitations"
              checked={preferences.inApp.projectInvitations}
              onCheckedChange={(checked) => updateInAppPreference('projectInvitations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp-mentions">Mentions</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone mentions you in chat
              </p>
            </div>
            <Switch
              id="inapp-mentions"
              checked={preferences.inApp.mentions}
              onCheckedChange={(checked) => updateInAppPreference('mentions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

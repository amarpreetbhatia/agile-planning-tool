# Email Notification System

This document describes the email notification system implemented for the Agile Planning Tool.

## Overview

The email notification system sends automated emails to users for important events:
- **Session Created**: When a new planning session is created
- **Session Reminder**: 15 minutes before a scheduled session starts
- **Session Summary**: When a session ends, with estimates and statistics

## Email Service

We use [Resend](https://resend.com) as the email service provider. Resend offers:
- Modern, developer-friendly API
- Excellent TypeScript support
- Reliable delivery
- Good free tier for development

### Setup

1. Sign up for a Resend account at https://resend.com
2. Create an API key in the Resend dashboard
3. Add the API key to your `.env` file:

```bash
EMAIL_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Agile Planning Tool
ENABLE_EMAIL_NOTIFICATIONS=true
```

4. For production, verify your domain in Resend to send from your own domain

## Features

### 1. Session Created Notifications

When a session is created, all project members receive an email with:
- Session name and details
- Number of stories to estimate
- Direct link to join the session
- Calendar invite (ICS file) if a scheduled time is provided

**Respects user preference**: `email.sessionInvitations`

### 2. Session Reminders

15 minutes before a scheduled session starts, participants receive a reminder with:
- Session name and start time
- Quick join link
- Countdown to session start

**Respects user preference**: `email.sessionReminders`

**Note**: Reminders are scheduled in-memory. For production, consider using a job queue like Bull or BullMQ.

### 3. Session Summary

When a session ends, participants receive a summary email with:
- Session statistics (total stories, estimated stories, total votes)
- Table of all estimates with final values
- CSV export attachment with detailed data
- Link to session history

**Respects user preference**: `email.sessionSummaries`

## User Preferences

Users can manage their notification preferences at `/notifications/preferences`.

### Email Preferences
- Session Invitations
- Session Reminders
- Session Summaries
- Project Invitations

### In-App Preferences
- Session Invitations
- Session Reminders
- Project Invitations
- Mentions

All preferences default to `true` (enabled).

## Email Queue

The system includes a simple in-memory email queue with retry logic:
- Automatically retries failed emails up to 3 times
- Exponential backoff between retries
- Logs failures after max retries

**For production**: Replace with a proper job queue system like:
- Bull / BullMQ (Redis-based)
- AWS SQS
- RabbitMQ

## Calendar Invites

Session created emails can include calendar invites (ICS files) when a scheduled time is provided. The invite includes:
- Session name and description
- Start time and duration (default 1 hour)
- Location (session URL)
- Organizer information

## Email Templates

All emails use responsive HTML templates with:
- Modern, clean design
- Mobile-friendly layout
- Consistent branding
- Dark mode support (via email client)
- Unsubscribe links

### Template Structure

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Inline styles for email compatibility */
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <!-- Gradient header with icon -->
      </div>
      <div class="content">
        <!-- Email content -->
      </div>
      <div class="footer">
        <!-- Unsubscribe link -->
      </div>
    </div>
  </body>
</html>
```

## API Endpoints

### Get Notification Preferences
```
GET /api/notifications/preferences
```

Returns the current user's notification preferences.

### Update Notification Preferences
```
PATCH /api/notifications/preferences
Body: { preferences: INotificationPreferences }
```

Updates the user's notification preferences.

### Schedule Session Reminder
```
POST /api/sessions/[sessionId]/schedule-reminder
Body: { scheduledTime: string }
```

Schedules a reminder for a session (host only).

### Cancel Session Reminder
```
DELETE /api/sessions/[sessionId]/schedule-reminder
```

Cancels a scheduled reminder (host only).

## Testing

### Test Email Configuration

You can test the email configuration by setting a `TEST_EMAIL` in your `.env` file and calling the test function:

```typescript
import { testEmailConfiguration } from '@/lib/email';

const success = await testEmailConfiguration();
console.log('Email test:', success ? 'passed' : 'failed');
```

### Development Mode

In development, you can use Resend's test mode or a service like [MailHog](https://github.com/mailhog/MailHog) to capture emails locally.

## Unsubscribe / Opt-out

All emails include an unsubscribe link that directs users to their notification preferences page where they can:
- Disable specific notification types
- Manage email vs in-app preferences
- Update preferences per project (future enhancement)

## CSV Export Format

Session summary emails include a CSV export with the following columns:
- Story
- Final Estimate
- Average
- Min
- Max
- Votes (semicolon-separated)
- Finalized At

## Error Handling

The email system includes comprehensive error handling:
- Failed emails are logged but don't block the main operation
- Retry logic for transient failures
- Graceful degradation if email service is unavailable
- User-friendly error messages

## Performance Considerations

- Emails are sent asynchronously (fire-and-forget)
- Session creation/ending doesn't wait for emails to send
- Queue processing runs in the background
- No impact on user-facing operations

## Security

- Email API key stored in environment variables
- User email addresses never exposed to other users
- Unsubscribe links include user ID for verification
- No sensitive data in email content
- All links use HTTPS in production

## Future Enhancements

1. **Job Queue**: Replace in-memory queue with Redis-based Bull/BullMQ
2. **Email Templates**: Use a template engine like Handlebars or React Email
3. **Scheduled Sessions**: Full calendar integration with recurring sessions
4. **Digest Emails**: Daily/weekly summaries of activity
5. **Rich Notifications**: Include charts and visualizations in emails
6. **Multi-language**: Support for internationalized email templates
7. **Email Analytics**: Track open rates and click-through rates
8. **Custom Branding**: Per-project email customization

## Troubleshooting

### Emails not sending

1. Check that `ENABLE_EMAIL_NOTIFICATIONS=true` in `.env`
2. Verify `EMAIL_API_KEY` is correct
3. Check Resend dashboard for delivery status
4. Review server logs for error messages

### Reminders not working

1. Ensure scheduled time is in the future
2. Check that reminder time (15 min before) is also in the future
3. Verify session hasn't been archived
4. Check server logs for scheduling errors

### Users not receiving emails

1. Check user's notification preferences
2. Verify user's email address is correct
3. Check spam/junk folders
4. Review Resend delivery logs

## Support

For issues with the email system:
1. Check server logs for detailed error messages
2. Review Resend dashboard for delivery status
3. Test with `testEmailConfiguration()` function
4. Verify environment variables are set correctly

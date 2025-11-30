import { Resend } from 'resend';
import { createEvent, EventAttributes } from 'ics';
import { ISession, IEstimate, IUser } from '@/types';

// Lazy initialize Resend client
let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.EMAIL_API_KEY) {
    resend = new Resend(process.env.EMAIL_API_KEY);
  }
  return resend;
}

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@agilepoker.app';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Agile Planning Tool';
const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
const APP_NAME = process.env.APP_NAME || 'Agile Planning Tool';

// Email queue for reliability (in-memory for now, can be replaced with Redis/Bull)
interface EmailJob {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
  retries: number;
}

const emailQueue: EmailJob[] = [];
let isProcessingQueue = false;

/**
 * Add email to queue for sending
 */
async function queueEmail(job: Omit<EmailJob, 'retries'>) {
  emailQueue.push({ ...job, retries: 0 });
  processEmailQueue();
}

/**
 * Process email queue with retry logic
 */
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (emailQueue.length > 0) {
    const job = emailQueue[0];

    try {
      const client = getResendClient();
      if (!client) {
        console.warn('Resend client not initialized - skipping email');
        emailQueue.shift();
        continue;
      }
      
      await client.emails.send({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
        to: job.to,
        subject: job.subject,
        html: job.html,
        attachments: job.attachments,
      });

      // Success - remove from queue
      emailQueue.shift();
    } catch (error) {
      console.error('Failed to send email:', error);

      // Retry logic
      if (job.retries < 3) {
        job.retries++;
        // Move to end of queue for retry
        emailQueue.push(emailQueue.shift()!);
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * job.retries));
      } else {
        // Max retries reached - remove from queue and log
        console.error('Max retries reached for email:', job);
        emailQueue.shift();
      }
    }
  }

  isProcessingQueue = false;
}

/**
 * Create calendar invite (ICS file) for session
 */
function createCalendarInvite(session: ISession, startTime: Date): string | null {
  try {
    const event: EventAttributes = {
      start: [
        startTime.getFullYear(),
        startTime.getMonth() + 1,
        startTime.getDate(),
        startTime.getHours(),
        startTime.getMinutes(),
      ],
      duration: { hours: 1 }, // Default 1 hour duration
      title: `Planning Poker: ${session.name}`,
      description: `Join the planning poker session: ${APP_URL}/sessions/${session.sessionId}`,
      location: `${APP_URL}/sessions/${session.sessionId}`,
      url: `${APP_URL}/sessions/${session.sessionId}`,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: APP_NAME, email: EMAIL_FROM },
    };

    const { error, value } = createEvent(event);

    if (error) {
      console.error('Failed to create calendar invite:', error);
      return null;
    }

    return value || null;
  } catch (error) {
    console.error('Error creating calendar invite:', error);
    return null;
  }
}

/**
 * Generate unsubscribe link
 */
function generateUnsubscribeLink(userId: string): string {
  return `${APP_URL}/notifications/preferences?userId=${userId}`;
}

/**
 * Send session created notification
 */
export async function sendSessionCreatedEmail(
  session: ISession,
  recipients: IUser[],
  scheduledTime?: Date
) {
  const sessionUrl = `${APP_URL}/sessions/${session.sessionId}`;
  const calendarInvite = scheduledTime ? createCalendarInvite(session, scheduledTime) : null;

  for (const recipient of recipients) {
    // Check notification preferences
    if (!recipient.notificationPreferences?.email?.sessionInvitations) {
      continue;
    }

    const unsubscribeLink = generateUnsubscribeLink(recipient._id.toString());

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background: #5568d3; }
            .details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .footer a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Planning Session</h1>
            </div>
            <div class="content">
              <p>Hi ${recipient.username},</p>
              <p>A new planning poker session has been created${scheduledTime ? ' and scheduled' : ''}:</p>
              
              <div class="details">
                <h3>${session.name}</h3>
                ${scheduledTime ? `<p><strong>Scheduled for:</strong> ${scheduledTime.toLocaleString()}</p>` : ''}
                <p><strong>Session ID:</strong> ${session.sessionId}</p>
                ${session.stories?.length ? `<p><strong>Stories to estimate:</strong> ${session.stories.length}</p>` : ''}
              </div>

              <p>Click the button below to join the session:</p>
              
              <a href="${sessionUrl}" class="button">Join Session</a>
              
              <p>Or copy this link: <a href="${sessionUrl}">${sessionUrl}</a></p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you're a member of this project.</p>
              <p><a href="${unsubscribeLink}">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const attachments = calendarInvite
      ? [
          {
            filename: 'invite.ics',
            content: calendarInvite,
          },
        ]
      : undefined;

    await queueEmail({
      to: recipient.email,
      subject: `New Planning Session: ${session.name}`,
      html,
      attachments,
    });
  }
}

/**
 * Send session reminder notification (15 minutes before)
 */
export async function sendSessionReminderEmail(
  session: ISession,
  recipients: IUser[],
  startTime: Date
) {
  const sessionUrl = `${APP_URL}/sessions/${session.sessionId}`;

  for (const recipient of recipients) {
    // Check notification preferences
    if (!recipient.notificationPreferences?.email?.sessionReminders) {
      continue;
    }

    const unsubscribeLink = generateUnsubscribeLink(recipient._id.toString());

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background: #d97706; }
            .reminder { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .footer a { color: #f59e0b; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Session Starting Soon</h1>
            </div>
            <div class="content">
              <p>Hi ${recipient.username},</p>
              
              <div class="reminder">
                <h3>Your planning session starts in 15 minutes!</h3>
                <p><strong>Session:</strong> ${session.name}</p>
                <p><strong>Time:</strong> ${startTime.toLocaleString()}</p>
              </div>

              <p>Click the button below to join now:</p>
              
              <a href="${sessionUrl}" class="button">Join Session Now</a>
              
              <p>Quick link: <a href="${sessionUrl}">${sessionUrl}</a></p>
            </div>
            <div class="footer">
              <p><a href="${unsubscribeLink}">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await queueEmail({
      to: recipient.email,
      subject: `Reminder: ${session.name} starts in 15 minutes`,
      html,
    });
  }
}

/**
 * Generate CSV export of estimates
 */
function generateEstimatesCSV(estimates: IEstimate[], session: ISession): string {
  const headers = ['Story', 'Final Estimate', 'Average', 'Min', 'Max', 'Votes', 'Finalized At'];
  const rows = estimates.map((estimate) => {
    const story = session.stories.find((s) => s.id === estimate.storyId);
    const votes = estimate.votes.map((v) => `${v.username}: ${v.value}`).join('; ');
    const values = estimate.votes.map((v) => v.value);
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 'N/A';
    const min = values.length > 0 ? Math.min(...values) : 'N/A';
    const max = values.length > 0 ? Math.max(...values) : 'N/A';

    return [
      story?.title || estimate.storyId,
      estimate.finalEstimate || 'Not finalized',
      avg,
      min,
      max,
      votes,
      estimate.finalizedAt ? new Date(estimate.finalizedAt).toLocaleString() : 'N/A',
    ];
  });

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

/**
 * Send session summary notification
 */
export async function sendSessionSummaryEmail(
  session: ISession,
  estimates: IEstimate[],
  recipients: IUser[]
) {
  const sessionUrl = `${APP_URL}/history/${session.sessionId}`;
  const csvExport = generateEstimatesCSV(estimates, session);

  // Calculate statistics
  const totalStories = estimates.length;
  const finalizedStories = estimates.filter((e) => e.finalEstimate).length;
  const totalVotes = estimates.reduce((sum, e) => sum + e.votes.length, 0);

  for (const recipient of recipients) {
    // Check notification preferences
    if (!recipient.notificationPreferences?.email?.sessionSummaries) {
      continue;
    }

    const unsubscribeLink = generateUnsubscribeLink(recipient._id.toString());

    // Generate estimate rows for email
    const estimateRows = estimates
      .map((estimate) => {
        const story = session.stories.find((s) => s.id === estimate.storyId);
        return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${story?.title || estimate.storyId}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #667eea;">${estimate.finalEstimate || 'Not finalized'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${estimate.votes.length}</td>
        </tr>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background: #059669; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; padding: 15px; background: #f0fdf4; border-radius: 6px; flex: 1; margin: 0 5px; }
            .stat-value { font-size: 32px; font-weight: bold; color: #10b981; }
            .stat-label { font-size: 14px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .footer a { color: #10b981; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Session Complete</h1>
            </div>
            <div class="content">
              <p>Hi ${recipient.username},</p>
              <p>The planning session <strong>${session.name}</strong> has ended. Here's a summary:</p>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${totalStories}</div>
                  <div class="stat-label">Stories</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${finalizedStories}</div>
                  <div class="stat-label">Estimated</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${totalVotes}</div>
                  <div class="stat-label">Total Votes</div>
                </div>
              </div>

              <h3>Estimates</h3>
              <table>
                <thead>
                  <tr>
                    <th>Story</th>
                    <th style="text-align: center;">Estimate</th>
                    <th style="text-align: center;">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  ${estimateRows}
                </tbody>
              </table>

              <p>View the full session history and export data:</p>
              
              <a href="${sessionUrl}" class="button">View Session History</a>
            </div>
            <div class="footer">
              <p>A CSV export is attached to this email.</p>
              <p><a href="${unsubscribeLink}">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await queueEmail({
      to: recipient.email,
      subject: `Session Summary: ${session.name}`,
      html,
      attachments: [
        {
          filename: `${session.name.replace(/[^a-z0-9]/gi, '_')}_estimates.csv`,
          content: csvExport,
        },
      ],
    });
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    // Test by sending to a test email if configured
    const testEmail = process.env.TEST_EMAIL;
    if (!testEmail) {
      console.warn('No TEST_EMAIL configured, skipping email test');
      return false;
    }

    const client = getResendClient();
    if (!client) {
      console.warn('Resend client not initialized');
      return false;
    }
    
    await client.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: testEmail,
      subject: 'Email Configuration Test',
      html: '<p>Email service is configured correctly!</p>',
    });

    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}

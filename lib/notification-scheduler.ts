/**
 * Notification Scheduler
 * 
 * This module handles scheduling of session reminder notifications.
 * In a production environment, this should be replaced with a proper
 * job queue system like Bull, BullMQ, or a cron service.
 * 
 * For now, this provides a simple in-memory scheduler for reminders.
 */

import { ISession, IUser } from '@/types';
import { sendSessionReminderEmail } from './email';
import User from '@/models/User';
import Session from '@/models/Session';
import dbConnect from './db';

interface ScheduledReminder {
  sessionId: string;
  scheduledTime: Date;
  reminderTime: Date;
  timeoutId?: NodeJS.Timeout;
}

// In-memory store of scheduled reminders
const scheduledReminders = new Map<string, ScheduledReminder>();

/**
 * Schedule a reminder for a session
 * Sends reminder 15 minutes before the scheduled start time
 */
export function scheduleSessionReminder(
  sessionId: string,
  scheduledTime: Date
): boolean {
  try {
    // Calculate reminder time (15 minutes before)
    const reminderTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000);
    const now = new Date();

    // Don't schedule if reminder time is in the past
    if (reminderTime <= now) {
      console.log(`Reminder time for session ${sessionId} is in the past, skipping`);
      return false;
    }

    // Cancel existing reminder if any
    cancelSessionReminder(sessionId);

    // Calculate delay in milliseconds
    const delay = reminderTime.getTime() - now.getTime();

    // Schedule the reminder
    const timeoutId = setTimeout(async () => {
      await sendScheduledReminder(sessionId);
      scheduledReminders.delete(sessionId);
    }, delay);

    // Store the scheduled reminder
    scheduledReminders.set(sessionId, {
      sessionId,
      scheduledTime,
      reminderTime,
      timeoutId,
    });

    console.log(
      `Scheduled reminder for session ${sessionId} at ${reminderTime.toISOString()}`
    );

    return true;
  } catch (error) {
    console.error('Error scheduling session reminder:', error);
    return false;
  }
}

/**
 * Cancel a scheduled reminder
 */
export function cancelSessionReminder(sessionId: string): boolean {
  const reminder = scheduledReminders.get(sessionId);

  if (reminder && reminder.timeoutId) {
    clearTimeout(reminder.timeoutId);
    scheduledReminders.delete(sessionId);
    console.log(`Cancelled reminder for session ${sessionId}`);
    return true;
  }

  return false;
}

/**
 * Send the scheduled reminder
 */
async function sendScheduledReminder(sessionId: string): Promise<void> {
  try {
    await dbConnect();

    // Fetch session
    const session = await Session.findOne({ sessionId });

    if (!session) {
      console.error(`Session ${sessionId} not found for reminder`);
      return;
    }

    // Don't send reminder if session is already archived
    if (session.status === 'archived') {
      console.log(`Session ${sessionId} is archived, skipping reminder`);
      return;
    }

    // Get all participants
    const participantIds = session.participants.map((p) => p.userId);
    const participants = await User.find({
      _id: { $in: participantIds },
    });

    // Get the scheduled time from the reminder
    const reminder = scheduledReminders.get(sessionId);
    const scheduledTime = reminder?.scheduledTime || new Date();

    // Send reminder emails
    await sendSessionReminderEmail(session, participants, scheduledTime);

    console.log(`Sent reminder for session ${sessionId}`);
  } catch (error) {
    console.error(`Error sending reminder for session ${sessionId}:`, error);
  }
}

/**
 * Get all scheduled reminders (for debugging/monitoring)
 */
export function getScheduledReminders(): ScheduledReminder[] {
  return Array.from(scheduledReminders.values()).map((reminder) => ({
    sessionId: reminder.sessionId,
    scheduledTime: reminder.scheduledTime,
    reminderTime: reminder.reminderTime,
  }));
}

/**
 * Clear all scheduled reminders (useful for testing or shutdown)
 */
export function clearAllReminders(): void {
  scheduledReminders.forEach((reminder) => {
    if (reminder.timeoutId) {
      clearTimeout(reminder.timeoutId);
    }
  });
  scheduledReminders.clear();
  console.log('Cleared all scheduled reminders');
}

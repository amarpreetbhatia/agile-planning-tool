import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { scheduleSessionReminder, cancelSessionReminder } from '@/lib/notification-scheduler';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * POST /api/sessions/[sessionId]/schedule-reminder
 * Schedule a reminder for a session
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const body = await request.json();
    const { scheduledTime } = body;

    if (!scheduledTime) {
      return NextResponse.json(
        { error: 'Scheduled time is required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid scheduled time' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get current user
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find session
    const sessionData = await Session.findOne({ sessionId });
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is the session host
    if (sessionData.hostId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Only the session host can schedule reminders' },
        { status: 403 }
      );
    }

    // Schedule the reminder
    const success = scheduleSessionReminder(sessionId, scheduledDate);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to schedule reminder (time may be in the past)' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder scheduled successfully',
      scheduledTime: scheduledDate,
    });
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return NextResponse.json(
      { error: 'Failed to schedule reminder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[sessionId]/schedule-reminder
 * Cancel a scheduled reminder
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await context.params;

    await connectDB();

    // Get current user
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find session
    const sessionData = await Session.findOne({ sessionId });
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is the session host
    if (sessionData.hostId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Only the session host can cancel reminders' },
        { status: 403 }
      );
    }

    // Cancel the reminder
    const success = cancelSessionReminder(sessionId);

    return NextResponse.json({
      success: true,
      message: success ? 'Reminder cancelled' : 'No reminder was scheduled',
    });
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reminder' },
      { status: 500 }
    );
  }
}

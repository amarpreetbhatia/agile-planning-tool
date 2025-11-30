import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import Project from '@/models/Project';
import { nanoid } from 'nanoid';
import { checkPermission } from '@/lib/permissions';
import { sendSessionCreatedEmail } from '@/lib/email';

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, projectId } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Session name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the user in the database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify project exists and user has permission to create sessions
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create sessions (must be member, admin, or owner)
    const permissionCheck = checkPermission(project, user._id.toString(), 'member');
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to create sessions in this project' },
        { status: 403 }
      );
    }

    // Generate unique session ID (8 characters, URL-safe)
    const sessionId = nanoid(8);

    // Apply project settings to session
    const votingMode = project.settings?.defaultVotingMode || 'anonymous';

    // Create the session with host as first participant
    const newSession = await Session.create({
      sessionId,
      projectId: project._id,
      hostId: user._id,
      name: name.trim(),
      status: 'active',
      votingMode,
      participants: [
        {
          userId: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          joinedAt: new Date(),
          isOnline: true,
        },
      ],
    });

    // Send email notifications to project members (async, don't wait)
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false') {
      const projectMembers = await User.find({
        _id: { $in: project.members.map((m) => m.userId) },
      });

      // Send notifications asynchronously
      sendSessionCreatedEmail(newSession, projectMembers).catch((error) => {
        console.error('Failed to send session created emails:', error);
      });
    }

    // Send in-app notifications to project members (excluding the creator)
    try {
      const { createNotifications } = await import('@/lib/notifications');
      const memberIds = project.members
        .filter((m: any) => m.userId.toString() !== user._id.toString())
        .map((m: any) => m.userId.toString());

      if (memberIds.length > 0) {
        await createNotifications(memberIds, {
          type: 'session_created',
          title: 'New Planning Session',
          message: `${user.username} created a new session: ${name.trim()}`,
          link: `/sessions/${sessionId}`,
          metadata: {
            sessionId,
            projectId: project.projectId,
            createdBy: user.username,
          },
        });
      }
    } catch (notifError) {
      console.error('Error creating in-app notifications:', notifError);
      // Don't fail the session creation if notification fails
    }

    // Return the created session
    return NextResponse.json(
      {
        sessionId: newSession.sessionId,
        name: newSession.name,
        hostId: newSession.hostId.toString(),
        status: newSession.status,
        participants: newSession.participants,
        createdAt: newSession.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// GET /api/sessions - Get all sessions for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the user in the database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const projectIdFilter = searchParams.get('projectId');

    // Get user's projects to filter sessions
    const userProjects = await Project.find({
      'members.userId': user._id,
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    // Build query
    const query: any = {
      projectId: { $in: projectIds },
      status,
    };

    // Add project filter if specified
    if (projectIdFilter) {
      query.projectId = projectIdFilter;
    }

    // Find sessions from user's projects
    const sessions = await Session.find(query)
      .populate('projectId', 'name projectId')
      .sort({ updatedAt: -1 })
      .lean();

    // Transform sessions for response
    const transformedSessions = sessions.map((s: any) => ({
      sessionId: s.sessionId,
      name: s.name,
      projectId: s.projectId?._id?.toString(),
      projectName: s.projectId?.name,
      hostId: s.hostId.toString(),
      status: s.status,
      votingMode: s.votingMode,
      participantCount: s.participants.length,
      participants: s.participants,
      currentStory: s.currentStory,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({ sessions: transformedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

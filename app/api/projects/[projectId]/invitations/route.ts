import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Project, Invitation, User } from '@/models';
import { isProjectAdmin } from '@/lib/permissions';
import connectDB from '@/lib/db';
import crypto from 'crypto';

// POST /api/projects/[projectId]/invitations - Send invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { githubUsername, email, role } = body;

    // Validate input
    if (!githubUsername && !email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Either GitHub username or email is required',
          },
        },
        { status: 400 }
      );
    }

    if (!role || !['admin', 'member'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Valid role (admin or member) is required',
          },
        },
        { status: 400 }
      );
    }

    // Find project
    const project = await Project.findOne({ projectId });
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        },
        { status: 404 }
      );
    }

    // Check permissions - only owner or admin can invite
    if (!isProjectAdmin(project, user._id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only project owners and admins can invite members',
          },
        },
        { status: 403 }
      );
    }

    // Check if user is already a member
    let invitedUser: any = null;
    if (githubUsername) {
      invitedUser = await User.findOne({ username: githubUsername });
      if (invitedUser) {
        const isMember = project.members.some(
          (m) => m.userId.toString() === invitedUser._id.toString()
        );
        if (isMember || project.ownerId.toString() === invitedUser._id.toString()) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'USER_ALREADY_MEMBER',
                message: 'User is already a member of this project',
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // Check for existing pending invitation
    const orConditions = [];
    if (invitedUser) orConditions.push({ invitedUser: invitedUser._id });
    if (email) orConditions.push({ invitedEmail: email });
    if (githubUsername) orConditions.push({ invitedGithubUsername: githubUsername });

    const existingInvitation = orConditions.length > 0 ? await Invitation.findOne({
      projectId: project._id,
      status: 'pending',
      $or: orConditions,
    }) : null;

    if (existingInvitation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVITATION_ALREADY_EXISTS',
            message: 'An invitation is already pending for this user',
          },
        },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await Invitation.create({
      projectId: project._id,
      invitedBy: user._id,
      invitedUser: invitedUser?._id,
      invitedEmail: email,
      invitedGithubUsername: githubUsername,
      role,
      status: 'pending',
      token,
      expiresAt,
    });

    // Populate invitation with project and inviter details
    const populatedInvitation = await Invitation.findById(invitation._id)
      .populate('projectId', 'name description projectId')
      .populate('invitedBy', 'username avatarUrl')
      .populate('invitedUser', 'username email avatarUrl');

    return NextResponse.json({
      success: true,
      data: populatedInvitation,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send invitation',
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/projects/[projectId]/invitations - List project invitations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } },
        { status: 401 }
      );
    }

    // Find project
    const project = await Project.findOne({ projectId });
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        },
        { status: 404 }
      );
    }

    // Check permissions - only owner or admin can view invitations
    if (!isProjectAdmin(project, user._id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only project owners and admins can view invitations',
          },
        },
        { status: 403 }
      );
    }

    // Get all pending invitations for this project
    const invitations = await Invitation.find({
      projectId: project._id,
      status: 'pending',
    })
      .populate('invitedBy', 'username avatarUrl')
      .populate('invitedUser', 'username email avatarUrl')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch invitations',
        },
      },
      { status: 500 }
    );
  }
}

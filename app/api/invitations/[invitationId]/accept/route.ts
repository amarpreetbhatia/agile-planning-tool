import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Project, Invitation, User } from '@/models';
import connectDB from '@/lib/db';

// POST /api/invitations/[invitationId]/accept - Accept invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;
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

    // Find invitation
    const invitation = await Invitation.findById(invitationId).populate(
      'projectId',
      'name description projectId members ownerId'
    );

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Invitation not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVITATION_ALREADY_RESPONDED',
            message: `Invitation has already been ${invitation.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVITATION_EXPIRED',
            message: 'Invitation has expired',
          },
        },
        { status: 400 }
      );
    }

    // Verify the invitation is for this user
    const isForUser =
      (invitation.invitedUser &&
        invitation.invitedUser.toString() === user._id.toString()) ||
      invitation.invitedEmail === user.email ||
      invitation.invitedGithubUsername === user.username;

    if (!isForUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'This invitation is not for you',
          },
        },
        { status: 403 }
      );
    }

    // Find project
    const project = await Project.findById(invitation.projectId);
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const isMember = project.members.some(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (isMember || project.ownerId.toString() === user._id.toString()) {
      // Update invitation status but don't add again
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await invitation.save();

      return NextResponse.json({
        success: true,
        data: project,
        message: 'You are already a member of this project',
      });
    }

    // Add user to project members
    project.members.push({
      userId: user._id as any,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: invitation.role,
      joinedAt: new Date(),
    });

    await project.save();

    // Update invitation status
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Successfully joined the project',
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to accept invitation',
        },
      },
      { status: 500 }
    );
  }
}

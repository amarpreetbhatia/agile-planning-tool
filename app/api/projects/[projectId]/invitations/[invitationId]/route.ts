import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Project, Invitation, User } from '@/models';
import { isProjectAdmin } from '@/lib/permissions';
import connectDB from '@/lib/db';

// DELETE /api/projects/[projectId]/invitations/[invitationId] - Cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; invitationId: string }> }
) {
  const { projectId, invitationId } = await params;
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

    // Check permissions - only owner or admin can cancel invitations
    if (!isProjectAdmin(project, user._id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only project owners and admins can cancel invitations',
          },
        },
        { status: 403 }
      );
    }

    // Find and delete invitation
    const invitation = await Invitation.findOneAndDelete({
      _id: invitationId,
      projectId: project._id,
      status: 'pending',
    });

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Invitation not found or already responded to',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cancel invitation',
        },
      },
      { status: 500 }
    );
  }
}

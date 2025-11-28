import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Invitation, User } from '@/models';
import connectDB from '@/lib/db';

// POST /api/invitations/[invitationId]/decline - Decline invitation
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
    const invitation = await Invitation.findById(invitationId);

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

    // Update invitation status
    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    await invitation.save();

    return NextResponse.json({
      success: true,
      message: 'Invitation declined',
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to decline invitation',
        },
      },
      { status: 500 }
    );
  }
}

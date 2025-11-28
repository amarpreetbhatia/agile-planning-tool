import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Invitation, User } from '@/models';
import connectDB from '@/lib/db';

// GET /api/invitations/me - Get user's pending invitations
export async function GET(request: NextRequest) {
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

    // Find all pending invitations for this user
    const invitations = await Invitation.find({
      status: 'pending',
      $or: [
        { invitedUser: user._id },
        { invitedEmail: user.email },
        { invitedGithubUsername: user.username },
      ],
      expiresAt: { $gt: new Date() }, // Only non-expired invitations
    })
      .populate('projectId', 'name description projectId')
      .populate('invitedBy', 'username avatarUrl')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error('Error fetching user invitations:', error);
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

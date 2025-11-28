import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Project, User } from '@/models';
import { isProjectAdmin, isProjectOwner } from '@/lib/permissions';
import connectDB from '@/lib/db';

// DELETE /api/projects/[projectId]/members/[userId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  const { projectId, userId } = await params;
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
    const currentUser = await User.findOne({ githubId: session.user.githubId });
    if (!currentUser) {
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

    // Check if trying to remove the owner
    if (project.ownerId.toString() === userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_REMOVE_OWNER',
            message: 'Cannot remove the project owner',
          },
        },
        { status: 400 }
      );
    }

    // Find the member to be removed
    const memberToRemove = project.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!memberToRemove) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMBER_NOT_FOUND',
            message: 'Member not found in this project',
          },
        },
        { status: 404 }
      );
    }

    // Permission check:
    // - Owner can remove anyone
    // - Admin can remove members (but not other admins or owner)
    // - Members can only remove themselves
    const isOwner = isProjectOwner(project, currentUser._id);
    const isAdmin = isProjectAdmin(project, currentUser._id);
    const isSelf = currentUser._id.toString() === userId;

    if (!isOwner && !isAdmin && !isSelf) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to remove this member',
          },
        },
        { status: 403 }
      );
    }

    // Admins cannot remove other admins or owner
    if (isAdmin && !isOwner && memberToRemove.role === 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admins cannot remove other admins',
          },
        },
        { status: 403 }
      );
    }

    // Remove member from project
    project.members = project.members.filter(
      (m) => m.userId.toString() !== userId
    );

    await project.save();

    return NextResponse.json({
      success: true,
      message: isSelf
        ? 'Successfully left the project'
        : 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove member',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/members/[userId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  const { projectId, userId } = await params;
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
    const currentUser = await User.findOne({ githubId: session.user.githubId });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { role } = body;

    // Validate role
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

    // Only owner can change roles
    if (!isProjectOwner(project, currentUser._id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only the project owner can change member roles',
          },
        },
        { status: 403 }
      );
    }

    // Cannot change owner's role
    if (project.ownerId.toString() === userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_CHANGE_OWNER_ROLE',
            message: 'Cannot change the project owner role',
          },
        },
        { status: 400 }
      );
    }

    // Find and update member
    const member = project.members.find((m) => m.userId.toString() === userId);
    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMBER_NOT_FOUND',
            message: 'Member not found in this project',
          },
        },
        { status: 404 }
      );
    }

    member.role = role;
    await project.save();

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update member role',
        },
      },
      { status: 500 }
    );
  }
}

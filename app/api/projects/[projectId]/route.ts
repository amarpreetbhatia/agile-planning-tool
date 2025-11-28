import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Project, User } from '@/models';
import { validateProjectAccess } from '@/lib/permissions';

/**
 * GET /api/projects/[projectId]
 * Get project details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not found',
          },
        },
        { status: 401 }
      );
    }

    const result = await validateProjectAccess(
      params.projectId,
      user._id,
      'member'
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found',
          },
        },
        { status: 404 }
      );
    }

    if (!result.permission.hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: result.permission.message,
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to fetch project',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[projectId]
 * Update project settings (admin or owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not found',
          },
        },
        { status: 401 }
      );
    }

    const result = await validateProjectAccess(
      params.projectId,
      user._id,
      'admin'
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found',
          },
        },
        { status: 404 }
      );
    }

    if (!result.permission.hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: result.permission.message,
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, settings } = body;

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) updateData.settings = settings;

    // Update project
    const updatedProject = await Project.findOneAndUpdate(
      { projectId: params.projectId },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to update project',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Delete project (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ githubId: session.user.githubId });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not found',
          },
        },
        { status: 401 }
      );
    }

    const result = await validateProjectAccess(
      params.projectId,
      user._id,
      'owner'
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found',
          },
        },
        { status: 404 }
      );
    }

    if (!result.permission.hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_PROJECT_OWNER',
            message: 'Only project owner can delete the project',
          },
        },
        { status: 403 }
      );
    }

    // Delete the project
    await Project.deleteOne({ projectId: params.projectId });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to delete project',
        },
      },
      { status: 500 }
    );
  }
}

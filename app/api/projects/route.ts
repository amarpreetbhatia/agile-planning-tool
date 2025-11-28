import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Project, User } from '@/models';
import { getUserProjects } from '@/lib/permissions';
import { nanoid } from 'nanoid';

/**
 * GET /api/projects
 * List all projects where the user is a member
 */
export async function GET(request: NextRequest) {
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

    const projects = await getUserProjects(user._id);

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to fetch projects',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, settings } = body;

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Name and description are required',
          },
        },
        { status: 400 }
      );
    }

    // Get user details
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

    // Generate unique project ID
    const projectId = nanoid(10);

    // Create project with owner as first member
    const project = await Project.create({
      projectId,
      name,
      description,
      ownerId: user._id,
      members: [
        {
          userId: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      settings: settings || {
        defaultCardValues: 'fibonacci',
        defaultVotingMode: 'anonymous',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: project,
        message: 'Project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_OPERATION_FAILED',
          message: 'Failed to create project',
        },
      },
      { status: 500 }
    );
  }
}

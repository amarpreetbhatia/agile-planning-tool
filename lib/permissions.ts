import { ObjectId } from 'mongoose';
import { IProject, ProjectRole, IPermissionCheck } from '@/types';
import { Project } from '@/models';

// Re-export client-safe functions
export {
  hasRole,
  getUserRole,
  isProjectOwner,
  isProjectAdmin,
  isProjectMember,
} from './permissions-client';

/**
 * Check if user has permission to perform an action on a project
 */
export function checkPermission(
  project: IProject,
  userId: string | ObjectId,
  requiredRole: ProjectRole
): IPermissionCheck {
  // Import locally to avoid circular dependency
  const { getUserRole, hasRole } = require('./permissions-client');
  
  const userRole = getUserRole(project, userId);
  
  if (!userRole) {
    return {
      hasPermission: false,
      message: 'User is not a member of this project',
    };
  }
  
  const hasPermission = hasRole(userRole, requiredRole);
  
  return {
    hasPermission,
    role: userRole,
    message: hasPermission
      ? undefined
      : `Insufficient permissions. Required: ${requiredRole}, Current: ${userRole}`,
  };
}

/**
 * Validate project access and return project with permission check
 */
export async function validateProjectAccess(
  projectId: string,
  userId: string | ObjectId,
  requiredRole: ProjectRole = 'member'
): Promise<{ project: IProject; permission: IPermissionCheck } | null> {
  try {
    const project = await Project.findOne({ projectId });
    
    if (!project) {
      return null;
    }
    
    const permission = checkPermission(project, userId, requiredRole);
    
    return { project, permission };
  } catch (error) {
    console.error('Error validating project access:', error);
    return null;
  }
}

/**
 * Get all projects where user is a member
 */
export async function getUserProjects(
  userId: string | ObjectId
): Promise<IProject[]> {
  try {
    const userIdStr = userId.toString();
    
    // Find projects where user is owner or in members array
    const projects = await Project.find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId },
      ],
    }).sort({ updatedAt: -1 });
    
    return projects;
  } catch (error) {
    console.error('Error getting user projects:', error);
    return [];
  }
}

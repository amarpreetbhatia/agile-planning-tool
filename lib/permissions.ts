import { ObjectId } from 'mongoose';
import { IProject, ProjectRole, IPermissionCheck } from '@/types';
import { Project } from '@/models';

/**
 * Permission hierarchy:
 * owner > admin > member
 */
const roleHierarchy: Record<ProjectRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Check if a user has a specific role or higher in a project
 */
export function hasRole(
  userRole: ProjectRole,
  requiredRole: ProjectRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get user's role in a project
 */
export function getUserRole(
  project: IProject,
  userId: string | ObjectId
): ProjectRole | null {
  const userIdStr = userId.toString();
  
  // Check if user is the owner
  if (project.ownerId.toString() === userIdStr) {
    return 'owner';
  }
  
  // Check if user is in members array
  const member = project.members.find(
    (m) => m.userId.toString() === userIdStr
  );
  
  return member ? member.role : null;
}

/**
 * Check if user has permission to perform an action on a project
 */
export function checkPermission(
  project: IProject,
  userId: string | ObjectId,
  requiredRole: ProjectRole
): IPermissionCheck {
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
 * Check if user is project owner
 */
export function isProjectOwner(
  project: IProject,
  userId: string | ObjectId
): boolean {
  return project.ownerId.toString() === userId.toString();
}

/**
 * Check if user is project admin or owner
 */
export function isProjectAdmin(
  project: IProject,
  userId: string | ObjectId
): boolean {
  const userRole = getUserRole(project, userId);
  return userRole ? hasRole(userRole, 'admin') : false;
}

/**
 * Check if user is project member (any role)
 */
export function isProjectMember(
  project: IProject,
  userId: string | ObjectId
): boolean {
  return getUserRole(project, userId) !== null;
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

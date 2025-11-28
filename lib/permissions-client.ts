import { ObjectId } from 'mongoose';
import { IProject, ProjectRole } from '@/types';

/**
 * Client-safe permission utilities (no database access)
 * For server-side functions with database access, use lib/permissions.ts
 */

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

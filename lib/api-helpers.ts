/**
 * API helper utilities for common patterns
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/models/User'
import Session from '@/models/Session'
import { ErrorCode, createAppError } from './error-logger'

/**
 * Get authenticated user from session
 */
export async function getAuthenticatedUser() {
  const session = await auth()
  
  if (!session?.user) {
    throw createAppError(
      ErrorCode.UNAUTHORIZED,
      'You must be logged in to perform this action',
      401
    )
  }
  
  await connectDB()
  
  const user = await User.findOne({ githubId: session.user.githubId })
  
  if (!user) {
    throw createAppError(
      ErrorCode.AUTH_FAILED,
      'User not found',
      404
    )
  }
  
  return user
}

/**
 * Get session by ID and validate it exists
 */
export async function getSessionById(sessionId: string) {
  await connectDB()
  
  const session = await Session.findOne({ sessionId })
  
  if (!session) {
    throw createAppError(
      ErrorCode.SESSION_NOT_FOUND,
      'Session not found',
      404
    )
  }
  
  return session
}

/**
 * Validate user is session host
 */
export function validateSessionHost(session: any, userId: string) {
  if (session.hostId.toString() !== userId.toString()) {
    throw createAppError(
      ErrorCode.NOT_SESSION_HOST,
      'Only the session host can perform this action',
      403
    )
  }
}

/**
 * Validate user is session participant
 */
export function validateSessionParticipant(session: any, userId: string) {
  const isParticipant = session.participants.some(
    (p: any) => p.userId.toString() === userId.toString()
  )
  
  if (!isParticipant) {
    throw createAppError(
      ErrorCode.UNAUTHORIZED,
      'You are not a participant in this session',
      403
    )
  }
}

/**
 * Validate session is active
 */
export function validateSessionActive(session: any) {
  if (session.status !== 'active') {
    throw createAppError(
      ErrorCode.SESSION_ENDED,
      'This session has ended',
      400
    )
  }
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw createAppError(
      ErrorCode.API_ERROR,
      'Invalid request body',
      400
    )
  }
}

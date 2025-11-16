/**
 * Error logging utility for centralized error handling and logging
 */

export enum ErrorCode {
  // Authentication Errors
  AUTH_FAILED = 'AUTH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Session Errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_ENDED = 'SESSION_ENDED',
  NOT_SESSION_HOST = 'NOT_SESSION_HOST',
  
  // GitHub Errors
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  GITHUB_TOKEN_INVALID = 'GITHUB_TOKEN_INVALID',
  GITHUB_RATE_LIMIT = 'GITHUB_RATE_LIMIT',
  
  // Voting Errors
  ROUND_NOT_ACTIVE = 'ROUND_NOT_ACTIVE',
  ALREADY_REVEALED = 'ALREADY_REVEALED',
  INVALID_CARD_VALUE = 'INVALID_CARD_VALUE',
  
  // Database Errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_OPERATION_FAILED = 'DB_OPERATION_FAILED',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SOCKET_ERROR = 'SOCKET_ERROR',
  API_ERROR = 'API_ERROR',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  code: ErrorCode
  message: string
  statusCode?: number
  details?: any
  timestamp: Date
}

/**
 * Create a standardized application error
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  statusCode?: number,
  details?: any
): AppError {
  return {
    code,
    message,
    statusCode,
    details,
    timestamp: new Date(),
  }
}

/**
 * Log error to console (development) or monitoring service (production)
 */
export function logError(error: AppError | Error, context?: string) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)
  } else {
    // In production, send to monitoring service (e.g., Sentry, LogRocket)
    // For now, just log to console
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)
    
    // TODO: Integrate with monitoring service
    // Example: Sentry.captureException(error)
  }
}

/**
 * Get user-friendly error message based on error code
 */
export function getUserFriendlyMessage(error: AppError | Error): string {
  if ('code' in error) {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.AUTH_FAILED]: 'Authentication failed. Please try logging in again.',
      [ErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action.',
      [ErrorCode.SESSION_NOT_FOUND]: 'Session not found. It may have been deleted or the link is invalid.',
      [ErrorCode.SESSION_ENDED]: 'This session has ended.',
      [ErrorCode.NOT_SESSION_HOST]: 'Only the session host can perform this action.',
      [ErrorCode.GITHUB_API_ERROR]: 'Failed to connect to GitHub. Please try again.',
      [ErrorCode.GITHUB_TOKEN_INVALID]: 'Your GitHub access has expired. Please log in again.',
      [ErrorCode.GITHUB_RATE_LIMIT]: 'GitHub rate limit exceeded. Please try again later.',
      [ErrorCode.ROUND_NOT_ACTIVE]: 'No active voting round. Please wait for the host to select a story.',
      [ErrorCode.ALREADY_REVEALED]: 'Estimates have already been revealed for this round.',
      [ErrorCode.INVALID_CARD_VALUE]: 'Invalid card value selected.',
      [ErrorCode.DB_CONNECTION_ERROR]: 'Database connection error. Please try again.',
      [ErrorCode.DB_OPERATION_FAILED]: 'Failed to save data. Please try again.',
      [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
      [ErrorCode.SOCKET_ERROR]: 'Real-time connection error. Attempting to reconnect...',
      [ErrorCode.API_ERROR]: 'Server error. Please try again.',
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    }
    
    return messages[error.code] || messages[ErrorCode.UNKNOWN_ERROR]
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Parse API error response
 */
export function parseApiError(error: any): AppError {
  if (error.response?.data) {
    const { code, message, statusCode } = error.response.data
    return createAppError(
      code || ErrorCode.API_ERROR,
      message || 'API request failed',
      statusCode || error.response.status
    )
  }
  
  if (error.message) {
    return createAppError(
      ErrorCode.NETWORK_ERROR,
      error.message,
      error.status
    )
  }
  
  return createAppError(
    ErrorCode.UNKNOWN_ERROR,
    'An unexpected error occurred'
  )
}

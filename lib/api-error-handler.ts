/**
 * API error handler for consistent error responses
 */

import { NextResponse } from 'next/server'
import { ErrorCode, createAppError, logError } from './error-logger'

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(error: any, context?: string): NextResponse {
  // Log the error
  logError(error, context)

  // Parse error code and message
  let errorCode = ErrorCode.UNKNOWN_ERROR
  let message = 'An unexpected error occurred'
  let statusCode = 500

  if (error.code && Object.values(ErrorCode).includes(error.code)) {
    errorCode = error.code
    message = error.message
    statusCode = error.statusCode || 500
  } else if (error.message) {
    message = error.message
    
    // Map common error messages to error codes
    if (error.message.includes('not found')) {
      errorCode = ErrorCode.SESSION_NOT_FOUND
      statusCode = 404
    } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      errorCode = ErrorCode.UNAUTHORIZED
      statusCode = 403
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      errorCode = ErrorCode.DB_OPERATION_FAILED
      statusCode = 500
    }
  }

  const appError = createAppError(errorCode, message, statusCode)

  return NextResponse.json(
    {
      error: {
        code: appError.code,
        message: appError.message,
        timestamp: appError.timestamp,
      },
    },
    { status: statusCode }
  )
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, statusCode: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  )
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; error?: NextResponse } {
  const missingFields = requiredFields.filter(field => !body[field])
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: {
            code: ErrorCode.API_ERROR,
            message: `Missing required fields: ${missingFields.join(', ')}`,
          },
        },
        { status: 400 }
      ),
    }
  }
  
  return { valid: true }
}

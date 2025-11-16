/**
 * API retry logic with exponential backoff
 */

export interface RetryConfig {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatusCodes?: number[]
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)
  return Math.min(delay, config.maxDelay)
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, config: Required<RetryConfig>): boolean {
  // Network errors are retryable
  if (!error.response) {
    return true
  }
  
  // Check if status code is retryable
  const statusCode = error.response.status
  return config.retryableStatusCodes.includes(statusCode)
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: any
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry if this is the last attempt
      if (attempt === finalConfig.maxRetries) {
        break
      }
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error, finalConfig)) {
        break
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig)
      console.log(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`)
      await sleep(delay)
    }
  }
  
  throw lastError
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options)
    
    // Throw error for non-ok responses
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
      error.response = response
      throw error
    }
    
    return response
  }, retryConfig)
}

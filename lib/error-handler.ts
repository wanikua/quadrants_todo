import { toast } from 'sonner'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, context?: string): {
  message: string
  code?: string
  details?: any
} {
  console.error(`Error in ${context || 'unknown context'}:`, error)

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    }
  }

  if (error instanceof Error) {
    // Database errors
    if (error.message.includes('duplicate key')) {
      return {
        message: '该记录已存在',
        code: 'DUPLICATE_KEY',
        details: error.message
      }
    }

    if (error.message.includes('foreign key')) {
      return {
        message: '关联数据错误',
        code: 'FOREIGN_KEY_VIOLATION',
        details: error.message
      }
    }

    if (error.message.includes('not found')) {
      return {
        message: '数据未找到',
        code: 'NOT_FOUND',
        details: error.message
      }
    }

    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      return {
        message: '您没有权限执行此操作',
        code: 'UNAUTHORIZED',
        details: error.message
      }
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        message: '网络连接错误，请检查网络后重试',
        code: 'NETWORK_ERROR',
        details: error.message
      }
    }

    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      details: error.stack
    }
  }

  return {
    message: '发生未知错误',
    code: 'UNKNOWN_ERROR',
    details: String(error)
  }
}

export function showErrorToast(error: unknown, context?: string) {
  const { message } = handleError(error, context)
  toast.error(message)
}

export function showSuccessToast(message: string) {
  toast.success(message)
}

export function showInfoToast(message: string) {
  toast.info(message)
}

// Async error wrapper for server actions
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: ReturnType<typeof handleError> }> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    return { error: handleError(error, context) }
  }
}

// React Error Boundary fallback component moved to components/error-fallback.tsx

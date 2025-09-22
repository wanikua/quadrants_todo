'use client'

import React from 'react'
import { handleError } from '@/lib/error-handler'

export function ErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  const errorInfo = handleError(error)

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl">😔</div>
        <h2 className="text-2xl font-bold">出现了一些问题</h2>
        <p className="text-muted-foreground">{errorInfo.message}</p>
        {process.env.NODE_ENV === 'development' && errorInfo.details && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm">详细信息</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(errorInfo.details, null, 2)}
            </pre>
          </details>
        )}
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
        >
          重试
        </button>
      </div>
    </div>
  )
}
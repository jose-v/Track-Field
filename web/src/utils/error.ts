interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) {
    return maybeError
  }

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError))
  }
}

export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message
}

export function handleError(error: unknown): void {
  console.error('An error occurred:', getErrorMessage(error))
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AppError'
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError
  }

  static fromError(error: unknown): AppError {
    if (AppError.isAppError(error)) {
      return error
    }

    return new AppError(getErrorMessage(error))
  }
} 
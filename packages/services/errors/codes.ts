export const ERROR_CODES = {
  COMMON: {
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL: 'INTERNAL',
    UNAUTHORIZED: 'UNAUTHORIZED',
  },
  VALIDATION: {
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_STATE: 'INVALID_STATE',
  },
  COMPUTER: {
    ALREADY_RUNNING: 'ALREADY_RUNNING',
    ALREADY_STOPPED: 'ALREADY_STOPPED',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    INVALID_PLATFORM: 'INVALID_PLATFORM',
    RUNTIME_ERROR: 'RUNTIME_ERROR',
  },
  USAGE: {
    LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
    INVALID_METRIC: 'INVALID_METRIC',
  },
} as const;

export type ErrorCode =
  (typeof ERROR_CODES)[keyof typeof ERROR_CODES][keyof (typeof ERROR_CODES)[keyof typeof ERROR_CODES]];

// Type guard to check if a string is a valid error code
export function isErrorCode(code: string): code is ErrorCode {
  return Object.values(ERROR_CODES).some((domain) =>
    Object.values(domain).includes(code as ErrorCode)
  );
}

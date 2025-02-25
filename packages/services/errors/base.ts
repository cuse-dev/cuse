import { ERROR_CODES } from './codes';

export interface ErrorContext {
  timestamp?: Date;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface SerializedError {
  message: string;
  code: string;
  status: number;
  context: ErrorContext;
  stack?: string;
}

export abstract class BaseError extends Error {
  code: string;
  status: number;
  context: ErrorContext;

  constructor(
    message: string,
    code: string,
    status: number,
    context: ErrorContext = { timestamp: new Date() }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): SerializedError {
    return {
      message: this.message,
      code: this.code,
      status: this.status,
      context: this.context,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  static isBaseError(error: unknown): error is BaseError {
    return error instanceof BaseError;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details: unknown[], context?: ErrorContext) {
    super(message, ERROR_CODES.VALIDATION.INVALID_INPUT, 400, {
      ...context,
      timestamp: new Date(),
      details,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, id: string, context?: ErrorContext) {
    super(
      `${resource} with id ${id} not found`,
      ERROR_CODES.COMMON.NOT_FOUND,
      404,
      {
        ...context,
        timestamp: new Date(),
        resource,
        id,
      }
    );
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized', context?: ErrorContext) {
    super(message, ERROR_CODES.COMMON.UNAUTHORIZED, 401, {
      ...context,
      timestamp: new Date(),
    });
  }
}

export class InternalError extends BaseError {
  constructor(message: string, originalError: unknown, context?: ErrorContext) {
    super(message, ERROR_CODES.COMMON.INTERNAL, 500, {
      ...context,
      timestamp: new Date(),
      originalError:
        process.env.NODE_ENV === 'development' ? originalError : undefined,
    });
  }
}

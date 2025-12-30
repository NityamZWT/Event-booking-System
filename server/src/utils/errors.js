const { ErrorType } = require('../constants/common.types');

class AppError extends Error {
  constructor(message, statusCode, type) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = {}) {
    super(message, 400, ErrorType.VALIDATION_ERROR);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, ErrorType.AUTHENTICATION_ERROR);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, ErrorType.AUTHORIZATION_ERROR);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, ErrorType.NOT_FOUND_ERROR);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, ErrorType.CONFLICT_ERROR);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, ErrorType.DATABASE_ERROR);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, ErrorType.INTERNAL_SERVER_ERROR);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  InternalServerError
};
const {
  BaseError,
  ValidationError: SequelizeValidationError,
} = require("sequelize");
const {
  AppError,
  ValidationError,
  ConflictError,
  DatabaseError,
  InternalServerError,
  AuthenticationError,
} = require("../utils/errors");

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    const response = {
      success: false,
      type: err.type,
      message: err.message,
    };

    if (err instanceof ValidationError && Object.keys(err.errors).length > 0) {
      response.errors = err.errors;
    }

    return res.status(err.statusCode).json(response);
  }

  if (err instanceof SequelizeValidationError) {
    const errors = err.errors.reduce((acc, error) => {
      acc[error.path] = error.message;
      return acc;
    }, {});

    const validationError = new ValidationError("Validation failed", errors);
    return res.status(validationError.statusCode).json({
      success: false,
      type: validationError.type,
      message: validationError.message,
      errors: validationError.errors,
    });
  }

  if (err instanceof BaseError) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const errors = err.errors.reduce((acc, error) => {
        acc[error.path] = `${error.path} must be unique`;
        return acc;
      }, {});

      const conflictError = new ConflictError("Resource already exists");
      return res.status(conflictError.statusCode).json({
        success: false,
        type: conflictError.type,
        message: conflictError.message,
        errors,
      });
    }

    if (err.name === "SequelizeForeignKeyConstraintError") {
      const dbError = new DatabaseError(
        "Invalid reference to related resource"
      );
      return res.status(dbError.statusCode).json({
        success: false,
        type: dbError.type,
        message: dbError.message,
      });
    }

    const dbError = new DatabaseError("Database operation failed");
    return res.status(dbError.statusCode).json({
      success: false,
      type: dbError.type,
      message: dbError.message,
      error:err.message,
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    const authError = new AuthenticationError(
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
    );
    return res.status(authError.statusCode).json({
      success: false,
      type: authError.type,
      message: authError.message,
    });
  }

  const internalError = new InternalServerError(
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message
  );

  return res.status(internalError.statusCode).json({
    success: false,
    type: internalError.type,
    message: internalError.message,
  });
};

module.exports = errorHandler;

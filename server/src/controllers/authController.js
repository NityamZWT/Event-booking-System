const authService = require("../services/authService");
const { registerSchema, loginSchema } = require("../validators/authValidator");
const {
  CreatedResponse,
  SuccessResponse,
} = require("../utils/responseHandler");
const { ValidationError } = require("../utils/errors");

const register = async (req, res, next) => {
  try {
    const validatedData = await registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const result = await authService.register(validatedData);

    return new CreatedResponse("User registered successfully", result).send(
      res
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = error.inner.reduce((acc, err) => {
        if (err.path) {
          acc[err.path] = err.message;
        }
        return acc;
      }, {});
      return next(new ValidationError("Validation failed", errors));
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = await loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const result = await authService.login(validatedData);

    return new SuccessResponse("Login successful", result).send(res);
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = error.inner.reduce((acc, err) => {
        if (err.path) {
          acc[err.path] = err.message;
        }
        return acc;
      }, {});
      return next(new ValidationError("Validation failed", errors));
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
};

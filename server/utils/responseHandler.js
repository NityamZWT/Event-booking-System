class ResponseHandler {
  constructor(statusCode, message, success, data = undefined) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = success;
    this.data = data;
  }

  send(res) {
    const response = {
      success: this.success,
      message: this.message,
      data: this.data,
    };
    return res.status(this.statusCode).json(response);
  }
}

class SuccessResponse extends ResponseHandler {
  constructor(message, data = undefined) {
    super(200, message, true, data);
  }
}

class ErrorResponse extends ResponseHandler {
  constructor(statusCode, message) {
    super(statusCode, message, false);
  }
}

class CreateResponse extends ResponseHandler {
  constructor(message, data = undefined) {
    super(201, message, true, data);
  }
}

class UnAuthorizedResponse extends ResponseHandler {
  constructor(
    message = "user not authorise. Please login with correct",
    data = undefined
  ) {
    super(401, message, true);
  }
}

class AccessDeniedResponse extends ResponseHandler {
  constructor(
    message = "User is no authorise for demanded rsource",
    data = undefined
  ) {
    super(403, message, true);
  }
}

module.exports = {
  ResponseHandler,
  AccessDeniedResponse,
  UnAuthorizedResponse,
  CreateResponse,
  ErrorResponse,
  SuccessResponse,
};

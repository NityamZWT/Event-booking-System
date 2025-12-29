const { ResponseType } = require('../constants/common.types');

class ApiResponse {
  constructor(statusCode, message, success, type, data = null, meta = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = success;
    this.type = type;
    this.data = data;
    this.meta = meta;
  }

  send(res) {
    const response = {
      success: this.success,
      type: this.type,
      message: this.message
    };

    if (this.data !== null && this.data !== undefined) {
      response.data = this.data;
    }

    if (this.meta !== null && this.meta !== undefined) {
      response.meta = this.meta;
    }

    return res.status(this.statusCode).json(response);
  }
}

class SuccessResponse extends ApiResponse {
  constructor(message, data = null, meta = null) {
    super(200, message, true, ResponseType.SUCCESS, data, meta);
  }
}

class CreatedResponse extends ApiResponse {
  constructor(message, data = null) {
    super(201, message, true, ResponseType.CREATED, data);
  }
}

class NoContentResponse extends ApiResponse {
  constructor(message = 'Success') {
    super(204, message, true, ResponseType.NO_CONTENT);
  }
}

module.exports = {
  ApiResponse,
  SuccessResponse,
  CreatedResponse,
  NoContentResponse
};
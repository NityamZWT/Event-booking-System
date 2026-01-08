const { verifyToken } = require("../utils/jwtHelper");
const { AuthenticationError, AuthorizationError } = require("../utils/errors");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || null;
    const allowedRoutes = ["/api/events", "/api/events/"];
    console.log((!allowedRoutes.includes(req.baseUrl)) || req.method !== "GET");
    
    if (((!authHeader || !authHeader.startsWith("Bearer ")) && (!allowedRoutes.includes(req.baseUrl)) && req.method !== "GET")) {
      throw new AuthenticationError("No token provided");
    }

    if (allowedRoutes.includes(req.baseUrl) && req.method === "GET") {
      return next();
    }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      console.log(token, 'token');
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AuthenticationError("Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AuthenticationError("Token expired"));
    }
    next(error);
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError("User not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`
        )
      );
    }

    next();
  };
};


module.exports = {
  authenticate,
  authorize,
};

const path = require("path");
const { newEnforcer } = require("casbin");
const { verifyToken } = require("../utils/jwtHelper");
const { AuthenticationError, AuthorizationError } = require("../utils/errors");

const MODEL_PATH = path.join(__dirname, "../policies/model.conf");
const POLICY_PATH = path.join(__dirname, "../policies/policy.csv");

let enforcerInstance = null;

const getEnforcer = async () => {
  if (!enforcerInstance) {
    enforcerInstance = await newEnforcer(MODEL_PATH, POLICY_PATH);
  }
  return enforcerInstance;
};

const authenticate = (req, res, next) => {
  try {
    const PUBLIC_GET_ROUTES = ["/api/events", "/api/events/"];
    const isPublicGet =
      PUBLIC_GET_ROUTES.includes(req.baseUrl) && req.method === "GET";

    const authHeader = req.headers.authorization || null;
    const hasToken = authHeader && authHeader.startsWith("Bearer ");

    if (isPublicGet && !hasToken) {
      return next();
    }

    if (!hasToken) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

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

const authorize = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError("User not authenticated"));
      }

      const e = await getEnforcer();
      const role = req.user.role;

      const resolvedAction =
        action || httpMethodToAction(req.method);

      console.log(
        `[PEP] Checking policy: role=${role}, resource=${resource}, action=${resolvedAction}`
      );

      const allowed = await e.enforce(role, resource, resolvedAction);

      if (!allowed) {
        return next(
          new AuthorizationError(
            `Access denied. Role '${role}' cannot perform '${resolvedAction}' on '${resource}'`
          )
        );
      }

      next();
    } catch (error) {
      console.error("[PEP] Policy enforcement error:", error);
      next(error);
    }
  };
};

const httpMethodToAction = (method) => {
  const map = {
    GET: "read",
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };
  return map[method.toUpperCase()] || method.toLowerCase();
};

module.exports = { authenticate, authorize };
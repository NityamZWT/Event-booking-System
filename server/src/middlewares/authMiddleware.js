const path = require("path");
const { newEnforcer } = require("casbin");
const { verifyToken } = require("../utils/jwtHelper");
const { AuthenticationError, AuthorizationError } = require("../utils/errors");

const MODEL_PATH = path.join(__dirname, "../../policies/model.conf");
const POLICY_PATH = path.join(__dirname, "../../policies/policy.csv");

let enforcerInstance = null;
const getEnforcer = async () => {
  if (!enforcerInstance) {
    enforcerInstance = await newEnforcer(MODEL_PATH, POLICY_PATH);
  }
  return enforcerInstance;
};

const methodToAction = (method) => {
  const map = {
    GET:    "read",
    POST:   "create",
    PUT:    "update",
    PATCH:  "update",
    DELETE: "delete",
  };
  return map[method.toUpperCase()] || method.toLowerCase();
};


const extractResource = (req) => {
  const base = req.baseUrl || "";          
  const segments = base.split("/").filter(Boolean);
  return segments[segments.length - 1]; 
};

const authenticate = (req, res, next) => {
  try {
    const PUBLIC_GET_ROUTES = ["/api/events", "/api/events/"];
    const isPublicGet =
      PUBLIC_GET_ROUTES.includes(req.baseUrl) && req.method === "GET";

    const authHeader = req.headers.authorization || null;
    const hasToken = authHeader && authHeader.startsWith("Bearer ");

    if (isPublicGet && !hasToken) {
      return next(); // allow through without user
    }

    if (!hasToken) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.user = {
      id:    decoded.id,
      email: decoded.email,
      role:  decoded.role,  // e.g. "admin", "event_manager", "customer"
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


const authorize = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError("User not authenticated"));
      }

      const enforcer  = await getEnforcer();
      const role      = req.user.role;                // "admin"
      const resource  = extractResource(req);         // "events"
      const action    = methodToAction(req.method);   // "create"

      console.log(`[AUTHORIZE] role=${role} | resource=${resource} | action=${action}`);

      const allowed = await enforcer.enforce(role, resource, action);

      if (!allowed) {
        return next(
          new AuthorizationError(
            `Access denied: '${role}' cannot '${action}' on '${resource}'`
          )
        );
      }

      next();
    } catch (error) {
      console.error("[AUTHORIZE] Error:", error);
      next(error);
    }
  };
};

module.exports = { authenticate, authorize };
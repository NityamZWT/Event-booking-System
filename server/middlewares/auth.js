const jwt = require("jsonwebtoken");
require("dotenv").config();
const { responseHandler } = require("../utilities/customHandler");
const { UnAuthorizedResponse } = require("../utils/responseHandler");
const { AccessDeniedError } = require("sequelize");

const privatekey = process.env.JWT_PRIVATE_KEY;

//role based authentication and jwrt token verification
const authentication = (...Role) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization;
      console.log("token--", token);

      if (!token) {
        return new UnAuthorizedResponse(
          "User is not Authorized! please login first"
        );
      }
      const jwtToken = token.split(" ")[1];
      //verify token exist or not
      jwt.verify(jwtToken, privatekey, (err, decoded) => {
        if (err) {
          return new UnAuthorizedResponse(
            "User is not Authorized! please login first"
          );
        }
        //check if role has permission or not
        if (!Role.includes(decoded.role)) {
          return new AccessDeniedError(
            `you can't have access as ${decoded.role}!`
          );
        }

        req.user = decoded;
        console.log("userRole---", req.user.role);
        next();
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authentication;

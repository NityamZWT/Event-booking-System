const db = require("../models");
const { generateToken } = require("../utils/jwtHelper");
const { ConflictError, AuthenticationError } = require("../utils/errors");

const { User, sequelize } = db;

class AuthService {
  async register(userData) {
    return await sequelize.transaction(async (transaction) => {
      const existingUser = await User.findOne({
        where: { email: userData.email },
        transaction,
      });

      if (existingUser) {
        throw new ConflictError("User with this email already existss");
      }

      const user = await User.create(userData, { transaction });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const userResponse = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      };

      return {
        user: userResponse,
        token,
      };
    });
  }

  async login(credentials) {
    return await sequelize.transaction(async (transaction) => {
      const user = await User.findOne({
        where: { email: credentials.email },
        transaction,
      });

      if (!user) {
        throw new AuthenticationError("Invalid email or password");
      }

      const isPasswordValid = await user.comparePassword(credentials.password);

      if (!isPasswordValid) {
        throw new AuthenticationError("Invalid email or password");
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const userResponse = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      };

      return {
        user: userResponse,
        token,
      };
    });
  }
}

module.exports = new AuthService();

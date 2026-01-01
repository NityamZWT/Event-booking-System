const usersService = require("../services/usersService");
const {
  SuccessResponse
} = require("../utils/responseHandler");

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;

    const result = await usersService.getUsers(page, limit, role);

    return new SuccessResponse("Users retrieved successfully", result).send(
      res
    );
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await usersService.getUserById(userId);

    return new SuccessResponse("User retrieved successfully", user).send(res);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const result = await usersService.deleteUser(
      userId,
      currentUserId,
      currentUserRole
    );

    return new SuccessResponse(result.message).send(res);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { role: newRole } = req.body;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const user = await usersService.updateUserRole(
      userId,
      newRole,
      currentUserId,
      currentUserRole
    );

    return new SuccessResponse("User role updated successfully", user).send(
      res
    );
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await usersService.getUserById(userId);

    return new SuccessResponse(
      "Current user retrieved successfully",
      user
    ).send(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  deleteUser,
  updateUserRole,
  getCurrentUser,
  getCurrentUser
}
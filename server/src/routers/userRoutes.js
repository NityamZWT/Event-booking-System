const express = require("express");
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { UserRole } = require("../constants/common.types");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getUsers
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.deleteUser
);
router.patch("/:id/role", authenticate, authorize(UserRole.ADMIN), userController.updateUserRole)
router.get("/:id", authenticate, authorize(UserRole.ADMIN), userController.getUserById)

module.exports = router;

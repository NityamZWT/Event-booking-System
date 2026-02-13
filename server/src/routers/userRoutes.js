const express = require("express");
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/",          authenticate, authorize(), userController.getUsers);
router.delete("/:id",    authenticate, authorize(), userController.deleteUser);
router.patch("/:id/role", authenticate, authorize(), userController.updateUserRole);
router.get("/:id",       authenticate, authorize(), userController.getUserById);

module.exports = router;
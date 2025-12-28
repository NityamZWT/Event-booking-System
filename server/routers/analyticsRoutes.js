const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { UserRole } = require("../types/common.types");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EVENT_MANAGER),
  analyticsController.getAnalytics
);

module.exports = router;

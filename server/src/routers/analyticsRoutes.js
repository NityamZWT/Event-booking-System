const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticate, authorize(), analyticsController.getAnalytics);

module.exports = router;
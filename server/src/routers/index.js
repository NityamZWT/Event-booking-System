const express = require("express");
const authRoutes = require("./authRoutes");
const eventRoutes = require("./eventRoutes");
const bookingRoutes = require("./bookingRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/bookings", bookingRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/users", userRoutes);

module.exports = router;

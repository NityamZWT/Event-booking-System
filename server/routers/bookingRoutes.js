const express = require("express");
const bookingController = require("../controllers/bookingController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { UserRole } = require("../types/common.types");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.CUSTOMER),
  bookingController.createBooking
);

router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.CUSTOMER),
  bookingController.getUserBookings
);

router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.CUSTOMER),
  bookingController.getBookingById
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.CUSTOMER),
  bookingController.cancelBooking
);

module.exports = router;

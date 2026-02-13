const express = require("express");
const bookingController = require("../controllers/bookingController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/",    authenticate, authorize(), bookingController.createBooking);
router.get("/",     authenticate, authorize(), bookingController.getUserBookings);
router.get("/:id",  authenticate, authorize(), bookingController.getBookingById);
router.delete("/:id", authenticate, authorize(), bookingController.cancelBooking);

module.exports = router;
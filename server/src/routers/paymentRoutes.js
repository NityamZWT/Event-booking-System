const express = require("express");
const paymentController = require("../controllers/paymentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", paymentController.productCreate);
router.post("/checkout-session", authenticate, authorize(), paymentController.createCheckoutSession);

module.exports = router;
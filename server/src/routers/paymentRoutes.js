const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController')
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/create', paymentController.productCreate);
router.post('/checkout-session', authenticate, paymentController.createCheckoutSession);

module.exports = router;
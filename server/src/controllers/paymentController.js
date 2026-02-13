const paymentService = require("../services/paymentService");
const { SuccessResponse } = require("../utils/responseHandler");

const productCreate = async (req, res, next) => {
    try {
        const {name, description, unit_amount, currency} = req.body;
        const result = await paymentService.createProduct(name, description, unit_amount, currency);
        return new SuccessResponse("Product with its price create successfully!", result).send(res);
    } catch (error) {
        next(error)
    }
}

const createCheckoutSession = async (req, res, next) => {
    try {
        const { event_id, quantity, attendee_name } = req.body;
        const result = await paymentService.checkoutSession(
          event_id,
          req.user.email,
          quantity,
          attendee_name
        );
        return new SuccessResponse("Checkout session created successfully", { url: result.url }).send(res);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    productCreate,
    createCheckoutSession
}
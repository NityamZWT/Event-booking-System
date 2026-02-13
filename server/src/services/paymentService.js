const {
  stripe,
  StripeProducts,
  StripePrices,
  StripeSessions,
} = require("../lib/stripe");
const db = require("../models");
const { Event } = db;
const { ConflictError } = require("../utils/errors");

class PaymentService {
  async createProduct(name, description, unit_amount, currency) {
    const stripeProduct = await StripeProducts.create({
      name: name,
      description: description,
    });

    const stripePrice = await StripePrices.create({
      unit_amount: unit_amount,
      currency: currency,
      recurring: {
        interval: "month",
      },
      product: stripeProduct.id,
    });

    return {
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    };
  }

  async checkoutSession(eventId, customerEmail, quantity, attendeeName) {
    const eventData = await Event.findByPk(eventId);
    
    if (!eventData) {
      throw new ConflictError("Event not found");
    }

    const stripeCheckoutSession = await StripeSessions.create({
      success_url: "http://app.example.com/bookings?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://app.example.com/events",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "inr",
            unit_amount_decimal: Math.round(eventData.ticket_price * 100),
            product_data: {
                name: eventData.title,
                description: eventData.description,
            }
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      metadata: {
        event_id: eventId.toString(),
        quantity: quantity.toString(),
        attendee_name: attendeeName,
      }
    });
    
    return stripeCheckoutSession;
  }

  async verifyPaymentSession(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      throw new ConflictError("Payment not completed");
    }

    return {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amount: session.amount_total,
      metadata: session.metadata
    };
  }
}

module.exports = new PaymentService();

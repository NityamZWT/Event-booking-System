const Stripe = require('stripe');
require('dotenv').config();
const STRIPE_KEY = process.env.STRIPE_KEY;
const stripe = Stripe(STRIPE_KEY)

module.exports={
    stripe,
    StripeProducts: stripe.products,
    StripePrices:stripe.prices,
    StripeSessions: stripe.checkout.sessions
}


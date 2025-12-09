// src/services/paymentService.js
import Stripe from "stripe";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout Session for a user
 * @param {string} userId - MongoDB user ID
 * @param {"monthly"|"yearly"} plan - subscription plan
 * @returns {Promise<string>} - session URL
 */
export const createCheckoutSession = async (userId, plan) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const priceId = plan === "yearly"
    ? process.env.STRIPE_PRICE_YEARLY
    : process.env.STRIPE_PRICE_MONTHLY;

  if (!priceId) throw new Error("Stripe price not configured");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
  });

  return session.url;
};

/**
 * Confirm a payment and upgrade the user
 * @param {string} sessionId - Stripe Checkout Session ID
 */
export const confirmPayment = async (sessionId) => {
  if (!sessionId) throw new Error("Session ID required");

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed yet");
  }

  const user = await User.findOne({ email: session.customer_email });
  if (!user) throw new Error("User not found");

  user.membership = "premium";
  user.premiumExpiresAt = null;

  user.addPremiumHistory({
    plan: session.line_items?.[0]?.price?.id || "unknown",
    start: new Date(),
    end: null,
    status: "active",
  });

  await user.save();
  return user;
};

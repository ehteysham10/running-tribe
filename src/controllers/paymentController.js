import Stripe from "stripe";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// -------------------------
// CREATE STRIPE CHECKOUT SESSION
// -------------------------
export const createCheckoutSession = asyncHandler(async (req, res) => {
  const user = req.user;
  const { plan } = req.body; // "monthly" or "yearly"

  const priceId = plan === "yearly"
    ? process.env.STRIPE_PRICE_YEARLY
    : process.env.STRIPE_PRICE_MONTHLY;

  if (!priceId) {
    return res.status(500).json({ message: "Stripe price not configured for this plan" });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.BACKEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BACKEND_URL}/payment-cancel`,
  });

  res.json({ url: session.url });
});

// -------------------------
// CONFIRM PAYMENT (optional API)
// -------------------------
export const confirmPayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) return res.status(400).json({ message: "Session ID required" });

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return res.status(400).json({ message: "Payment not completed yet" });
  }

  const user = await User.findOne({ email: session.customer_email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.membership = "premium";
  user.premiumExpiresAt = null;

  user.addPremiumHistory({
    plan: session.line_items?.[0]?.price?.id || "unknown",
    start: new Date(),
    end: null,
    status: "active",
  });

  await user.save();

  res.json({ message: "Membership upgraded to premium" });
});

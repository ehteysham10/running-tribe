
// src/models/User.js
import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be less than 50 characters"],
      default: "New User",
    },
    nickname: {
      type: String,
      trim: true,
      minlength: [2, "Nickname must be at least 2 characters"],
      maxlength: [30, "Nickname must be less than 30 characters"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Email must be valid"],
    },
    password: {
      type: String,
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true },
    avatar: String,
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },

    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female"], required: false },

    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    isAdmin: { type: Boolean, default: false },
    fcmToken: { type: String, default: null },

    /* ===============================
       🚀 MEMBERSHIP
       =============================== */
    membership: {
      type: String,
      enum: ["basic", "premium"],
      default: "basic",
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },

    premiumHistory: [
      {
        subscriptionId: String,
        plan: String,
        start: Date,
        end: Date,
        status: { type: String, enum: ["active", "cancelled", "expired"], default: "active" },
      },
    ],

    // Offline and daily limits
    offlineDownloads: { type: Number, default: 0 },
    dailyPostCount: { type: Number, default: 0 },
    dailyPostResetAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* -----------------------------
   Reset daily post count if expired
----------------------------- */
userSchema.methods.resetDailyPostCountIfNeeded = function () {
  const now = new Date();
  if (now - this.dailyPostResetAt >= 24 * 60 * 60 * 1000) {
    this.dailyPostCount = 0;
    this.dailyPostResetAt = now;
  }
};

/* -----------------------------
   Increment daily post count safely
----------------------------- */
userSchema.methods.incrementDailyPostCount = function () {
  this.resetDailyPostCountIfNeeded();
  this.dailyPostCount += 1;
  return this.dailyPostCount;
};

/* -----------------------------
   Premium history helpers
   Automatically maps Stripe priceId to "monthly"/"yearly"
----------------------------- */
userSchema.methods.addPremiumHistory = function ({ subscriptionId = null, plan, start, end, status = "active" }) {
  // Map Stripe priceId to readable plan
  const planMap = {
    [process.env.STRIPE_PRICE_MONTHLY]: "monthly",
    [process.env.STRIPE_PRICE_YEARLY]: "yearly",
  };

  const readablePlan = planMap[plan] || plan || "unknown";

  this.premiumHistory.push({
    subscriptionId,
    plan: readablePlan,
    start,
    end,
    status,
  });
};

userSchema.methods.closePremiumHistory = function (subscriptionId, endDate = new Date(), status = "cancelled") {
  const idx = this.premiumHistory.findIndex(h => h.subscriptionId === subscriptionId && h.status === "active");
  if (idx !== -1) {
    this.premiumHistory[idx].end = endDate;
    this.premiumHistory[idx].status = status;
  }
};

/* -----------------------------
   Password reset
----------------------------- */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

/* -----------------------------
   Email verification
----------------------------- */
userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

export default mongoose.models.User || mongoose.model("User", userSchema);

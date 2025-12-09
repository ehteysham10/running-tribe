
// src/controllers/authController.js
import bcrypt from "bcrypt";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { strongPassword } from "../utils/passwordValidator.js";
import { sendEmail } from "../services/emailService.js";
import { signToken, hashToken } from "../services/tokenService.js";

const SALT_ROUNDS = 10;

// ============================================
// REGISTER USER
// ============================================
export const register = asyncHandler(async (req, res) => {
  let { name, email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  email = email.trim().toLowerCase();

  if (!strongPassword(password))
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
    });

  const exists = await User.findOne({ email });

  if (exists && exists.emailVerified)
    return res.status(400).json({ message: "Email already registered" });

  if (exists && !exists.emailVerified) await User.deleteOne({ email });

  name = name?.trim() || "New User";
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = new User({ name, email, password: hashed, emailVerified: false });
  const emailToken = user.createEmailVerificationToken();
  await user.save();

  const verifyURL = `${req.protocol}://${req.get(
    "host"
  )}/api/auth/verify-email/${emailToken}`;

  sendEmail(
    user.email,
    "Verify Your Email",
    `<p>Hi ${user.name},</p>
     <p>Please verify your email:</p>
     <p><a href="${verifyURL}">${verifyURL}</a></p>`
  ).catch(err => console.error("EMAIL SEND ERROR:", err));

  const token = signToken(user);

  res.status(201).json({
    message: "User registered successfully. Verification email sent.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || "",
      bio: user.bio || "",
      location: user.location || "",
      emailVerified: user.emailVerified,
    },
  });
});

// ============================================
// VERIFY EMAIL
// ============================================
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ message: "Token required" });

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Token is invalid or expired" });

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
});

// ============================================
// LOGIN USER
// ============================================
export const login = asyncHandler(async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  email = email.trim().toLowerCase();

  const user = await User.findOne({ email }).select("+password +emailVerified");
  if (!user || !user.password)
    return res.status(400).json({ message: "Invalid credentials" });

  if (!user.emailVerified)
    return res.status(400).json({ message: "Email not verified" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || "",
      bio: user.bio || "",
      location: user.location || "",
      emailVerified: user.emailVerified,
    },
  });
});

// ============================================
// UPDATE PASSWORD
// ============================================
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Current and new passwords required" });

  if (!strongPassword(newPassword))
    return res.status(400).json({
      message:
        "New password must include uppercase, lowercase, number, and special character",
    });

  const user = await User.findById(req.user._id).select("+password");
  if (!user.password)
    return res.status(400).json({ message: "OAuth users cannot update password" });

  const matchCurrent = await bcrypt.compare(currentPassword, user.password);
  if (!matchCurrent) return res.status(400).json({ message: "Current password incorrect" });

  if (await bcrypt.compare(newPassword, user.password))
    return res.status(400).json({ message: "New password cannot be same as old password" });

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  const time = new Date().toLocaleString();
  sendEmail(
    user.email,
    "Your Password Was Changed",
    `<p>Hi ${user.name},</p>
     <p>Your password was updated on:</p>
     <strong>${time}</strong>
     <p>If you did not perform this action, reset your password immediately.</p>`
  ).catch(err => console.error("Password change email error:", err));

  res.json({ message: "Password updated successfully" });
});

// ============================================
// FORGOT PASSWORD
// ============================================
export const forgotPassword = asyncHandler(async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  email = email.trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "No user found with this email" });

  if (user.resetPasswordExpires && user.resetPasswordExpires > Date.now())
    return res.status(400).json({
      message: "OTP already sent. Please wait before requesting again.",
    });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordToken = hashToken(otp);
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  sendEmail(
    user.email,
    "Your Password Reset Code",
    `<p>Hi ${user.name},</p>
     <p>Your reset code:</p>
     <h2>${otp}</h2>
     <p>Valid for 10 minutes.</p>`
  ).catch(err => console.error("Forgot password email error:", err));

  res.json({ message: "Password reset OTP sent to email" });
});

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) return res.status(400).json({ message: "Reset token required" });
  if (!newPassword) return res.status(400).json({ message: "New password is required" });

  if (!strongPassword(newPassword))
    return res.status(400).json({
      message:
        "Password must include uppercase, lowercase, number, and special character",
    });

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) return res.status(400).json({ message: "Token invalid or expired" });

  if (await bcrypt.compare(newPassword, user.password))
    return res.status(400).json({ message: "New password cannot be same as previous password" });

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

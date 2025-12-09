// src/services/tokenService.js
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Sign a JWT token for a user
 * @param {Object} user User object
 * @returns {string} JWT token
 */
export const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * Generate a random crypto token (hex)
 * @param {number} size Number of bytes, default 32
 * @returns {string} hex string
 */
export const generateToken = (size = 32) => {
  return crypto.randomBytes(size).toString("hex");
};

/**
 * Hash a token using SHA-256
 * @param {string} token
 * @returns {string} hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

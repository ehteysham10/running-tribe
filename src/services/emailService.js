// src/services/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} html HTML content
 */
export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Running Tribe" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

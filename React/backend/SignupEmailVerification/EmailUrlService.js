import nodemailer from 'nodemailer';
import crypto from 'crypto';
import "../config.js"

// This will hold token → user data temporarily (in-memory for now)
export const pendingSignups = new Map();

export async function sendSignupVerificationEmail(userData) {
  const { email, username, hashedPassword, phone } = userData;

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');

  // Store userData with expiration (15 min)
  pendingSignups.set(token, {
    username,
    email,
    hashedPassword,
    phone,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  const verificationLink = `http://localhost:5001/api/verify-signup?token=${token}`;

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  const mailOptions = {
    from: `"MANO ERP" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: 'Verify your MANO account',
    html: `
      <h2>Hi ${username}!</h2>
      <h4>Your Phone: ${phone} </h4>
      <p>Thanks for signing up. Please click the link below to verify your email and complete your signup:</p>
      <a href="${verificationLink}" target="_blank">Verify My Email</a>
      <p>This link will expire in 15 minutes.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, token };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    pendingSignups.delete(token); // Clean up if failed
    return { success: false, error };
  }
}
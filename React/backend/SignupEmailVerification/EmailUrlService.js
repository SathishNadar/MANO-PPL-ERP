import nodemailer from 'nodemailer';
import crypto from 'crypto';
import "../config.js"
import { google } from 'googleapis';


const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

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

  const verificationLink = `http://${process.env.URI}:${process.env.PORT}/api/verify-signup?token=${token}`;

  // Configure nodemailer transporter with OAuth2
  const accessToken = await oAuth2Client.getAccessToken();

  if (!accessToken || !accessToken.token) {
    console.error("🚨 No access token generated.");
    return { success: false, message: "OAuth2 token generation failed" };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  const mailOptions = {
    from: `"MANO ERP" <${process.env.GMAIL_USER}>`,
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
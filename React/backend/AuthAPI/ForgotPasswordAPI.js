import express from 'express'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import emailService from '../ForgotpasswordVerification/EmailService.js'
import * as db from '../Database.js';

const router = express.Router();

// Rate limiting
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many password reset attempts, please try again later.' },
});

const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many OTP verification attempts, please try again later.' },
});

// In-memory storage for OTP (use Redis in production)
const otpStore = new Map();

// Clean up expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

//Step 0: Get Email from UserName
router.post('/get-email', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Lookup user by username
    const user = await db.r_fetchUserByName(username);
    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ success: true, email: 'admin@mano.co.in' });
    }

    res.json({ success: true, email: user.email });
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Step 1: Send OTP to email
router.post('/send-otp', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;


    // Check if user exists
    const user = await db.r_fetchUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If this email exists, you will receive a verification code.' 
      });
    }

    // Generate OTP
    const otp = emailService.generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, {
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0,
      userId: user.id,
    });

    // Send OTP email
    const emailResult = await emailService.sendOTP(email, otp);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Verification code sent to your email',
        expiresIn: 600, // 10 minutes in seconds
      });
    } else {
      res.status(500).json({ error: 'Failed to send verification code' });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Step 2: Verify OTP
router.post('/verify-otp', otpVerificationLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    // Check if OTP exists
    const otpData = otpStore.get(email);
    if (!otpData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Too many invalid attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts++;
      otpStore.set(email, otpData);
      return res.status(400).json({ 
        error: 'Invalid verification code',
        attemptsLeft: 3 - otpData.attempts 
      });
    }

    // OTP is valid, mark as verified
    otpData.verified = true;
    otpData.verifiedAt = Date.now();
    otpStore.set(email, otpData);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: emailService.generateResetToken(),
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Step 3: Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if OTP was verified
    const otpData = otpStore.get(email);
    if (!otpData || !otpData.verified) {
      return res.status(400).json({ error: 'OTP verification required' });
    }

    // Check if verification is still valid (within 30 minutes)
    if (Date.now() > otpData.verifiedAt + 30 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Verification expired. Please start over.' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await db.updateUserPassword(email, hashedPassword);

    // Clear OTP from store
    otpStore.delete(email);

    // Send confirmation email
    await emailService.sendPasswordResetConfirmation(email);

    // // Log security event
    // await db.logSecurityEvent(otpData.userId, 'password_reset', {
    //   timestamp: new Date().toISOString(),
    //   ip: req.ip,
    //   userAgent: req.get('User-Agent'),
    // });

    res.json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
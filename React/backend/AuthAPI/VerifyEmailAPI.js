import express from 'express';
import bcrypt from 'bcrypt';
import { sendSignupVerificationEmail, pendingSignups } from '../SignupEmailVerification/EmailUrlService.js';
import '../config.js'; // makes sure .env is loaded
import { insertUser, checkUserExists } from '../Database.js'; // you'd write this in your DB module

const router = express.Router();

// === [1] Signup route — Initiates email verification ===
router.post('/start-signup', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const exists = await checkUserExists(email, phone);
    if (exists) {
      return res.status(400).json({ error: 'Email or phone already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await sendSignupVerificationEmail({ email, username, hashedPassword, phone });

    if (result.success) {
      return res.json({ success: true, message: 'Verification link sent to your email.' });
    } else {
      console.error('Email sending failed:', result.error || result);
      return res.status(500).json({ error: 'Failed to send verification email.' });
    }

  } catch (error) {
    console.error('Signup initiation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === [2] Email click route — Finalize signup ===
router.get('/verify-signup', async (req, res) => {
  try {
    const { token } = req.query;
  
    const userData = pendingSignups.get(token);
    if (!userData) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    if (Date.now() > userData.expiresAt) {
      pendingSignups.delete(token);
      return res.status(400).send('Link expired. Please sign up again.');
    }

    // Save user to DB
    const { email, username, hashedPassword, phone } = userData;
    const insertSuccess = await insertUser(username, email, hashedPassword, phone);

    if (!insertSuccess) {
      return res.status(500).send('Failed to create account. Please try again.');
    }

    // console.log(`✅ User ${username} successfully inserted into DB`);
    pendingSignups.delete(token);

    res.send('✅ Your account has been created. You can now log in!');

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('Something went wrong.');
  }
});

export default router; 
import nodemailer from 'nodemailer';
import crypto from 'crypto'

import dotenv from 'dotenv'
dotenv.config()
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASSWORD, // your app password
      },
    });
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send OTP email
  async sendOTP(email, otp) {
    const mailOptions = {
      from: {
        name: 'Your App Name',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Password Reset - Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 30px;
              text-align: center;
              color: white;
            }
            .otp-code {
              background: rgba(255, 255, 255, 0.2);
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              backdrop-filter: blur(10px);
            }
            .warning {
              background: rgba(255, 193, 7, 0.2);
              border: 1px solid rgba(255, 193, 7, 0.5);
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🔒 Password Reset Request</h2>
            <p>We received a request to reset your password. Use the verification code below to proceed:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
              <p>&copy; 2024 Your App Name. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
  await new Promise((resolve, reject) => {
    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) return reject(error);
      resolve(info);
    });
  });
  return { success: true, message: 'OTP sent successfully' };
} catch (error) {
  console.error('Email sending error:', error);
  return { success: false, message: 'Failed to send OTP' };
}
  }

  // Send password reset confirmation email
  async sendPasswordResetConfirmation(email) {
    const mailOptions = {
      from: {
        name: 'MANO Projects Consultant Private Limited',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #48bb78, #38a169);
              border-radius: 10px;
              padding: 30px;
              text-align: center;
              color: white;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .info-box {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              backdrop-filter: blur(10px);
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h2>Password Reset Successful!</h2>
            <p>Your password has been successfully updated.</p>
            
            <div class="info-box">
              <p><strong>What's Next?</strong></p>
              <p>You can now log in to your account using your new password.</p>
              <p>Reset completed on: ${new Date().toLocaleString()}</p>
            </div>
            
            <p>If you didn't make this change, please contact our support team immediately.</p>
            
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
              <p>&copy; 2024 Your App Name. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
  await new Promise((resolve, reject) => {
    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) return reject(error);
      resolve(info);
    });
  });
  return { success: true, message: 'Confirmation email sent' };
} catch (error) {
  console.error('Email sending error:', error);
  return { success: false, message: 'Failed to send confirmation email' };
}
  }
}

export default new EmailService();
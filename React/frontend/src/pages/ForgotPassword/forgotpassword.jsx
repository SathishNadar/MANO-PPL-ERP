import React, { useState, useRef, useEffect } from 'react';
import './forgotpassword.css';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: code verification, 3: new password
  const [isEmailDisabled, setIsEmailDisabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [subtitle, setSubtitle] = useState("Enter your email address and we'll send you a verification code");
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  const codeRefs = useRef([]);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    // Initialize refs array
    codeRefs.current = codeRefs.current.slice(0, 6);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (step === 1) {
        await handleSendOTP();
      } else if (step === 2) {
        await handleVerifyOTP();
      } else if (step === 3) {
        await handleResetPassword();
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      throw new Error('Please enter your email address');
    }

    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send verification code');
    }

    // Disable email input
    setIsEmailDisabled(true);
    
    // Update step
    setStep(2);
    
    // Update subtitle
    setSubtitle('Enter the 6-digit verification code sent to your email');
    
    // Focus first code input
    setTimeout(() => {
      if (codeRefs.current[0]) {
        codeRefs.current[0].focus();
      }
    }, 100);
  };

  const handleVerifyOTP = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      throw new Error('Please enter the complete 6-digit verification code');
    }

    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.trim(), 
        otp: codeString 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.attemptsLeft !== undefined) {
        setAttemptsLeft(data.attemptsLeft);
      }
      throw new Error(data.error || 'Invalid verification code');
    }

    // Store reset token
    setResetToken(data.resetToken);
    
    // Move to password step
    setStep(3);
    setSubtitle('Create your new password');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.trim(),
        newPassword,
        confirmPassword
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    // Show success message
    setShowSuccess(true);
    setSubtitle('Password reset completed successfully!');
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      window.location.href = '/login'; // Replace with your login route
    }, 3000);
  };

  const handleCodeChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Move to next input if current is filled
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        const newCode = [...code];
        digits.split('').forEach((digit, i) => {
          if (i < 6) {
            newCode[i] = digit;
          }
        });
        setCode(newCode);
        if (digits.length === 6) {
          codeRefs.current[5]?.focus();
        }
      });
    }
  };

  const getButtonText = () => {
    switch (step) {
      case 1:
        return 'Send Verification Code';
      case 2:
        return 'Verify Code';
      case 3:
        return 'Reset Password';
      default:
        return 'Submit';
    }
  };

  return (
    <div className="password-reset-container">
      <div className="container2">
        <div className="header2">
          <div className="icon">🔒</div>
          <h1>Reset Password</h1>
          <p className="subtitle">{subtitle}</p>
        </div>

        {!showSuccess ? (
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEmailDisabled}
                required
                placeholder="Enter your email address"
              />
            </div>

            {step === 2 && (
              <div className={`form-group ${step === 2 ? 'show' : 'hidden'}`}>
                <label htmlFor="code">Verification Code</label>
                <div className="code-input">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      className="code-digit"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      ref={(el) => (codeRefs.current[index] = el)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={`form-group ${step === 3 ? 'show' : 'hidden'}`}>
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                />
              </div>
            )}

            {step === 3 && (
              <div className={`form-group ${step === 3 ? 'show' : 'hidden'}`}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                />
                {passwordError && <div className="error-message">{passwordError}</div>}
              </div>
            )}

            <button type="submit" className="submit-btn">
              {getButtonText()}
            </button>
          </form>
        ) : (
          <div className="success-message show">
            <div className="success-icon">✓</div>
            <div className="success-text">
              <h3>Password Reset Successful!</h3>
              <p>Your password has been updated successfully.</p>
              <p>Redirecting to login page in 3 seconds...</p>
            </div>
          </div>
        )}

        <div className="back-link">
          <a href="/login">← Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
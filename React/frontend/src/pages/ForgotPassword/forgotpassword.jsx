import React, { useState, useRef, useEffect } from "react";
import "./forgotpassword.css";

const PasswordReset = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const [isUsernameDisabled, setIsUsernameDisabled] = useState(false);
  const [subtitle, setSubtitle] = useState("Enter your username to reset password");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const codeRefs = useRef([]);

  const API_BASE_URL = "http://localhost:5001/api";

  useEffect(() => {
    codeRefs.current = codeRefs.current.slice(0, 6);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (step === 1) {
        await handleFetchEmailAndSendOTP();
      } else if (step === 2) {
        await handleVerifyOTP();
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchEmailAndSendOTP = async () => {
    if (!username.trim()) {
      throw new Error("Please enter your username");
    }

    // 1. Fetch email from backend
    const emailRes = await fetch(`${API_BASE_URL}/get-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok || !emailData.email) {
      throw new Error(emailData.error || "Failed to fetch email");
    }

    const fetchedEmail = emailData.email;
    setEmail(fetchedEmail);

    // 2. Send OTP to that email
    const otpRes = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fetchedEmail }),
    });

    const otpData = await otpRes.json();
    if (!otpRes.ok) {
      throw new Error(otpData.error || "Failed to send verification code");
    }

    // 3. Update UI
    setIsUsernameDisabled(true);
    setStep(2);
    setSubtitle(`A 6-digit code has been sent to ${fetchedEmail}`);
    setTimeout(() => {
      if (codeRefs.current[0]) codeRefs.current[0].focus();
    }, 100);
  };

  const handleVerifyOTP = async () => {
    const codeString = code.join("");
    if (codeString.length !== 6) {
      throw new Error("Please enter the complete 6-digit code");
    }

    const res = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: codeString }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.attemptsLeft !== undefined) setAttemptsLeft(data.attemptsLeft);
      throw new Error(data.error || "Invalid verification code");
    }

    setStep(3);
    setSubtitle("Verification successful! Now set your new password.");
  };

  const handleResetPassword = async () => {
  if (newPassword.length < 8) {
    setError("Password must be at least 8 characters long");
    return;
  }
  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  setError("");
  setIsLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reset password");
    }

    setShowSuccess(true);
    setSubtitle("Password reset completed successfully!");

    setTimeout(() => {
      window.location.href = "/login";
    }, 3000);
  } catch (err) {
    setError(err.message || "An error occurred");
  } finally {
    setIsLoading(false);
  }
};

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const getButtonText = () => {
    if (step === 1) return "Send Verification Code";
    if (step === 2) return "Verify Code";
    return "Next";
  };

  return (
  <div className="password-reset-container">
    <div className="container2">
      <div className="header2">
        <div className="icon">🔒</div>
        <h1>Reset Password</h1>
        <p className="subtitle">{subtitle}</p>
      </div>

      {/* STEP 1 & 2 FORM */}
      {(step === 1 || step === 2) && (
        <form onSubmit={handleFormSubmit}>
          {error && <div className="error-message">{error}</div>}

          {step === 1 && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isUsernameDisabled}
                placeholder="Enter your username"
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="form-group">
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
              {attemptsLeft < 3 && (
                <small>{attemptsLeft} attempts left</small>
              )}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Please wait..." : getButtonText()}
          </button>
        </form>
      )}

      {/* STEP 3 PASSWORD RESET */}
      {step === 3 && !showSuccess && (
        <div className="form-group">
          {error && <div className="error-message">{error}</div>}

          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />


          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <button
            type="button"
            className="submit-btn"
            onClick={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Reset Password"}
          </button>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {showSuccess && (
        <div className="success-message">
          🎉 Password has been reset successfully! Redirecting to login...
        </div>
      )}

      <div className="back-link">
        <a href="/login">← Back to Login</a>
      </div>
    </div>
  </div>
)};

export default PasswordReset;
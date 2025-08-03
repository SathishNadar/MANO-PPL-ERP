import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const API_URI = import.meta.env.VITE_API_URI;
  const PORT = import.meta.env.VITE_BACKEND_PORT

  const navigate = useNavigate()
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
    const emailRes = await fetch(`http://${API_URI}:${PORT}/api/get-email`, {
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
    const otpRes = await fetch(`http://${API_URI}:${PORT}/api/send-otp`, {
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

    const res = await fetch(`http://${API_URI}:${PORT}/api/verify-otp`, {
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
    const response = await fetch(`http://${API_URI}:${PORT}/api/reset-password`, {
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
    navigate("/auth");
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
  <div className="forgot-password bg-gray-900 min-h-screen flex items-center justify-center p-4">
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
      <div className="flex flex-col items-center mb-6">
        <div className="text-4xl mb-2">🔒</div>
        <h1 className="text-white text-2xl font-semibold mb-1">Reset Password</h1>
        <p className="text-gray-400 text-center">{subtitle}</p>
      </div>

      {/* STEP 1 & 2 FORM */}
      {(step === 1 || step === 2) && (
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

          {step === 1 && (
            <div className="flex flex-col">
              <label htmlFor="username" className="text-gray-400 mb-1">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isUsernameDisabled}
                placeholder="Enter your username"
                required
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col">
              <label htmlFor="code" className="text-gray-400 mb-1">Verification Code</label>
              <div className="flex gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    ref={(el) => (codeRefs.current[index] = el)}
                    className="bg-gray-700 text-white border border-gray-600 rounded-lg w-12 h-12 text-center text-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
              </div>
              {attemptsLeft < 3 && (
                <small className="text-red-400 mt-1">{attemptsLeft} attempts left</small>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 mt-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Please wait..." : getButtonText()}
          </button>
        </form>
      )}

      {/* STEP 3 PASSWORD RESET */}
      {step === 3 && !showSuccess && (
        <div className="flex flex-col gap-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <label htmlFor="newPassword" className="text-gray-400">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <label htmlFor="confirmPassword" className="text-gray-400">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 mt-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Please wait..." : "Reset Password"}
          </button>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {showSuccess && (
        <div className="text-green-400 text-center mt-6 text-lg">
          🎉 Password has been reset successfully! Redirecting to login...
        </div>
      )}

      <div className="mt-6 text-center">
        <a href="/auth" className="text-blue-500 hover:underline">← Back to Login</a>
      </div>
    </div>
  </div>
)};

export default PasswordReset;
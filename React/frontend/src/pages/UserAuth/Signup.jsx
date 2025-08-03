import React, { useState } from "react";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const countryCodes = [
  { code: "+1", label: "US" },
  { code: "+44", label: "UK" },
  { code: "+91", label: "IN" },
  { code: "+61", label: "AU" },
  { code: "+81", label: "JP" },
];

const Signup = ({ onSwitch }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    countryCode: "+91",
    phone: "",
  });

  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    noSpaces: true,
  });

  const validatePassword = (password) => {
    setPasswordValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: true,
      noSpaces: !/\s/.test(password),
    });
  };

  const handlePasswordChange = (value) => {
    setSignupData({ ...signupData, password: value });
    validatePassword(value);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword, countryCode, phone } = signupData;
    const trimmedUsername = username.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password and Confirm Password do not match.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (
      !passwordValidations.length ||
      !passwordValidations.uppercase ||
      !passwordValidations.lowercase ||
      !passwordValidations.number ||
      !passwordValidations.noSpaces
    ) {
      toast.error("Please ensure your password meets the required criteria.");
      return;
    }

    try {
      const response = await fetch(`http://${API_URI}:${PORT}/api/start-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, email, password, phone: countryCode + phone }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Verification email has been sent to your email address.");
        setTimeout(() => {
          if (onSwitch) onSwitch("login");
        }, 2000);
      } else {
        toast.error(data.error || "Signup failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Signup failed. Try again.");
    }
  };

  return (
    <div className="signup-bg bg-gray-900 flex justify-center items-center min-h-screen font-sans">
      <div className="signup-card bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="signup-title text-white text-3xl font-bold mb-8 text-center">User Sign Up</h1>
        <form onSubmit={handleSignup}>
          <div className="signup-field mb-4">
            <input
              type="text"
              placeholder="Username"
              required
              value={signupData.username}
              onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
              className="signup-input w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="signup-field mb-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              className="signup-input w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="signup-field mb-4 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={signupData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="signup-input w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span
              className="signup-eye material-icons absolute right-3 top-3 text-gray-400 cursor-pointer select-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "visibility_off" : "visibility"}
            </span>
            {passwordFocused && (
              <div className="absolute z-10 top-full mt-1 left-0 w-full bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg">
                <p className={`flex items-center mb-1 ${passwordValidations.length ? "text-green-400" : "text-red-400"}`}>
                  <span className="material-icons mr-1" style={{ fontSize: "16px" }}>
                    {passwordValidations.length ? "check_circle" : "cancel"}
                  </span>
                  At least 8 characters
                </p>
                <p className={`flex items-center mb-1 ${passwordValidations.uppercase ? "text-green-400" : "text-red-400"}`}>
                  <span className="material-icons mr-1" style={{ fontSize: "16px" }}>
                    {passwordValidations.uppercase ? "check_circle" : "cancel"}
                  </span>
                  At least one uppercase letter
                </p>
                <p className={`flex items-center mb-1 ${passwordValidations.lowercase ? "text-green-400" : "text-red-400"}`}>
                  <span className="material-icons mr-1" style={{ fontSize: "16px" }}>
                    {passwordValidations.lowercase ? "check_circle" : "cancel"}
                  </span>
                  At least one lowercase letter
                </p>
                <p className={`flex items-center mb-1 ${passwordValidations.number ? "text-green-400" : "text-red-400"}`}>
                  <span className="material-icons mr-1" style={{ fontSize: "16px" }}>
                    {passwordValidations.number ? "check_circle" : "cancel"}
                  </span>
                  At least one number
                </p>
                <p className={`flex items-center ${passwordValidations.noSpaces ? "text-green-400" : "text-red-400"}`}>
                  <span className="material-icons mr-1" style={{ fontSize: "16px" }}>
                    {passwordValidations.noSpaces ? "check_circle" : "cancel"}
                  </span>
                  No spaces
                </p>
              </div>
            )}
          </div>
          <div className="signup-field mb-4 relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              required
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
              className="signup-input w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span
              className="signup-eye material-icons absolute right-3 top-3 text-gray-400 cursor-pointer select-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </div>
          <div className="signup-field mb-6 flex space-x-2 items-center">
            <select
              value={signupData.countryCode}
              onChange={(e) => setSignupData({ ...signupData, countryCode: e.target.value })}
              className="bg-gray-700 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Country code"
            >
              {countryCodes.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label} ({code})
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Phone Number"
              required
              value={signupData.phone}
              onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
              className="signup-input flex-grow px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="signup-btn w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out mb-6"
          >
            Sign Up
          </button>
        </form>
        <div className="signup-links flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={() => onSwitch && onSwitch("login")}
            className="signup-link text-blue-400 hover:text-blue-300 transition duration-300 ease-in-out"
          >
            Already have an account?
          </button>
          <button
            type="button"
            onClick={() => onSwitch && onSwitch("forgot")}
            className="signup-link text-blue-400 hover:text-blue-300 transition duration-300 ease-in-out"
          >
            Forgot Password?
          </button>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default Signup;
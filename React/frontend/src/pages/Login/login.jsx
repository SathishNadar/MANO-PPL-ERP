// LoginSignup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URI } from "../ip.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./login.css";

const countryCodes = [
  { code: "+91", label: "India" },
  { code: "+1", label: "USA" },
  { code: "+44", label: "UK" },
  { code: "+61", label: "Australia" },
  { code: "+81", label: "Japan" },
];

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    countryCode: "+91",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = localStorage.getItem("session");
    if (sessionData) {
      const { expiry } = JSON.parse(sessionData);
      if (Date.now() < expiry) {
        navigate("/dashboard");
      } else {
        localStorage.removeItem("session");
      }
    }
  }, []);

  const setSession = (username, userid) => {
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const sessionData = { username, expiry: expiryTime, user_id: userid };
    localStorage.setItem("session", JSON.stringify(sessionData));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginData.password.includes(" ")) {
      toast.error("Password cannot contain spaces.");
      return;
    }

    try {
      const response = await fetch(`http://${API_URI}:3000/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: loginData.username.trim(),
          user_password: loginData.password,
        }),
      });

      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      const data = await response.json();

      if (data.message === "Login successful") {
        const userid = data["user_data"]["user_id"];
        setSession(loginData.username, userid);
        toast.success("Login successful!");
        setTimeout(() => navigate("/dashboard"), 1200);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const { username, email, password, confirmPassword, phone, countryCode } = signupData;
    const trimmedUsername = username.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (password.includes(" ")) {
      toast.error("Password cannot contain spaces.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`http://${API_URI}:3000/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: trimmedUsername,
          user_password: password,
          email,
          phone_no: `${countryCode} ${phone}`,
        }),
      });

      const data = await response.json();
      if (data.message === "Signup successful") {
        toast.success("Signup successful! Please log in.");
        setIsSignup(false);
      } else {
        toast.error(data.message || "Signup failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Signup failed. Try again.");
    }
  };

  return (
    <div className="login-page-wrapper">
      <ToastContainer />
      <div className="container">
        <div className="header">
          <div className="header-cont">
            {isSignup ? "USER SIGN UP" : "USER LOGIN"}
          </div>
        </div>

        <div className={`form-slider ${isSignup ? "move" : ""}`}>
          {/* Login Form */}
          <div className="login-form">
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                required
              />

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>

              <input type="submit" value="Login" />
            </form>
          </div>

          {/* Signup Form */}
          <div className="signup-form">
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Username"
                value={signupData.username}
                onChange={(e) =>
                  setSignupData({ ...signupData, username: e.target.value })
                }
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>

              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData({
                      ...signupData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>

              <div className="phone-wrapper">
                <select
                  value={signupData.countryCode}
                  onChange={(e) =>
                    setSignupData({ ...signupData, countryCode: e.target.value })
                  }
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.code})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={signupData.phone}
                  onChange={(e) =>
                    setSignupData({ ...signupData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <input type="submit" value="Sign Up" />
            </form>
          </div>
        </div>

        <div className="bottom">
          <button className="btn" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "ALREADY HAVE AN ACCOUNT?" : "DON'T HAVE AN ACCOUNT?"}
          </button>
          <button className="btn" id="forgot" onClick={() => navigate("/forgotpassword")}>
            Forgot Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;

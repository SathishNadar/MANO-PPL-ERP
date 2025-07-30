import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
const API_URI = import.meta.env.VITE_API_URI;
const LOCAL_API_URI = "http://localhost:5001/api";

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [passwordFocus, setPasswordFocus] = useState(false);
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
    countryCode: "91",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const passwordChecks = {
    length: signupData.password.length >= 8,
    upper: /[A-Z]/.test(signupData.password),
    lower: /[a-z]/.test(signupData.password),
    number: /[0-9]/.test(signupData.password),
    noSpace: !/\s/.test(signupData.password),
  };

  const allPasswordValid = () => Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    const sessionData = localStorage.getItem("session");
    if (sessionData) {
      const { expiry } = JSON.parse(sessionData);
      if (Date.now() < expiry) {
        navigate("/dashboard/home");
      } else {
        localStorage.removeItem("session");
      }
    }

    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) { fetch(`${LOCAL_API_URI}/verify-signup?token=${token}`)
        .then((res) => res.text())
        .then((msg) => toast.success(msg))
        .catch((err) => {
          console.error("Verification error:", err);
          toast.error("Verification failed.");
        });
    }
  }, [location]);

  const setSession = (username, user_id) => {
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const sessionData = { user_id ,username, expiry: expiryTime };
    localStorage.setItem("session", JSON.stringify(sessionData));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://${API_URI}:3000/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: loginData.username,
          user_password: loginData.password,
        }),
      });

      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      const data = await response.json();

      if (data.message === "Login successful") {
        setSession(data.user_data.user_name, data.user_data.user_id);
        toast.success("nice Bike")
        navigate("/dashboard/home");
      } else {
        toast.message(data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const { username, email, password, confirmPassword, phone, countryCode } =
      signupData;
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

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      const response = await fetch(`${LOCAL_API_URI}/start-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          email,
          password,
          phone,
          // phone: `${countryCode} ${phone}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Verification email has been sent to your email address.");
        setIsSignup(false);
      } else {
        toast.error(data.error || "Signup failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed. Try again.");
    }
  };

  const renderFloatingInput = (
    type,
    name,
    value,
    setValue,
    labelText,
    isPassword = false
  ) => (
    <div className="floating-label-input">
      <input
        type={isPassword && showPassword ? "text" : type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocusedInput(name)}
        onBlur={() => setFocusedInput(null)}
        required
      />
      <label className={value || focusedInput === name ? "active" : ""}>
        {labelText}
      </label>
      {isPassword && (
        <span onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </span>
      )}
    </div>
  );

  return (
    <div className="login-page-wrapper">
      <div className="container">
        <div className="header">
          <div className="header-cont">
            {isSignup ? "USER SIGN IN" : "USER LOGIN"}
          </div>
        </div>

        <div className={`form-slider ${isSignup ? "move" : ""}`}>
          <div className="login-form">
            <form onSubmit={handleLogin}>
              {renderFloatingInput(
                "text",
                "loginUsername",
                loginData.username,
                (val) => setLoginData({ ...loginData, username: val }),
                "Username"
              )}
              {renderFloatingInput(
                "password",
                "loginPassword",
                loginData.password,
                (val) => setLoginData({ ...loginData, password: val }),
                "Password",
                true
              )}
              <input type="submit" value="Login" />
            </form>
          </div>

          <div className="signup-form">
            <form onSubmit={handleSignup}>
              {renderFloatingInput(
                "text",
                "signupUsername",
                signupData.username,
                (val) => setSignupData({ ...signupData, username: val }),
                "Username"
              )}
              {renderFloatingInput(
                "email",
                "signupEmail",
                signupData.email,
                (val) => setSignupData({ ...signupData, email: val }),
                "Email"
              )}

              <div className="password-wrapper">
                <div className="floating-label-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    required
                  />
                  <label
                    className={
                      signupData.password || passwordFocus ? "active" : ""
                    }
                  >
                    Password
                  </label>
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
                </div>

                {passwordFocus && (
                  <div className="password-popup">
                    <ul>
                      <li
                        className={passwordChecks.length ? "valid" : "invalid"}
                      >
                        Min 8 characters
                      </li>
                      <li
                        className={passwordChecks.upper ? "valid" : "invalid"}
                      >
                        1 uppercase
                      </li>
                      <li
                        className={passwordChecks.lower ? "valid" : "invalid"}
                      >
                        1 lowercase
                      </li>
                      <li
                        className={passwordChecks.number ? "valid" : "invalid"}
                      >
                        1 number
                      </li>
                      <li
                        className={passwordChecks.noSpace ? "valid" : "invalid"}
                      >
                        No spaces
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="floating-label-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData({
                      ...signupData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <label className={signupData.confirmPassword ? "active" : ""}>
                  Confirm Password
                </label>
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>

              <div className="phone-wrapper">
                <select
                  value={signupData.countryCode}
                  onChange={(e) =>
                    setSignupData({
                      ...signupData,
                      countryCode: e.target.value,
                    })
                  }
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.code})
                    </option>
                  ))}
                </select>
                <div className="floating-label-input">
                  <input
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) =>
                      setSignupData({ ...signupData, phone: e.target.value })
                    }
                    required
                  />
                  <label className={signupData.phone ? "active" : ""}>
                    Phone Number
                  </label>
                </div>
              </div>

              <input type="submit" value="Sign Up" />
            </form>
          </div>
        </div>

        <div className="bottom">
          <button className="btn" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "ALREADY HAVE AN ACCOUNT?" : "DON'T HAVE AN ACCOUNT?"}
          </button>
          <button className="btn" id="forgot">
            Forgot Password
          </button>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default LoginSignup;
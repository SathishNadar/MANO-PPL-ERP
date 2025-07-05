// LoginSignup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {API_URI} from "../ip.js"
import "./login.css";

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = localStorage.getItem("session");
    if (sessionData) {
      const { expiry, username, user_id } = JSON.parse(sessionData);
      if (Date.now() < expiry) {
        navigate("/dashboard");
      } else {
        localStorage.removeItem("session");
      }
    }
  }, []);

  const setSession = (username, userid) => {
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const sessionData = { username, expiry: expiryTime, user_id:userid };
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
        const userid = data["user_data"]["user_id"]
        setSession(loginData.username, userid);
        navigate("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://${API_URI}:3000/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: signupData.username,
          user_password: signupData.password,
          email: signupData.email,
          phone_no: signupData.phone,
        }),
      });

      const data = await response.json();
      alert(data.message);
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed. Try again.");
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="container">
        <div className="header">
          <div className="header-cont">
            {isSignup ? "USER SIGN IN" : "USER LOGIN"}
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
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
              <input type="submit" value="login" />
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
                type="text"
                placeholder="Email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={signupData.phone}
                onChange={(e) =>
                  setSignupData({ ...signupData, phone: e.target.value })
                }
                required
              />
              <input type="submit" value="sign in" />
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
    </div>
  );
};

export default LoginSignup;
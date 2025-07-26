import express from 'express';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from "url";
import * as DB from "./database.js";


// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const result = dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const tokenExpirePeriod = 7 * 24 * 60 * 60; // Time in seconds 
const router = express.Router();



export async function authenticateJWT(req, res, next) {
  try {
    let token;
    const authHeader = req.headers['authorization'];
    console.log(authHeader)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
      }

      req.user = {
        user_id: decodedUser.user_id,
        user_name: decodedUser.user_name,
        email: decodedUser.email
      };

      next();
    });
  } catch (error) {
    console.error("❌ JWT Authentication Error:", error);
    return res.status(500).json({ message: "Internal Server Error during authentication" });
  }
}



export async function generateJWT(user_data) {
    return jwt.sign(user_data, process.env.JWT_SECRET, { expiresIn: tokenExpirePeriod});
}



// Login route
router.post("/login", async (req, res) => {
  try {
    const { user_name, user_password } = req.body;
    if (!user_name || !user_password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user_data = await DB.r_fetchUserByName(user_name);
    if (!user_data) {
      return res.status(404).json({ message: "Username not found" });
    }

    const isMatch = await bcrypt.compare(user_password, user_data.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const response_data = {
      user_id: user_data.user_id,
      user_name: user_data.user_name,
      email: user_data.email
    };

    const token = await generateJWT(response_data);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: tokenExpirePeriod * 1000
    });

    res.status(200).json({ 
      message: "Login successful",
      user_data: response_data,
      jwt_token: token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { user_name, user_password, email, phone_no } = req.body;
    if (!user_name || !user_password || !email || !phone_no) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const usernameExists = await DB.r_usernameExist(user_name);
    const emailOrPhoneTaken = await DB.r_isEmailOrPhoneTaken(email, phone_no);

    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists." });
    }
    if (emailOrPhoneTaken) {
      return res.status(400).json({ message: "Email or phone number already in use." });
    }

    const hashedPassword = await bcrypt.hash(user_password, 10);
    await DB.r_addUser([user_name, hashedPassword, email, phone_no]);

    res.status(201).json({ message: "Signup successful. Login to continue." });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
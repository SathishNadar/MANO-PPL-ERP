import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import * as DB from "./database.js";
import path from "path";
import { fileURLToPath } from "url";


const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json());

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

    res.status(200).json({ message: "Login successful", user: user_data });
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

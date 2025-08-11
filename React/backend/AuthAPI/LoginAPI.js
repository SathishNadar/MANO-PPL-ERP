import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as DB from "../Database.js";

const tokenExpirePeriod = 7 * 24 * 60 * 60; // Time in seconds 
const router = express.Router();
  
export async function authenticateJWT(req, res, next) {
  try {
    let token;
    const authHeader = req.headers['authorization'];
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
      email: user_data.email,
      title_id:user_data.title_id
    };

    const token = await generateJWT(response_data);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
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


export default router;
import express from "express";
import * as DB from "../Database.js"
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import bcrypt from 'bcrypt';


const router = express.Router();

// GET all users
router.get("/users", authenticateJWT, async (req, res) => {
  try {
    if (req.user.title !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: "Only admin can access user Data" });
    }

    const data = await DB.getAllUsers();
    if (!data.ok) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch users", details: data.message });
    }

    const titles = await DB.getTitles();
    if (!titles.ok) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch titles", details: titles.message });
    }

    res.json({
      success: true,
      users: data.users,
      titles: titles.titles,
    });

  } catch (error) {
    console.error("❌ Get all users error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});


// UPDATE user by user_id
router.put("/user/:user_id", authenticateJWT, async (req, res) => {
  try {
    if (req.user.title !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can update user data" });
    }

    const { user_id } = req.params;
    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (DB.ALLOWED_UPDATE_FIELDS.has(key)) {
        if (key === "user_password") {
          if (req.body.user_password && req.body.user_password.trim() !== "") {
            updates.user_password = await bcrypt.hash(req.body.user_password, 12);
          }
        } else {
          updates[key] = req.body[key];
        }
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const result = await DB.updateUserById(user_id, updates);

    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.json({ success: false,  message: "User updated successfully" });
  } catch (err) {
    console.error("❌ Update user error:", err);
    return res.status(500).json({ success: true, message: "Internal Server Error" });
  }
});

// DELETE user by user_id
router.delete("/user/:user_id", authenticateJWT, async (req, res) => {
  try {
    if (req.user.title !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can delete users" });
    }

    const { user_id } = req.params;
    const result = await DB.deleteUserById(user_id);

    if (!result.ok) return res.status(404).json({ message: result.message });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete user error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});



export default router;


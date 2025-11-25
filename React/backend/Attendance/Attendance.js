import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

// POST /attendance/checkin
router.post("/timein", authenticateJWT, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { latitude, longitude } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ ok: false, message: "Invalid or missing latitude/longitude" });
    }

    const openSession = await knexDB("attendance_records")
      .where({ user_id })
      .whereNull("time_out")
      .whereRaw("DATE(time_in) = CURDATE()")
      .first();

    if (openSession) {
      return res.status(400).json({ ok: false, message: "Already timed in. Please time out first." });
    }

    const [attendance_id] = await knexDB("attendance_records").insert({
      user_id,
      time_in: knexDB.fn.now(),
      time_in_lat: latitude,
      time_in_lng: longitude,
      created_at: knexDB.fn.now(),
      updated_at: knexDB.fn.now(),
    });

    res.json({ ok: true, attendance_id, message: "Timed in successfully" });
  } catch (err) {
    console.error("Time-in error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// POST /attendance/checkout
router.post("/timeout", authenticateJWT, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { latitude, longitude } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ ok: false, message: "Invalid or missing latitude/longitude" });
    }

    const openSession = await knexDB("attendance_records")
      .where({ user_id })
      .whereNull("time_out")
      .whereRaw("DATE(time_in) = CURDATE()")
      .first();


    if (!openSession) {
      return res.status(400).json({ ok: false, message: "No active time-in found to time out." });
    }

    await knexDB("attendance_records")
      .where({ attendance_id: openSession.attendance_id })
      .update({
        time_out: knexDB.fn.now(),
        time_out_lat: latitude,
        time_out_lng: longitude,
        updated_at: knexDB.fn.now(),
      });

    res.json({ ok: true, attendance_id: openSession.attendance_id, message: "Timed out successfully" });
  } catch (err) {
    console.error("Time-out error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});


// Admin attendance records with admin role check
router.get("/records/admin", authenticateJWT, async (req, res) => {
  try {
    if (req.user.title !== "admin") {
      return res.status(403).json({ ok: false, message: "Access denied" });
    }

    const { user_id, date_from, date_to, limit = 50 } = req.query;
    let query = knexDB("attendance_records")
      .join("users", "attendance_records.user_id", "users.user_id")
      .select(
        "attendance_records.*",
        "users.user_name",
        "users.email"
      )
      .orderBy("time_in", "desc")
      .limit(Math.min(parseInt(limit), 100)); // max limit 100 to prevent abuse

    if (user_id) query = query.where("attendance_records.user_id", user_id);
    if (date_from) query = query.where("time_in", ">=", date_from);
    if (date_to) query = query.where("time_in", "<=", date_to);

    const records = await query;
    res.json({ ok: true, data: records });
  } catch (err) {
    console.error("Admin attendance records error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});


// Normal user fetch their own records with optional limit and date filter
router.get("/records", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { date_from, date_to, limit = 50 } = req.query;

    let query = knexDB("attendance_records")
      .where("user_id", userId)
      .orderBy("time_in", "desc")
      .limit(Math.min(parseInt(limit), 100)); // max limit 100

    if (date_from) query = query.where("time_in", ">=", date_from);
    if (date_to) query = query.where("time_in", "<=", date_to);

    const records = await query;
    res.json({ ok: true, data: records });
  } catch (err) {
    console.error("User attendance records error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});


export default router;

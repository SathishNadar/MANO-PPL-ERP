import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import { fetchTimeStamp } from "../Timezone/Timezone.js";

const router = express.Router();

// POST /attendance/checkin
router.post("/timein", authenticateJWT, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { latitude, longitude, late_reason } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        ok: false,
        message: "Invalid or missing latitude/longitude",
      });
    }

    // STEP 1: Convert UTC → local time at user's coordinates
    const nowUTC = new Date().toISOString();
    const tz = await fetchTimeStamp(latitude, longitude, nowUTC);

    const localTime = tz.localTime; // The converted time

    // STEP 2: Check existing session
    const openSession = await knexDB("attendance_records")
      .where({ user_id })
      .whereNull("time_out")
      .whereRaw("DATE(time_in) = CURDATE()")
      .first();

    if (openSession) {
      return res.status(400).json({
        ok: false,
        message: "Already timed in. Please time out first.",
      });
    }

    // STEP 3: Save local time instead of server time
    const [attendance_id] = await knexDB("attendance_records").insert({
      user_id,
      late_reason: late_reason || null,
      time_in: localTime, // << USE LOCAL TIME
      time_in_lat: latitude,
      time_in_lng: longitude,
      created_at: knexDB.fn.now(),
      updated_at: knexDB.fn.now(),
    });

    return res.json({
      ok: true,
      attendance_id,
      local_time: localTime,
      timezone: tz.timezone,
      tz_name: tz.tzName,
      message: "Timed in successfully",
    });

  } catch (err) {
    console.error("Time-in error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
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

    // STEP 1 — Get current UTC time and convert to LOCAL (based on GPS)
    const nowUTC = new Date().toISOString();
    const tz = await fetchTimeStamp(latitude, longitude, nowUTC);
    const localTime = tz.localTime;

    // STEP 2 — Find open attendance session
    const openSession = await knexDB("attendance_records")
      .where({ user_id })
      .whereNull("time_out")
      .whereRaw("DATE(time_in) = CURDATE()")
      .first();

    if (!openSession) {
      return res.status(400).json({ ok: false, message: "No active time-in found to time out." });
    }

    // STEP 3 — Update time_out using LOCAL TIME
    await knexDB("attendance_records")
      .where({ attendance_id: openSession.attendance_id })
      .update({
        time_out: localTime,        // <<— USE THE CONVERTED LOCAL TIME
        time_out_lat: latitude,
        time_out_lng: longitude,
        updated_at: knexDB.fn.now(),
      });

    return res.json({
      ok: true,
      attendance_id: openSession.attendance_id,
      local_time_out: localTime,
      timezone: tz.timezone,
      tz_name: tz.tzName,
      message: "Timed out successfully",
    });

  } catch (err) {
    console.error("Time-out error:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
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
        "users.email",
        "users.designation"
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

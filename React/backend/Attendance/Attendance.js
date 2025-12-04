import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import { fetchTimeStamp } from "../Timezone/Timezone.js";
import multer from "multer";
import { uploadFile, getFileUrl, listFiles } from "../s3/s3Service.js";

const router = express.Router();
const upload = multer(); // store files in memory

// POST /attendance/checkin
router.post("/timein", authenticateJWT, upload.single("image"), 
async (req, res) => {
    try {
      const user_id = req.user.user_id;

      // fields come as strings in multipart
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      const late_reason = req.body.late_reason || null;

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid or missing latitude/longitude",
        });
      }

      const file = req.file; // may be undefined if no image sent

      // STEP 1: Convert UTC → local time at user's coordinates
      const nowUTC = new Date().toISOString();
      const tz = await fetchTimeStamp(latitude, longitude, nowUTC);
      const localTime = tz.localTime;

      // STEP 2: Check existing session
      const openSession = await knexDB("attendance_records")
        .where({ user_id })
        .whereNull("time_out")
        .whereRaw("DATE(time_in) = DATE(?)", [localTime])
        .first();

      if (openSession) {
        return res.status(400).json({
          ok: false,
          message: "Already timed in. Please time out first.",
        });
      }

      // STEP 3: Insert attendance first to get attendance_id
      const [attendance_id] = await knexDB("attendance_records").insert({
        user_id,
        late_reason,
        time_in: localTime,
        time_in_lat: latitude,
        time_in_lng: longitude,
        created_at: knexDB.fn.now(),
        updated_at: knexDB.fn.now(),
      });

      let imageKey = null;

      // STEP 4: If image present, upload to S3
      if (file) {
        const key = `${attendance_id}_in`;
        const directory = "attendance_images";

        const uploadResult = await uploadFile({
          fileBuffer: file.buffer,
          key,
          directory,
          contentType: file.mimetype,
        });

        imageKey = uploadResult.key;

        // optional: save S3 key in DB
        await knexDB("attendance_records")
          .where({ attendance_id })
          .update({
            time_in_image_key: imageKey, // make sure this column exists
            updated_at: knexDB.fn.now(),
          });
      }

      return res.json({
        ok: true,
        attendance_id,
        local_time: localTime,
        timezone: tz.timezone,
        tz_name: tz.tzName,
        image_key: imageKey,
        message: "Timed in successfully",
      });
    } catch (err) {
      console.error("Time-in error:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Internal server error" });
    }
  }
);

// POST /attendance/checkout
router.post("/timeout", authenticateJWT, upload.single("image"), 
async (req, res) => {
    try {
      const user_id = req.user.user_id;

      // in multipart, fields come as strings
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid or missing latitude/longitude" });
      }

      const file = req.file; // may be undefined

      console.log(file);

      // STEP 1 — Get current UTC time and convert to LOCAL (based on GPS)
      const nowUTC = new Date().toISOString();
      const tz = await fetchTimeStamp(latitude, longitude, nowUTC);
      const localTime = tz.localTime;

      // STEP 2 — Find open attendance session
      const openSession = await knexDB("attendance_records")
        .where({ user_id })
        .whereNull("time_out")
        .whereRaw("DATE(time_in) = DATE(?)", [localTime])
        .first();

      if (!openSession) {
        return res.status(400).json({
          ok: false,
          message: "No active time-in found to time out.",
        });
      }

      let imageKey = null;

      // STEP 3 — If image present, upload to S3 and store key
      if (file) {
        const key = `${openSession.attendance_id}_out`; // e.g. "123_out"
        const directory = "attendance_images";

        const uploadResult = await uploadFile({
          fileBuffer: file.buffer,
          key,
          directory,
          contentType: file.mimetype,
        });

        imageKey = uploadResult.key;

        // save S3 key in DB (make sure column exists)
        await knexDB("attendance_records")
          .where({ attendance_id: openSession.attendance_id })
          .update({
            time_out_image_key: imageKey,
            updated_at: knexDB.fn.now(),
          });
      }

      // STEP 4 — Update time_out (LOCAL time)
      await knexDB("attendance_records")
        .where({ attendance_id: openSession.attendance_id })
        .update({
          time_out: localTime,
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
        image_key: imageKey,
        message: "Timed out successfully",
      });
    } catch (err) {
      console.error("Time-out error:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Internal server error" });
    }
  }
);

// Admin attendance records and images with admin role check
router.get("/records/admin", authenticateJWT, async (req, res) => {
  try {
    if (req.user.title !== "admin") {
      return res.status(403).json({ ok: false, message: "Access denied" });
    }

    const { user_id, date_from, date_to, limit = 50 } = req.query;

    let query = knexDB("attendance_records")
      .join("users", "attendance_records.user_id", "users.user_id")
      .select(
        "attendance_records.attendance_id",
        "attendance_records.late_reason",
        "attendance_records.time_in",
        "attendance_records.time_in_lat",
        "attendance_records.time_in_image_key as time_in_image",
        "attendance_records.time_out",
        "attendance_records.time_out_lat",
        "attendance_records.time_out_image_key as time_out_image",
        "attendance_records.user_id",
        "users.user_name",
        "users.email",
        "users.designation"
      )
      .orderBy("time_in", "desc")
      .limit(Math.min(parseInt(limit), 100));

    if (user_id) query = query.where("attendance_records.user_id", user_id);
    if (date_from) query = query.whereRaw("DATE(time_in) >= DATE(?)", [date_from]);
    if (date_to) query = query.whereRaw("DATE(time_in) <= DATE(?)", [date_to]);

    const records = await query;

    // map keys -> signed URLs
    const withUrls = await Promise.all(
      records.map(async (row) => {
        let timeInUrl = null;
        let timeOutUrl = null;

        if (row.time_in_image) {
          const { url } = await getFileUrl({ key: row.time_in_image });
          timeInUrl = url;
        }
        if (row.time_out_image) {
          const { url } = await getFileUrl({ key: row.time_out_image });
          timeOutUrl = url;
        }

        return {
          ...row,
          time_in_image: timeInUrl,
          time_out_image: timeOutUrl,
        };
      })
    );

    res.json({ ok: true, data: withUrls });
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

    if (date_from) query = query.whereRaw("DATE(time_in) >= DATE(?)", [date_from]);
    if (date_to) query = query.whereRaw("DATE(time_in) <= DATE(?)", [date_to]);

    const records = await query;

    console.log(await getFileUrl({ key: records}))

    // records.time_in_image = await getFileUrl({ key: records.time_in_image })
    // records.time_out_image = await getFileUrl({ key: records.time_out_image })

    res.json({ ok: true, data: records });
  } catch (err) {
    console.error("User attendance records error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});


export default router;

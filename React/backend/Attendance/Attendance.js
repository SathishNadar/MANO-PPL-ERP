import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import { fetchTimeStamp, coordsToAddress } from "../Google_API/Maps.js";
import multer from "multer";
import { uploadFile, getFileUrl, listFiles, uploadCompressedImage } from "../s3/s3Service.js";

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

      // STEP 2: Convert coordinates into address
      const { address } = await coordsToAddress(latitude, longitude);

      // STEP 3: Check existing session
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

      // STEP 4: Insert attendance first to get attendance_id
      const [attendance_id] = await knexDB("attendance_records").insert({
        user_id,
        late_reason,
        time_in: localTime,
        time_in_lat: latitude,
        time_in_lng: longitude,
        time_in_address: address,
        created_at: knexDB.fn.now(),
        updated_at: knexDB.fn.now(),
      });

      let imageKey = null;

      // STEP 5: If image present, upload to S3
      if (file) {
        const uploadResult = await uploadCompressedImage({
          fileBuffer: file.buffer,
          key: `${attendance_id}_in`,
          directory: "attendance_images"
        });

        imageKey = uploadResult.key;

        await knexDB("attendance_records")
          .where({ attendance_id })
          .update({
            time_in_image_key: imageKey,
            updated_at: knexDB.fn.now(),
          });
      }

      return res.json({
        ok: true,
        attendance_id,
        local_time: localTime,
        address: address,
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

      // STEP 1: Get current UTC time and convert to LOCAL (based on GPS)
      const nowUTC = new Date().toISOString();
      const tz = await fetchTimeStamp(latitude, longitude, nowUTC);
      const localTime = tz.localTime;

      // STEP 2: Convert coordinates into address
      const { address } = await coordsToAddress(latitude, longitude);

      // STEP 3: Find open attendance session
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

      // STEP 4: If image present, upload to S3 and store key
      if (file) {
        const uploadResult = await uploadCompressedImage({
          fileBuffer: file.buffer,
          key: `${openSession.attendance_id}_out`,
          directory: "attendance_images"
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

      // STEP 5: Update time_out (LOCAL time)
      await knexDB("attendance_records")
        .where({ attendance_id: openSession.attendance_id })
        .update({
          time_out: localTime,
          time_out_lat: latitude,
          time_out_lng: longitude,
          time_out_address: address,
          updated_at: knexDB.fn.now(),
        });

      return res.json({
        ok: true,
        attendance_id: openSession.attendance_id,
        local_time_out: localTime,
        // timezone: tz.timezone,
        address: address,
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
        "attendance_records.*",
        knexDB.raw("DATE_FORMAT(attendance_records.time_in, '%Y-%m-%d %H:%i:%s') as time_in"),
        knexDB.raw("DATE_FORMAT(attendance_records.time_out, '%Y-%m-%d %H:%i:%s') as time_out"),
        knexDB.raw("DATE_FORMAT(attendance_records.created_at, '%Y-%m-%d %H:%i:%s') as created_at"),
        knexDB.raw("DATE_FORMAT(attendance_records.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at"),
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

    const withUrls = await Promise.all(
      records.map(async (row) => {
        let timeInUrl = null;
        let timeOutUrl = null;

        if (row.time_in_image_key) {
          const { url } = await getFileUrl({ key: row.time_in_image_key });
          timeInUrl = url;
        }
        if (row.time_in_image_key) {
          const { url } = await getFileUrl({ key: row.time_out_image_key });
          timeOutUrl = url;
        }

        const time_in = row.time_in == null ? null : String(row.time_in);
        const time_out = row.time_out == null ? null : String(row.time_out);
        const created_at = row.created_at == null ? null : String(row.created_at);
        const updated_at = row.updated_at == null ? null : String(row.updated_at);

        return {
          ...row,
          time_in,
          time_out,
          created_at,
          updated_at,
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

    if (date_from) {
      query = query.whereRaw("DATE(time_in) >= DATE(?)", [date_from]);
    }
    if (date_to) {
      query = query.whereRaw("DATE(time_in) <= DATE(?)", [date_to]);
    }

    const records = await query;

    const withUrls = await Promise.all(
      (records || []).map(async (row) => {
        let timeInUrl = null;
        let timeOutUrl = null;

        if (row.time_in_image_key) {
          const { url } = await getFileUrl({ key: row.time_in_image_key });
          timeInUrl = url;
        }
        if (row.time_out_image_key) {
          const { url } = await getFileUrl({ key: row.time_out_image_key });
          timeOutUrl = url;
        }

        const time_in = row.time_in == null ? null : String(row.time_in);
        const time_out = row.time_out == null ? null : String(row.time_out);
        const created_at = row.created_at == null ? null : String(row.created_at);
        const updated_at = row.updated_at == null ? null : String(row.updated_at);

        return {
          ...row,
          time_in,
          time_out,
          created_at,
          updated_at,
          time_in_image: timeInUrl,
          time_out_image: timeOutUrl,
        };
      })
    );

    res.json({ ok: true, data: withUrls });
  } catch (err) {
    console.error("User attendance records error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});


export default router;


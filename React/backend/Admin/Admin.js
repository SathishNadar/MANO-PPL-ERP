import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import bcrypt from 'bcrypt';
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

const router = express.Router();

const ALLOWED_UPDATE_FIELDS = new Set([
  "user_name",
  "user_password",
  "email",
  "phone_no",
  "title_id",
]);

// GET all users
router.get("/users", authenticateJWT, catchAsync(async (req, res, next) => {
  if (req.user.title !== 'admin') {
    throw new AppError("Only admin can access user Data", 403);
  }

  const includeWorkLocation = req.query.workLocation === 'true';

  // 1. Fetch Users
  let usersQuery = knexDB('users as u')
    .join('titles as t', 'u.title_id', 't.title_id')
    .select(
      'u.user_id',
      'u.user_name',
      'u.email',
      'u.phone_no',
      'u.designation',
      't.title_name',
    );

  // If work locations are requested, we need to fetch them
  // Since a user can have multiple work locations, doing a simple join might duplicate user rows.
  // We can fetch work locations separately and merge them, similar to task controls.
  const users = await usersQuery;

  let workLocationMap = {};
  if (includeWorkLocation) {
    const workLocationsData = await knexDB('user_work_location as uwl')
      .join('work_locations as wl', 'uwl.wl_id', 'wl.loc_id')
      .select(
        'uwl.user_id',
        'wl.loc_id',
        'wl.loc_name',
        'wl.latitude',
        'wl.longitude',
        'wl.radius'
      );

    for (const row of workLocationsData) {
      if (!workLocationMap[row.user_id]) workLocationMap[row.user_id] = [];
      workLocationMap[row.user_id].push({
        loc_id: row.loc_id,
        loc_name: row.loc_name,
        latitude: row.latitude,
        longitude: row.longitude,
        radius: row.radius
      });
    }
  }

  // 2. Fetch Titles
  const titlesRows = await knexDB('titles').select('title_id', 'title_name');
  const titlesObj = titlesRows.reduce((acc, item) => {
    acc[item.title_id] = item.title_name;
    return acc;
  }, {});

  // 3. Fetch Task Controls
  const ctrlData = await knexDB('task_control as tc')
    .join('users as u', 'tc.controlled_id', 'u.user_id')
    .select(
      'tc.controller_id',
      'tc.controlled_id',
      'tc.control_type',
      'u.user_name as controlled_name'
    );

  // 4. Merge Controls into Users
  const controlMap = {};
  for (const row of ctrlData) {
    if (!controlMap[row.controller_id]) controlMap[row.controller_id] = [];
    controlMap[row.controller_id].push({
      controlled_id: row.controlled_id,
      control_type: row.control_type,
      controlled_name: row.controlled_name
    });
  }

  const usersWithControls = users.map(u => {
    const userObj = {
      ...u,
      controls: controlMap[u.user_id] || []
    };

    if (includeWorkLocation) {
      userObj.work_locations = workLocationMap[u.user_id] || [];
    }

    return userObj;
  });

  res.json({
    success: true,
    users: usersWithControls,
    titles: titlesObj,
  });
}));


// UPDATE user by user_id
router.put("/user/:user_id", authenticateJWT, catchAsync(async (req, res, next) => {
  if (req.user.title !== "admin") {
    throw new AppError("Only admin can update user data", 403);
  }

  const { user_id } = req.params;
  const updates = {};

  // Filter and prepare updates
  for (const key of Object.keys(req.body)) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      if (key === "user_password") {
        if (req.body.user_password && req.body.user_password.trim() !== "") {
          updates.user_password = await bcrypt.hash(req.body.user_password, 12);
        }
      } else {
        updates[key] = req.body[key];
      }
    }
  }

  // Transaction for atomic updates (User data + Task Controls)
  await knexDB.transaction(async (trx) => {
    // 1. Update User Table
    if (Object.keys(updates).length > 0) {
      const affected = await trx('users').where('user_id', user_id).update(updates);
    }

    // 2. Update Task Controls
    if (req.body.task_control) {
      const { add = [], remove = [] } = req.body.task_control;

      // Remove entries
      if (remove.length > 0) {
        for (const { controlled_id } of remove) {
          await trx('task_control')
            .where({ controller_id: user_id, controlled_id })
            .del();
        }
      }

      // Add/Update entries
      if (add.length > 0) {
        for (const obj of add) {
          const controlled_id = obj.controlled_id;
          const control_type = obj.control_type || "manager";

          await trx.raw(`
            INSERT INTO task_control (controller_id, controlled_id, control_type)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE control_type = VALUES(control_type)
          `, [user_id, controlled_id, control_type]);
        }
      }
    }
  });

  res.json({ success: true, message: "User updated successfully" });
}));


// DELETE user by user_id
router.delete("/user/:user_id", authenticateJWT, catchAsync(async (req, res, next) => {
  if (req.user.title !== "admin") {
    throw new AppError("Only admin can delete users", 403);
  }

  const { user_id } = req.params;

  const affected = await knexDB('users').where('user_id', user_id).del();

  if (affected === 0) {
    throw new AppError("User not found", 404);
  }

  res.json({ message: "User deleted successfully" });
}));


export default router;



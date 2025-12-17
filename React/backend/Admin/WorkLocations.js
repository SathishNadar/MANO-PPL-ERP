
import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

const router = express.Router();

// Ensure only admins can access these routes
router.use(authenticateJWT, (req, res, next) => {
    if (req.user.title !== 'admin') {
        return next(new AppError("Only admin can access Work Location settings", 403));
    }
    next();
});

/* -------------------------------------------------------------------------- */
/*                            Work Location CRUD                              */
/* -------------------------------------------------------------------------- */

// GET: Fetch all work locations
router.get("/", catchAsync(async (req, res) => {
    const locations = await knexDB("work_locations").select("*");
    res.json({ success: true, locations });
}));

// POST: Add new work location
router.post("/", catchAsync(async (req, res) => {
    const { loc_name, latitude, longitude, radius } = req.body;

    if (!loc_name) {
        throw new AppError("Location name is required", 400);
    }

    const [id] = await knexDB("work_locations").insert({
        loc_name,
        latitude,
        longitude,
        radius,
    });

    res.status(201).json({ success: true, message: "Work location added", id });
}));

// PUT: Update work location
router.put("/:id", catchAsync(async (req, res) => {
    const { id } = req.params;
    const { loc_name, latitude, longitude, radius } = req.body;

    const affected = await knexDB("work_locations")
        .where("loc_id", id)
        .update({
            loc_name,
            latitude,
            longitude,
            radius,
        });

    if (affected === 0) {
        throw new AppError("Location not found or no changes made", 404);
    }

    res.json({ success: true, message: "Work location updated" });
}));

// DELETE: Remove work location
router.delete("/:id", catchAsync(async (req, res) => {
    const { id } = req.params;

    const affected = await knexDB("work_locations")
        .where("loc_id", id)
        .del();

    if (affected === 0) {
        throw new AppError("Location not found", 404);
    }

    res.json({ success: true, message: "Work location deleted" });
}));


/* -------------------------------------------------------------------------- */
/*                        User Assignment (Relation)                          */
/* -------------------------------------------------------------------------- */

// POST: Assign/Remove locations for a user
// Path: /assign/:user_id
// Body: { add: [loc_id1, ...], remove: [loc_id2, ...] }
router.post("/assign/:user_id", catchAsync(async (req, res) => {
    const { user_id } = req.params;
    const { add = [], remove = [] } = req.body;

    if (!Array.isArray(add) || !Array.isArray(remove)) {
        throw new AppError("'add' and 'remove' must be arrays", 400);
    }

    await knexDB.transaction(async (trx) => {
        // 1. Remove relations
        if (remove.length > 0) {
            await trx("user_work_location")
                .where("user_id", user_id)
                .whereIn("wl_id", remove)
                .del();
        }

        // 2. Add relations
        if (add.length > 0) {
            // We use INSERT IGNORE to prevent errors if the pair already exists.
            // This requires a UNIQUE constraint on (user_id, wl_id).
            const values = add.map(wl_id => [user_id, wl_id]);

            if (values.length > 0) {
                await trx.raw(
                    `INSERT IGNORE INTO user_work_location (user_id, wl_id) VALUES ?`,
                    [values]
                );
            }
        }
    });

    res.json({ success: true, message: "User work locations updated" });
}));

export default router;

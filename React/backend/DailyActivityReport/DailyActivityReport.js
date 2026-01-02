import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

// Fetch dar users
router.get("/users", authenticateJWT, async (req, res) => {
    try {
        const userTitle = String(req.user.title).toLowerCase();
        if (userTitle !== "admin") {
            return res.status(403).json({
                ok: false,
                message: "Access denied"
            });
        }

        const users = await knexDB("user_daily_activity_report as dar")
            .join("users as u", "dar.user_id", "u.user_id")
            .distinct("u.user_id", "u.user_name")
            .orderBy("u.user_name");

        res.json({ ok: true, data: users });
    } catch (error) {
        console.error("Fetch DAR users error:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

router.get("/user/:user_id", authenticateJWT, async (req, res) => {
    try {
        const requestedUserId = parseInt(req.params.user_id, 10);
        const { date } = req.query;
        const loggedUserId = req.user.user_id;

        if (String(req.user.title).toLowerCase() !== "admin" && requestedUserId !== loggedUserId) {
            return res.status(403).json({
                ok: false,
                message: "Access denied"
            });
        }

        const query = knexDB("user_daily_activity_report")
            .where("user_id", requestedUserId);

        if (date) {
            query.andWhere("date", date);
        }

        const rows = await query.orderBy("date", "desc");

        res.json({ ok: true, data: rows });
    } catch (error) {
        console.error("Fetch DAR error:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

// Add DAR
router.post("/add", authenticateJWT, async (req, res) => {
    try {
        // Admin blocked (Option 2)
        if (String(req.user.title).toLowerCase() === "admin") {
            return res.status(403).json({
                ok: false,
                message: "Admin cannot add DAR"
            });
        }

        const user_id = req.user.user_id;
        const { date, activity_report } = req.body;

        if (!date || !activity_report) {
            return res.status(400).json({
                ok: false,
                message: "Missing fields"
            });
        }

        const [dar_id] = await knexDB("user_daily_activity_report").insert({
            user_id,
            date,
            activity_report: JSON.stringify(activity_report)
        });

        res.json({ ok: true, dar_id });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                ok: false,
                message: "DAR already exists for this date"
            });
        }

        console.error("Add DAR error:", error);
        res.status(500).json({
            ok: false,
            message: "Internal server error"
        });
    }
});


router.put("/update/:dar_id",
    authenticateJWT,
    async (req, res) => {
        try {
            if (String(req.user.title).toLowerCase() === "admin") {
                return res.status(403).json({
                    ok: false,
                    message: "Admin cannot update DAR"
                });
            }

            const dar_id = parseInt(req.params.dar_id, 10);
            if (Number.isNaN(dar_id)) {
                return res.status(400).json({
                    ok: false,
                    message: "Invalid dar_id"
                });
            }
            const { user_id } = req.user;
            const { activity_report } = req.body;

            if (!activity_report) {
                return res.status(400).json({
                    ok: false,
                    message: "Missing activity_report field"
                });
            }

            // Fetch DAR
            const dar = await knexDB("user_daily_activity_report")
                .where({ dar_id })
                .first();

            if (!dar) {
                return res.status(404).json({
                    ok: false,
                    message: "DAR not found"
                });
            }

            // Ownership check (same style as drawings)
            if (dar.user_id !== user_id) {
                return res.status(403).json({
                    ok: false,
                    message: "Not allowed to update this DAR"
                });
            }

            // Update
            await knexDB("user_daily_activity_report")
                .where({ dar_id })
                .update({
                    activity_report: JSON.stringify(activity_report),
                    updated_at: knexDB.fn.now()
                });

            res.json({
                ok: true,
                message: "DAR updated successfully"
            });

        } catch (error) {
            console.error("Update DAR error:", error);
            res.status(500).json({
                ok: false,
                message: "Internal server error"
            });
        }
    }
);


router.delete("/delete/:dar_id", authenticateJWT, async (req, res) => {
    try {
        const userTitle = String(req.user.title).toLowerCase();
        if (userTitle === "admin") {
            return res.status(403).json({
                ok: false,
                message: "Admins cannot delete reports"
            });
        }

        const dar_id = parseInt(req.params.dar_id, 10);
        if (Number.isNaN(dar_id)) {
            return res.status(400).json({ ok: false, message: "Invalid dar_id" });
        }

        const { user_id } = req.user;

        const dar = await knexDB("user_daily_activity_report")
            .where({ dar_id })
            .first();

        if (!dar) {
            return res.status(404).json({ ok: false, message: "DAR not found" });
        }

        if (dar.user_id !== user_id) {
            return res.status(403).json({ ok: false, message: "Not allowed to delete this DAR" });
        }

        await knexDB("user_daily_activity_report")
            .where({ dar_id })
            .del();

        res.json({ ok: true, message: "DAR deleted successfully" });
    } catch (error) {
        console.error("Delete DAR error:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

export default router;




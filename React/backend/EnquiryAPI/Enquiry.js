import express from "express";
import { knexDB } from "../Database.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

const router = express.Router();

// POST / - Create a new enquiry
router.post("/", catchAsync(async (req, res, next) => {
    const { name, email, subject, message, remarks } = req.body;

    // Basic Validation
    if (!name || !email || !message) {
        throw new AppError("Name, Email, and Message are required fields.", 400);
    }

    // Insert into DB
    const [insertId] = await knexDB("enquiries").insert({
        name,
        email,
        subject: subject || null,
        message,
        remarks: remarks || null
    });

    res.status(200).json({
        success: true,
        message: "Enquiry submitted successfully.",
        data: {
            id: insertId
        }
    });
}));

// GET / - Fetch all enquiries (with optional status filter)
// Status can be a comma separated string
router.get("/", catchAsync(async (req, res, next) => {
    let { status } = req.query;
    let query = knexDB("enquiries").select("*").orderBy("created_at", "desc");

    if (status) {
        let statuses = [];
        if (Array.isArray(status)) {
            statuses = status;
        } else if (typeof status === 'string') {
            statuses = status.split(',').map(s => s.trim());
        }

        if (statuses.length > 0) {
            query = query.whereIn("status", statuses);
        }
    }

    const enquiries = await query;

    res.status(200).json({
        success: true,
        data: enquiries
    });
}));

// PUT /:id/status - Update enquiry status
router.put("/:id/status", catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        throw new AppError("Status is required.", 400);
    }

    const result = await knexDB("enquiries").where("id", id).update({ status });

    if (result === 0) {
        throw new AppError("Enquiry not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Enquiry status updated successfully."
    });
}));

// DELETE /:id - Delete an enquiry
router.delete("/:id", catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const result = await knexDB("enquiries").where("id", id).del();

    if (result === 0) {
        throw new AppError("Enquiry not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Enquiry deleted successfully."
    });
}));

export default router;

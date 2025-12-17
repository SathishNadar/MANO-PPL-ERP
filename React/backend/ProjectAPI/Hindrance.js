import express from 'express';
import { knexDB } from '../Database.js';
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 0;
    const diffTime = e - s;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    return diffDays > 0 ? diffDays : 0;
};

const calculateDelay = (planned, actual) => {
    if (!planned || !actual) return 0;
    const p = new Date(planned);
    const a = new Date(actual);
    if (isNaN(p) || isNaN(a)) return 0;
    const diffTime = a - p;
    // Delay can be negative (early) or positive (late)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Create
router.post('/create', authenticateJWT, catchAsync(async (req, res) => {
    const {
        project_id,
        description,
        planned_start_date,
        planned_end_date,
        actual_start_date,
        actual_end_date,
        responsible_start,
        responsible_finish,
        remarks
    } = req.body;

    if (!project_id || !description) {
        return res.status(400).json({ success: false, message: "Project ID and Description are required" });
    }

    const [id] = await knexDB('project_hindrance').insert({
        project_id,
        description,
        planned_start_date: planned_start_date || null,
        planned_end_date: planned_end_date || null,
        actual_start_date: actual_start_date || null,
        actual_end_date: actual_end_date || null,
        responsible_start,
        responsible_finish,
        remarks
    });

    res.json({ success: true, message: "Hindrance created", id });
}));

// Fetch by Project ID
router.get('/:project_id', authenticateJWT, catchAsync(async (req, res) => {
    const { project_id } = req.params;

    // Sort by created_at desc or planned_start? Usually chronological planned start makes sense for Gantt/Hindrance chart
    const rows = await knexDB('project_hindrance')
        .where({ project_id })
        .orderBy('planned_start_date', 'asc');

    const data = rows.map(row => {
        return {
            ...row,
            planned_duration: calculateDuration(row.planned_start_date, row.planned_end_date),
            actual_duration: calculateDuration(row.actual_start_date, row.actual_end_date),
            delay_start: calculateDelay(row.planned_start_date, row.actual_start_date),
            delay_finish: calculateDelay(row.planned_end_date, row.actual_end_date)
        };
    });

    res.json({ success: true, data });
}));

// Update
router.put('/update/:id', authenticateJWT, catchAsync(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly via put if any (like id, created_at)
    delete updates.hindrance_id;
    delete updates.created_at;
    delete updates.updated_at;

    // Handle empty date strings from frontend if necessary
    ['planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date'].forEach(field => {
        if (updates[field] === '') updates[field] = null;
    });

    const count = await knexDB('project_hindrance')
        .where({ hindrance_id: id })
        .update(updates);

    if (count === 0) {
        return res.status(404).json({ success: false, message: "Hindrance not found" });
    }

    res.json({ success: true, message: "Hindrance updated" });
}));

// Delete
router.delete('/delete/:id', authenticateJWT, catchAsync(async (req, res) => {
    const { id } = req.params;

    const count = await knexDB('project_hindrance')
        .where({ hindrance_id: id })
        .del();

    if (count === 0) {
        return res.status(404).json({ success: false, message: "Hindrance not found" });
    }

    res.json({ success: true, message: "Hindrance deleted" });
}));

export default router;

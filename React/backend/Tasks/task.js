import express from "express";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

const ALLOWED_STATUS = new Set([
  'in_progress',
  'completed',
  'failed',
  'not_started',
]);

// Helper to check control relationship or self ownership
async function hasControl(controller_id, controlled_id) {
  if (controller_id === controlled_id) return true;
  const control = await knexDB('task_control')
    .where({ controller_id, controlled_id })
    .first();
  return !!control;
}

// GET tasks controlled by a user
router.get("/controlled/:user_id", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.params;
    const tasks = await knexDB('tasks')
      .join('task_control', 'tasks.assigned_to', 'task_control.controlled_id')
      .where('task_control.controller_id', user_id)
      .select('tasks.*');
    res.json({ ok: true, data: tasks });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// GET tasks assigned to a user
router.get("/user/:user_id", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.params;
    const tasks = await knexDB('tasks').where({ assigned_to: user_id });
    res.json({ ok: true, data: tasks });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// GET controlled users
router.get("/controlled_users/:user_id", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.params;
    const controlledUsers = await knexDB('task_control')
      .where({ controller_id: user_id })
      .join('users', 'task_control.controlled_id', 'users.user_id')
      .select('users.*');
    res.json({ ok: true, data: controlledUsers });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// POST create task
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const controller_id = req.user.user_id;
    const assigned_to = req.body.assigned_to;
    req.body.assigned_by = controller_id;

    if (!assigned_to) return res.status(400).json({ ok: false, message: "Missing assigned_to" });

    if (!await hasControl(controller_id, assigned_to)) {
      return res.status(403).json({ ok: false, message: "You do not control this user" });
    }

    // Set defaults if necessary
    if (!req.body.assigned_date) req.body.assigned_date = knexDB.fn.now();
    if (!req.body.due_date) req.body.due_date = knexDB.fn.now();
    if (!req.body.status || !ALLOWED_STATUS.has(req.body.status)) req.body.status = 'not_started';

    const [task_id] = await knexDB('tasks').insert(req.body);
    res.json({ ok: true, task_id, message: "Task created successfully" });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// PUT update task
router.put("/:task_id", authenticateJWT, async (req, res) => {
  try {
    const controller_id = req.user.user_id;
    const { task_id } = req.params;

    const task = await knexDB('tasks').where({ task_id }).first();
    if (!task) 
      return res.status(404).json({ ok: false, message: "Task not found" });

    if (controller_id !== task.assigned_by) {
      return res.status(403).json({ ok: false, message: "You do not control this user" });
    }

    const today = new Date().toISOString().split("T")[0];
    const taskDueDate = new Date(task.due_date).toISOString().split("T")[0];

    if (taskDueDate < today) {
      return res.status(403).json({
        ok: false,
        message: "Task due date has passed. You cannot update this task."
      });
    }

    if (req.body.status && !ALLOWED_STATUS.has(req.body.status)) {
      delete req.body.status;
    }

    const affected = await knexDB('tasks')
      .where({ task_id })
      .update(req.body);

    if (affected === 0) {
      return res.status(404).json({ ok: false, message: "No task updated" });
    }

    res.json({ ok: true, message: "Task updated successfully" });

  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// DELETE task
router.delete("/:task_id", authenticateJWT, async (req, res) => {
  try {
    const controller_id = req.user.user_id;
    const { task_id } = req.params;

    const task = await knexDB('tasks').where({ task_id }).first();
    if (!task) return res.status(404).json({ ok: false, message: "Task not found" });

    if (!await hasControl(controller_id, task.assigned_to)) {
      return res.status(403).json({ ok: false, message: "You do not control this user" });
    }

    const affected = await knexDB('tasks').where({ task_id }).del();
    if (affected === 0) return res.status(404).json({ ok: false, message: "Task not found" });

    res.json({ ok: true, message: "Task deleted successfully" });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;

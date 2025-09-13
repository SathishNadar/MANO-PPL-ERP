import express from "express";
import * as DB from "../Database.js"
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

const control_access = {
  viewer:    { view: true, create: false, edit: false, delete: false },
  assigner:  { view: true, create: true,  edit: true,  delete: false },
  editor:    { view: true, create: false, edit: true,  delete: false },
  deleter:   { view: true, create: false, edit: false, delete: true  },
  manager:   { view: true, create: true,  edit: true,  delete: true  },
  admin:     { view: true, create: true,  edit: true,  delete: true  }
};


// Get call to get all task under control of a user
router.get("/controlled/:user_id", authenticateJWT, async (req, res) => {
    try {
        const { user_id } = req.params;
        const tasks = await DB.fetchTasksOfControlled(user_id);
        res.json({ ok: true, data: tasks });
    } catch (err) {
        console.error("❌ API error:", err.message);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

// Get call to get all task assigned to a user
router.get("/user/:user_id", authenticateJWT, async (req, res) => {
    try {
        const { user_id } = req.params;
        const tasks = await DB.fetchTasks(user_id);
        res.json({ ok: true, data: tasks });
    } catch (err) {
        console.error("❌ API error:", err.message);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});


router.get("/controlled_users/:user_id", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.params;
    const controlledUsers = await DB.getControlledUsers(user_id); // Your DB function from earlier
    res.json({ ok: true, data: controlledUsers });
  } catch (err) {
    console.error("❌ API error:", err.message);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Post call to assign task to a user
router.post("/", authenticateJWT, async (req, res) => {
    try {
        const controller_id = req.user.user_id;
        const assigned_to = req.body.assigned_to;
        
        if (!assigned_to) return res.status(400).json({ ok: false, message: "Missing assigned_to" });

        let hasCreatePermission = false;

        if (controller_id === assigned_to) {
            hasCreatePermission = true;
        } else {
            
            const control_type = await DB.getControlType(controller_id, assigned_to);
            if (!control_type) {
                return res.status(403).json({ ok: false, message: "You do not have permission to assign tasks to this user." });
            }

            const perms = control_access[control_type];
            hasCreatePermission = perms ? perms.create : false;
        }

        if (!hasCreatePermission) {
            return res.status(403).json({ ok: false, message: "You do not have create permission for this user." });
        }

        const taskId = await DB.insertTask(req.body);
        res.json({ ok: true, task_id: taskId, message: "Task created successfully" });

    } catch (err) {
        console.error("❌ API error:", err.message);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

// Put call to edit a existing task
router.put("/:task_id", authenticateJWT, async (req, res) => {
    try {
        const controller_id = req.user.user_id;
        const { task_id } = req.params;

        const task = await DB.fetchTaskById(task_id);
        if (!task) {
            return res.status(404).json({ ok: false, message: "Task not found" });
        }
        const assigned_to = task.assigned_to;

        let hasEditPermission = false;

        if (controller_id === assigned_to) {
            hasEditPermission = true;
        } else {
            const control_type = await DB.getControlType(controller_id, assigned_to);

            if (!control_type) {
                return res.status(403).json({ ok: false, message: "You do not have permission to update tasks for this user." });
            }
            const perms = control_access[control_type];
            console.log(perms)
            hasEditPermission = perms ? perms.edit : false;
        }

        if (!hasEditPermission) {
            return res.status(403).json({ ok: false, message: "You do not have edit permission for this user." });
        }

        const affected = await DB.updateTask(task_id, req.body);
        if (affected === 0) {
            return res.status(404).json({ ok: false, message: "No task updated (maybe not found)" });
        }

        res.json({ ok: true, message: "Task updated successfully" });

    } catch (err) {
        console.error("❌ API error:", err.message);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

// Delete call to remove a existing task
router.delete("/:task_id", authenticateJWT, async (req, res) => {
    try {
        const controller_id = req.user.user_id;
        const { task_id } = req.params;

        const task = await DB.fetchTaskById(task_id);
        if (!task) {
            return res.status(404).json({ ok: false, message: "Task not found" });
        }
        const assigned_to = task.assigned_to;

        let hasDeletePermission = false;

        if (controller_id === assigned_to) {
            hasDeletePermission = true;
        } else {
            const control_type = await DB.getControlType(controller_id, assigned_to);
            if (!control_type) {
                return res.status(403).json({ ok: false, message: "You do not have permission to delete tasks for this user." });
            }
            const perms = control_access[control_type];
            hasDeletePermission = perms ? perms.delete : false;
        }

        if (!hasDeletePermission) {
            return res.status(403).json({ ok: false, message: "You do not have delete permission for this user." });
        }

        const affected = await DB.deleteTask(task_id);
        if (affected === 0) {
            return res.status(404).json({ ok: false, message: "Task not found" });
        }

        res.json({ ok: true, message: "Task deleted successfully" });

    } catch (err) {
        console.error("❌ API error:", err.message);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});



export default router;


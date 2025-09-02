import express from "express";
import * as DB from "../Database.js"
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

router.get("/eligibleUsers", authenticateJWT, async (req, res) => {
    try {
        const users = await DB.r_getEligibleUsers();
        res.json({ ok: true, users });
    } catch (err) {
        console.error("❌ Error fetching eligible users:", err.message);
        res.status(500).json({ ok: false, message: err.message });
    }
});

// Get call to fetch Project Detail
router.get("/getProject/:id", authenticateJWT, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid project ID" });

        const project = await DB.r_getProjectById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        res.json({ success: true, data: project });
    } catch (error) {
        console.error("❌ API error in getProject:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Post call to add Project Detail
router.post("/insertProject", authenticateJWT, async (req, res) => {
    try {
        const { project_name} = req.body;
        req.body.created_by = req.user.user_id;

        if (!project_name) {
            return res.status(400).json({
                ok: false,
                message: "Missing required fields: project_name"
            });
        }

        const result = await DB.r_insertProject(req.body);

        res.json({
            ok: true,
            message: "Project created successfully",
            project_id: result.project_id
        });
    } catch (error) {
        console.error("❌ API error in insertProject:", error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
}); 

// Post call to update an existing Project
router.post("/updateProject/:project_id", authenticateJWT, async (req, res) => {
    try {
        const project_id = parseInt(req.params.project_id);

        if (!project_id) {
            return res.status(400).json({ ok: false, message: "Missing project_id" });
        }

        const updated = await DB.r_updateProject(project_id, req.body);

        if (updated === 0) {
            return res.status(404).json({ ok: false, message: "No project fields updated" });
        }

        res.json({ ok: true, updated });
    } catch (error) {
        console.error("❌ API error in updateProject:", error.message);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

router.post("/updateMetadata", authenticateJWT, async (req, res) => {
  try {
    const { project_id, metadata } = req.body;

    if (!project_id || !metadata) {
      return res.status(400).json({ message: "Missing project_id or metadata" });
    }

    const affectedRows = await DB.r_updateProjectMetadata({
      project_id,
      metadata: JSON.stringify(metadata), // store as JSON string
    });

    if (affectedRows === 0) {
      return res.status(404).json({ message: "No project found to update" });
    }

    res.json({ success: true, updated: affectedRows });
  } catch (error) {
    console.error("❌ API error in updateMetadata:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get call to fetch all projects a user is involved using user_id
router.get("/userProjects/:user_id", authenticateJWT, async (req, res) => { 
    try {
        const user_id = parseInt(req.params.user_id);
        if (isNaN(user_id)) return res.status(400).json({ message: "Invalid project ID" });

        const projects = await DB.r_fetchProjectsByUser(user_id);
        if (!projects) return res.status(404).json({ message: "Projects not found" });

        res.json(projects);
    } catch (error) {
        console.error("❌ API error in getProject:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;

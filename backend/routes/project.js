import express from "express";
import * as DB from "./database.js"

const router = express.Router();

// Get call to fetch Project Detail
router.get("/getProject/:id", async (req, res) => {
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
router.post("/insertProject", async (req, res) => {
    try {
        const {
            user_roles = {},
            user_id,
            project_name,
            project_description = null,
            start_date,
            end_date = null,
            location = null,
            contract_no = null,
            Employer = null
        } = req.body;

        if (!project_name) {
            return res.status(400).json({ message: "Missing project_name" });
        }

        const insertId = await DB.r_insertProject({
            user_roles,
            user_id,
            project_name,
            project_description,
            start_date,
            end_date,
            location,
            contract_no,
            Employer
        });

        res.json({ success: true, insertId });

    } catch (error) {
        console.error("❌ API error in insertProject:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Post call to update an existing Project
router.post("/updateProject", async (req, res) => {
    try {
        const {
            project_id,
            user_roles = {},
            project_name,
            project_description = null,
            start_date = null,
            end_date = null,
            location = null,
            contract_no = null,
            Employer = null
        } = req.body;

        if (!project_id || !project_name) {
            return res.status(400).json({ message: "Missing project_id or project_name" });
        }

        const affectedRows = await DB.r_updateProject({
            project_id,
            user_roles,
            project_name,
            project_description,
            start_date,
            end_date,
            location,
            contract_no,
            Employer
        });

        if (affectedRows === 0) {
            return res.status(404).json({ message: "No project found to update" });
        }

        res.json({ success: true, updated: affectedRows });
    } catch (error) {
        console.error("❌ API error in updateProject:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get call to fetch all projects a user is involved using user_id
router.get("/userProjects/:user_id", async (req, res) => {
    try {
        const user_id = parseInt(req.params.user_id);
        if (isNaN(user_id)) return res.status(400).json({ message: "Invalid project ID" });

        const projects = await DB.r_fetchProjectsByUser(user_id);
        if (!projects) return res.status(404).json({ message: "Projects not found" });
        console.log(projects)

        res.json(projects);
    } catch (error) {
        console.error("❌ API error in getProject:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;

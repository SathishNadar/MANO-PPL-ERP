import express from "express";
import * as DB from "./database.js"
import { authenticateJWT } from "./auth.js";

const router = express.Router();

export async function checkUserProjectRole(user_id, project_id) {
  try {
    const role = await DB.r_getUserRoleForProject(user_id, project_id);

    if (!role) {
      return { ok: false, message: 'Forbidden: No access to this project.', role: null };
    }

    return { ok: true, role };
  } catch (error) {
    console.error(error);
    return { ok: false, message: 'Internal error checking access.', role: null};
  }
}




// Post call to Insert DPR
router.post("/insertDPR", authenticateJWT, async (req, res) => {  
  try {
    const {
      project_id,
      report_date,
      site_condition = null,
      labour_report = null,
      cumulative_manpower = 0,
      today_prog = null,
      tomorrow_plan = null,
      user_roles = null,
      report_footer = null,
      created_at = new Date()
    } = req.body || {};

    const user_id = req.user.user_id;
    const role = await checkUserProjectRole(user_id, project_id);

    if (!role.ok || !role.role || !role.role.can_create_dpr) {
      return res.status(403).json({ 
        success: false,
        message: "Forbidden: You do not have permission to create DPR for this project.",
        data: null
      });
    }

    if (!project_id || !report_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: project_id or report_date",
        data: null
      });
    }

    const result = await DB.r_insertDPR({
      project_id,
      report_date,
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      user_roles,
      report_footer,
      created_at
    });

    if (!result.ok) {
      return res.status(409).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error("Error inserting DPR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null
    });
  }
});

// Get call to fetch DPR
router.get("/getDPR/:id", authenticateJWT, async (req, res) => {
  try {
    const dpr_id = parseInt(req.params.id, 10);

    if (isNaN(dpr_id)) {
      return res.status(400).json({ message: "Invalid DPR ID" });
    }

    const user_id = req.user.user_id;
    const DprData = await DB.r_getDPRById(dpr_id);
    
    if (!DprData) {
      return res.status(404).json({ message: "DPR not found" });
    }
    
    const project_id = DprData.project_id;
    const role = await checkUserProjectRole(user_id, project_id);

    if (!role.ok || !role.role || !role.role.can_view_dpr) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to view this DPR." });
    }

    res.json({ success: true, data: DprData });

  } catch (error) {
    console.error("❌ API error in getDPR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Post call to update an existing DPR
router.post("/updateDPR", authenticateJWT, async (req, res) => {
  try {
    const {
      dpr_id,
      project_id,
      report_date,
      site_condition = null,
      labour_report = null,
      cumulative_manpower = 0,
      today_prog = null,
      tomorrow_plan = null,
      user_roles = null,
      report_footer = null,
      created_at = null
    } = req.body || {};

    const user_id = req.user.user_id;
    const role = await checkUserProjectRole(user_id, project_id);

    if (!role.ok || !role.role || !role.role.can_edit_dpr) {
      return res.status(403).json({ 
        success: false,
        message: "Forbidden: You do not have permission to edit DPR for this project.",
        data: null
      });
    }

    const current_handler = await DB.getCurrentHandlerForDpr(dpr_id);

    if (user_id != current_handler) {
      return res.status(403).json({ 
        success: false,
        message: "Forbidden: This DPR is under another user's control.",
        data: null
      });
    }

    if (!dpr_id || !project_id || !report_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: project_id or report_date",
        data: null
      });
    }

    const affectedRows = await DB.r_updateDPR({
      dpr_id,
      project_id,
      report_date,
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      user_roles,
      report_footer,
      created_at
    });

    if (affectedRows === 0) {
      return res.status(404).json({ message: "No DPR found to update" });
    }

    res.json({ success: true, updated: affectedRows });
  } catch (error) {
    console.error("❌ API error in updateDPR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get call to fetch DPR Initial Data
router.get("/initDPR/:project_id", authenticateJWT, async (req, res) => {
  try {
    const project_id = parseInt(req.params.project_id, 10);
    if (isNaN(project_id)) {
      return res.status(400).json({ message: "Invalid DPR ID" });
    }

    const user_id = req.user.user_id;
    const role = await checkUserProjectRole(user_id, project_id);

    if (!role.ok || !role.role || !role.role.can_create_dpr) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to create DPR for this project." });
    }

    const project_data = await DB.r_getProjectById(project_id);
    const prev_dpr = await DB.r_fetchLastDPR(project_id);

    const init_data = {
      ...project_data,
      cumulative_manpower_till_date: prev_dpr?.cumulative_manpower ?? 0,
      todays_plan: prev_dpr?.tomorrow_plan ?? { plan: [], qty: [] }
    };

    res.json(init_data);
  } catch (error) {
    console.error("❌ API error in getDPR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get call to fetch all DPR under a project
router.get("/allDPR/:project_id", authenticateJWT, async (req, res) => {
  try {
    const project_id = parseInt(req.params.project_id, 10);
    const limit = req.query.limit ?? 50;

    if (isNaN(project_id)) {
      return res.status(400).json({ message: "Invalid Project ID" });
    }

    
    const user_id = req.user.user_id;
    const role = await checkUserProjectRole(user_id, project_id);

    if (!role.ok || !role.role || !role.role.can_view_dpr) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to view this DPR." });
    }

    const projects = await DB.r_fetchDPRsByProject(project_id, limit);
    if (!projects) {
      return res.status(404).json({ message: "Projects not found" });
    }

    res.json(projects);
  } catch (error) {
    console.error("❌ API error in getDPR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;


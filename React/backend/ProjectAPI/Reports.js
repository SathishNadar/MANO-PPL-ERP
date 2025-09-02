import express from "express";
import * as DB from "../Database.js"
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

export async function checkUserProjectRole(user_id, project_id) {
  try {
    const role = await DB.getUserRoleForProject(user_id, project_id);

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
    // Extract fields from request body with default values
    const {
      project_id,
      report_date,
      site_condition = null,
      labour_report = null,
      cumulative_manpower = 0,
      today_prog = null,
      tomorrow_plan = null,
      report_footer = null
    } = req.body || {};

    const user_id = req.user.user_id;
    const role = await checkUserProjectRole(user_id, project_id);
    
    // Check if user has permission to create DPR in this project
    if (!role.ok || !role.role || !role.role.can_create_dpr) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to create DPR for this project.",
        data: null
      });
    }

    // Validate required fields; if missing return 400 Bad Request
    if (!project_id || !report_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: project_id or report_date",
        data: null
      });
    }

    // Insert the DPR data in the database
    const result = await DB.insertDPR({
      user_id,
      project_id,
      report_date,
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      report_footer
    });

    if (!result.ok) {
      return res.status(409).json(result);
    }

    return res.status(201).json(result);

  } catch (error) {
    console.error("Error inserting DPR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null
    });
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
    const prev_dpr = await DB.fetchLastDPR(project_id);

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

// Get call to fetch DPR
router.get("/getDPR/:id", authenticateJWT, async (req, res) => {
  try {
    const dpr_id = parseInt(req.params.id, 10);

    if (isNaN(dpr_id)) {
      return res.status(400).json({ message: "Invalid DPR ID" });
    }

    const user_id = req.user.user_id;
    const DprData = await DB.getDPRById(dpr_id);
    
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

    const projects = await DB.fetchDPRsByProject(project_id, limit);
    if (!projects) {
      return res.status(404).json({ message: "Projects not found" });
    }

    res.json(projects);
  } catch (error) {
    console.error("❌ API error in getDPR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Post call to update an existing DPR
router.post("/updateDPR/:dpr_id", authenticateJWT, async (req, res) => {
  try {
    // Extract fields without default values so undefined means "not provided"
    const {
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      report_footer,
    } = req.body || {};

    const dpr_id = parseInt(req.params.dpr_id, 10);
    const project_id = await DB.getProject_idByDpr_id(dpr_id);
    const user_id = req.user.user_id;

    // Permission check
    const role = await checkUserProjectRole(user_id, project_id);
    if (!role.ok || !role.role || !role.role.can_edit_dpr) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to edit DPR for this project.",
        data: null
      });
    }

    // Handler check
    const current_handler = await DB.getCurrentHandlerForDpr(dpr_id);
    if (user_id !== current_handler) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: This DPR is under another user's control.",
        data: null
      });
    }

    // Validate IDs
    if (!dpr_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: dpr_id",
        data: null
      });
    }

    // Build update data object; properties undefined if not sent
    const updateData = {
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      report_footer
    };

    const affectedRows = await DB.updateDPR(dpr_id, updateData);

    if (affectedRows === 0) {
      return res.status(404).json({ message: "No DPR found to update" });
    }

    return res.json({ success: true, updated: affectedRows });

  } catch (error) {
    console.error("❌ API error in updateDPR:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get call to submit a DPR
router.get("/submit/:dpr_id", authenticateJWT, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    console.log(user_id)
    const dpr_id = parseInt(req.params.dpr_id, 10);

    // Call the DPR submit function
    const result = await DB.submitDPR(dpr_id, user_id);
    
    res.json({ success: true, message: "DPR submitted successfully", data: result });
  } catch (error) {
    // Permission or state errors
    if (error.message === "DPR not found") {
      res.status(404).json({ success: false, message: "DPR not found" });
    } else if (
      error.message === "You are not the current handler for this DPR" ||
      error.message === "Only the reporter can submit at this stage" ||
      error.message === "Only the approver can submit at this stage" ||
      error.message === "Only the final approver can submit at this stage"
    ) {
      res.status(403).json({ success: false, message: error.message });
    } else if (error.message === "DPR already approved or in invalid state") {
      res.status(400).json({ success: false, message: error.message });
    } else {
      console.error("❌ API error in Submit DPR:", error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
});


// const t = await DB.submitDPR(6, 75);
// console.log(t)

export default router;


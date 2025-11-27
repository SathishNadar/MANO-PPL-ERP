import express from "express";
import * as DB from "../Database.js"
import { knexDB } from "../Database.js"
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();


/* ───────────────── Queries ───────────────── */




// Today Progress fetch
async function getTodayProgByDprId(dpr_id) {
  // adjust table/columns as per your schema
  const rows = await knexDB("dpr_component_use as dcu")
  .join("component as c", "dcu.component_id", "c.component_id")
  .select(
    "dcu.dpr_use_id",
    "c.component_id",
    "c.name as component_name",
    "c.unit",
    "dcu.quantity",
    "dcu.remarks",
  )
  .where("dcu.dpr_id", dpr_id);

  return rows || null;
}

// Tomorrow Planning fetch
async function getTomPlanByDprId(dpr_id) {
  // adjust table/columns as per your schema
  const rows = await knexDB("dpr_component_plan as dcp")
  .join("component as c", "dcp.component_id", "c.component_id")
  .select(
    "dcp.dpr_plan_id",
    "c.component_id",
    "c.name as component_name",
    "c.unit",
    "dcp.quantity",
    "dcp.remarks",
  )
  .where("dcp.dpr_id", dpr_id);

  return rows || null;
}

// User Role fetch
async function getUserRoleForProject(user_id, project_id) {
  try {
    const row = await knexDB("project_user_roles as upr")
      .join("roles as r", "upr.role_id", "r.role_id")
      .where("upr.user_id", user_id)
      .andWhere("upr.project_id", project_id)
      .select("r.*")
      .first();

    return row;
  } catch (error) {
    console.error("Error fetching user role:", error);
    throw error;
  }
}

// All user in a project fetch
async function getUsersInvolvedInProject(project_id) {
  try {
    const rows = await knexDB("project_user_roles as upr")
      .join("roles as r", "upr.role_id", "r.role_id")
      .select("upr.user_id", "r.role_name")
      .where("upr.project_id", project_id);

    if (!rows || rows.length === 0) {
      return { ok: false, message: "No users involved in this project." };
    }

    // Build role → list of user_ids
    const roleMap = {};

    for (const { user_id, role_name } of rows) {
      if (!roleMap[role_name]) {
        roleMap[role_name] = [];
      }
      roleMap[role_name].push(user_id);
    }

    // Convert approver & final_approver to a single user if only one allowed
    ["approver", "final_approver"].forEach((role) => {
      if (roleMap[role] && roleMap[role].length > 0) {
        roleMap[role] = roleMap[role][0]; // pick one
      } else {
        delete roleMap[role];
      }
    });

    return { ok: true, data: roleMap };

  } catch (error) {
    console.error("Error fetching users involved in project:", error);
    throw error;
  }
}

// Last DPR fetch
async function getLastDpr(project_id) {
  const { dpr_id } = await knexDB("dpr")
    .select("dpr_id")
    .where({ project_id })
    .orderBy("report_date", "desc")
    .first();
  
  return await getDPRById(dpr_id);
}

// Get DPR by dpr_id
async function getDPRById(dpr_id) {
  if (!dpr_id) {
    throw new Error("DPR ID is required");
  }

  try {
    const row = await knexDB("dpr")
      .where({ dpr_id })
      .first();

    if (!row) return null;

    return {
      ...row,
      site_condition: safeParse(row.site_condition),
      labour_report: safeParse(row.labour_report),
      today_prog: await getTodayProgByDprId(dpr_id),
      tomorrow_plan: await getTomPlanByDprId(dpr_id),
      user_roles: safeParse(row.user_roles),
      events_remarks: safeParse(row.events_remarks),
      general_remarks: safeParse(row.general_remarks),
      report_footer: safeParse(row.report_footer)
    };

  } catch (error) {
    console.error("❌ Error fetching DPR by ID:", error.message);
    throw error;
  }
}

// Get Project by DPR fetch
async function getProject_idByDpr_id(dpr_id) {
  try {
    const row = await knexDB("dpr")
      .select("project_id")
      .where("dpr_id", dpr_id)
      .first();  // returns one row instead of array

    if (!row) {
      return null;  // exactly like your SQL version
    }

    return row.project_id;
  } catch (error) {
    console.error("Error fetching project_id by dpr_id:", error);
    throw error;
  }
}

// Get DPR by project id
async function fetchDPRsByProject(project_id, limit = 20) {
  try {
    const rows = await knexDB("dpr")
      .select(
        "dpr_id",
        "report_date",
        "dpr_status",
        "current_handler",
        "created_by",
        "approved_by",
        "final_approved_by"
      )
      .where({ project_id })
      .orderBy("report_date", "desc")
      .limit(Number(limit));

    return rows; // always an array
  } catch (error) {
    console.error("❌ Error fetching DPRs for project (knex):", error);
    throw error;
  }
}


/* ───────────────── HELPERS ───────────────── */

async function checkUserProjectRole(user_id, project_id) {
  try {
    const role = await getUserRoleForProject(user_id, project_id);

    if (!role) {
      return { ok: false, message: 'Forbidden: No access to this project.', role: null };
    }

    return { ok: true, role };
  } catch (error) {
    console.error(error);
    return { ok: false, message: 'Internal error checking access.', role: null};
  }
}

async function dprInitData(project_id) {
  try {
    const project_data = await DB.r_getProjectById(project_id);
    const prev_dpr = await getLastDpr(project_id);

    const init_data = {
      ...project_data,
      cumulative_manpower_till_date: prev_dpr?.cumulative_manpower ?? 0,
      todays_plan: prev_dpr?.tomorrow_plan ?? { plan: [], qty: [] }
    };

    return init_data;

  } catch (error) {
    console.error(error);
    return { ok: false, message: 'Internal error checking access.', role: null};
  }
}

function safeParse(jsonField) {
  if (!jsonField) return {};
  if (typeof jsonField === "object") return jsonField;

  try {
    return JSON.parse(jsonField);
  } catch (err) {
    console.error("❌ Failed to parse JSON field:", jsonField);
    return {};
  }
}

/* ───────────────── API ───────────────── */

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
      return res.status(400).json({ message: "Invalid Project ID" });
    }

    const user_id = req.user.user_id;
    const role = await checkUserProjectRole(user_id, project_id);

    if (!role.ok || !role.role || !role.role.can_create_dpr) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to create DPR for this project." });
    }

    const init_data = await dprInitData(project_id);

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
    const DprData = await getDPRById(dpr_id);
    
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

    const projects = await fetchDPRsByProject(project_id, limit);
    if (!projects) {
      return res.status(404).json({ message: "Projects not found" });
    }

    const data = {
      projects,
      role
    }

    res.json(data);
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



const data = {
    "dpr_id": 127,
    "project_id": 1,
    "report_date": "2025-11-24T18:30:00.000Z",
    "site_condition": {
        "is_rainy": false,
        "rain_timing": [],
        "ground_state": "dry"
    },
    "labour_report": {
        "staff": [
            0,
            0,
            0,
            0
        ],
        "agency": [
            "MAPLANI",
            "L&T",
            "AMAZON",
            "NVIDIA"
        ],
        "fitter": [
            0,
            0,
            0,
            0
        ],
        "gypsum": [
            0,
            0,
            0,
            0
        ],
        "helper": [
            0,
            0,
            0,
            0
        ],
        "painter": [
            0,
            0,
            0,
            0
        ],
        "plumber": [
            0,
            0,
            0,
            0
        ],
        "remarks": [
            "",
            "",
            "",
            ""
        ],
        "carpenter": [
            0,
            0,
            0,
            0
        ]
    },
    "cumulative_manpower": 0,
    "today_prog": {
        "qty": [
            "",
            "",
            ""
        ],
        "unit": [
            "",
            "",
            ""
        ],
        "items": [
            "h",
            "222",
            "gtdfv4"
        ],
        "remarks": [
            "",
            "",
            ""
        ]
    },
    "tomorrow_plan": {
        "qty": [
            "",
            ""
        ],
        "unit": [
            "",
            ""
        ],
        "items": [
            "5eff",
            "fr4f"
        ],
        "remarks": [
            "",
            ""
        ]
    },
    "report_footer": {
        "distribute": [
            "Mano Bharathi",
            "syed quazi"
        ],
        "prepared_by": "Mano Projects Pvt. Ltd.",
        "events_visit": [],
        "bottom_remarks": [
            "To make API requests to Zoom, start by obtaining an access token through OAuth or server-to-server authentication. Send HTTP requests to the base URL https://api.zoom.us/v2/ with your access token in the Authorization header. Use GET, POST, PATCH, PUT, or DELETE methods as needed for different endpoints. Refer to the API reference for specific endpoint details and required parameters."
        ]
    },
    "created_at": "2025-11-25T00:23:55.000Z",
    "created_by": 6,
    "approved_by": null,
    "final_approved_by": null,
    "current_handler": 6,
    "dpr_status": "in_progress",
    "user_roles": {},
    "events_remarks": {},
    "general_remarks": {}
}


// const t = await getProject_idByDp 

export default router;


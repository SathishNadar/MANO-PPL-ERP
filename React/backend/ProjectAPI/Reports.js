import express from "express";
import * as DB from "../Database.js"
import { knexDB } from "../Database.js"
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();


/* ───────────────── Queries ───────────────── */

/* ------------------ Fetch ------------------ */

// Today Progress fetch
async function getTodayProgByDprId(dpr_id) {
  // adjust table/columns as per your schema
  const rows = await knexDB("dpr_item_use as diu")
  .join("item as i", "diu.item_id", "i.item_id")
  .select(
    "diu.dpr_use_id",
    "i.item_id",
    "i.name as item_name",
    "i.unit",
    "diu.quantity",
    "diu.remarks",
  )
  .where("diu.dpr_id", dpr_id);

  return rows || null;
}

// Tomorrow Planning fetch
async function getTomPlanByDprId(dpr_id) {
  // adjust table/columns as per your schema
  const rows = await knexDB("dpr_item_plan as dip")
  .join("item as i", "dip.item_id", "i.item_id")
  .select(
    "dip.dpr_plan_id",
    "i.item_id",
    "i.name as item_name",
    "i.unit",
    "dip.quantity",
    "dip.remarks",
  )
  .where("dip.dpr_id", dpr_id);

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
async function getDPRsByProject(project_id, limit = 20) {
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

// Get current handler of dpr
async function getCurrentHandlerForDpr(dpr_id) {
  const row = await knexDB("dpr")
    .select("current_handler")
    .where({ dpr_id })
    .first();

  return row ? row.current_handler : null;
}

// Get latest rate for a given item_id
async function getLatestRatesForItems(itemIds) {
  if (!Array.isArray(itemIds) || itemIds.length === 0)
    throw new Error("Item list is empty");

  const rows = await knexDB("item_rate")
    .whereIn("item_id", itemIds)
    .orderBy([
      { column: "item_id", order: "asc" },
      { column: "effective_from", order: "desc" }
    ]);

  const latest = {};
  for (const row of rows) {
    if (!latest[row.item_id]) {
      latest[row.item_id] = row.rate_id;
    }
  }

  // Mandatory check: If any item has no rate, throw error
  for (const itemId of itemIds) {
    if (!latest[itemId]) {
      throw new Error(`Rate not found for item_id: ${itemId}`);
    }
  }

  return latest;
}


/* ------------------ Manipulation ------------------ */

// Insert Today Progress
async function insertTodayProg(dpr_id, items = []) {
  if (!dpr_id) throw new Error("Missing dpr_id");
  if (!Array.isArray(items)) throw new Error("Items must be an array");

  const itemIds = items.map(i => i.item_id);

  // Fetch latest mandatory rates
  const latestRates = await getLatestRatesForItems(itemIds);

  const rows = items.map(item => ({
    dpr_id,
    item_id: item.item_id,
    rate_id: latestRates[item.item_id],  // always exists
    quantity: item.quantity ?? 0,
    remarks: item.remarks ?? null
  }));

  try {
    const inserted = await knexDB("dpr_item_use").insert(rows);
    return { ok: true, insertedCount: inserted.length };
  } catch (err) {
    console.error("❌ Insert Today Progress Error:", err.message);
    throw err;
  }
}

// Insert Tomorrow Plan
async function insertTomPlan(dpr_id, items = []) {
  if (!dpr_id) throw new Error("Missing dpr_id");
  if (!Array.isArray(items)) throw new Error("Items must be an array");

  const itemIds = items.map(i => i.item_id);

  // Fetch latest mandatory rates
  const latestRates = await getLatestRatesForItems(itemIds);

  const rows = items.map(item => ({
    dpr_id,
    item_id: item.item_id,
    rate_id: latestRates[item.item_id], // always exists
    quantity: item.quantity ?? 0,
    remarks: item.remarks ?? null
  }));

  try {
    const inserted = await knexDB("dpr_item_plan").insert(rows);
    return { ok: true, insertedCount: inserted.length };
  } catch (err) {
    console.error("❌ Insert Tomorrow Plan Error:", err.message);
    throw err;
  }
}

// Completely replace today_prog rows for a DPR
async function replaceTodayProg(dpr_id, items = []) {
  try {
    // Delete existing rows
    await knexDB("dpr_item_use")
      .where({ dpr_id })
      .del();

    // Insert new rows (reuses your insert function)
    await insertTodayProg(dpr_id, items);

  } catch (err) {
    console.error("❌ Replace Today Progress Error:", err.message);
    throw err;
  }
}

// Completely replace tomorrow_plan rows for a DPR
async function replaceTomPlan(dpr_id, items = []) {
  try {
    // Delete existing rows
    await knexDB("dpr_item_plan")
      .where({ dpr_id })
      .del();

    // Insert new rows (reuses your insert function)
    await insertTomPlan(dpr_id, items);

  } catch (err) {
    console.error("❌ Replace Tomorrow Plan Error:", err.message);
    throw err;
  }
}

// Insert DPR
async function insertDPR(dprData) {
  if (!dprData.project_id || !dprData.report_date) {
    throw new Error("Missing required fields: project_id or report_date");
  }

  // 1. Check if DPR already exists
  const existing = await knexDB("dpr")
    .select("dpr_id")
    .where({
      project_id: dprData.project_id,
      report_date: dprData.report_date,
    })
    .first();

  if (existing) {
    return { ok: false, message: "DPR already exists for this date.", data: null };
  }

  const serialize = (v) => (v ? JSON.stringify(v) : null);

  const payload = {
    project_id: dprData.project_id,
    report_date: dprData.report_date,
    site_condition: serialize(dprData.site_condition),
    labour_report: serialize(dprData.labour_report),
    cumulative_manpower: dprData.cumulative_manpower ?? 0,
    today_prog: serialize(dprData.today_prog),
    tomorrow_plan: serialize(dprData.tomorrow_plan),
    report_footer: serialize(dprData.report_footer),
    created_by: dprData.user_id,
    current_handler: dprData.user_id,
  };

  // 2. Insert DPR
  try {
    const [dpr_id] = await knexDB("dpr").insert(payload);
    const todayArr = Array.isArray(dprData.today_prog) ? dprData.today_prog : [];
    const tomArr = Array.isArray(dprData.tomorrow_plan) ? dprData.tomorrow_plan : [];

    if (todayArr.length > 0) {
      await insertTodayProg(dpr_id, todayArr);
    }

    if (tomArr.length > 0) {
      await insertTomPlan(dpr_id, tomArr);
    }

    return {
      ok: true,
      message: "DPR inserted successfully.",
      data: { dpr_id },
    };
  } catch (error) {
    console.error("❌ Error inserting DPR:", error);
    throw error;
  }
}

// Update DPR (only dpr table)
async function updateDPR(dpr_id, dprData) {
  if (!dpr_id) {
    throw new Error("Missing required field: dpr_id");
  }

  const allowedColumns = new Set([
    "report_date",
    "site_condition",
    "labour_report",
    "cumulative_manpower",
    "today_prog",       // keep if you still store JSON snapshot
    "tomorrow_plan",   // same
    "report_footer",
    "created_by",
    "approved_by",
    "final_approved_by",
    "current_handler",
    "dpr_status",
  ]);

  const jsonColumns = new Set([
    "site_condition",
    "labour_report",
    "today_prog",
    "tomorrow_plan",
    "report_footer",
  ]);

  const updatePayload = {};

  for (const key of Object.keys(dprData)) {
    if (!allowedColumns.has(key)) continue;
    if (dprData[key] === undefined) continue;

    let value = dprData[key];

    if (value === null) {
      updatePayload[key] = null;
    } else if (jsonColumns.has(key)) {
      updatePayload[key] = JSON.stringify(value);
    } else {
      updatePayload[key] = value;
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new Error("No valid fields provided to update");
  }

  try {
    const result = await knexDB("dpr")
      .where({ dpr_id })
      .update(updatePayload);

    return result; // affected rows
  } catch (error) {
    console.error("❌ Error updating DPR (knex):", error, "\nData:", dprData);
    throw error;
  }
}

// Update DPR (with today progress and tomorrow plan)
async function updateDPRWithProgAndPlan(dpr_id, dprData) {
  // Split out today_prog and tomorrow_plan arrays from the rest
  const { today_prog, tomorrow_plan, ...rest } = dprData;

  // 1) Update main DPR row (JSON snapshot / meta)
  let affectedRows = 0;
  if (Object.keys(rest).length > 0 || today_prog !== undefined || tomorrow_plan !== undefined) {
    // pass today_prog/tomorrow_plan if you still want JSON snapshot in dpr table
    const baseUpdatePayload = { ...rest };
    if (today_prog !== undefined) baseUpdatePayload.today_prog = today_prog;
    if (tomorrow_plan !== undefined) baseUpdatePayload.tomorrow_plan = tomorrow_plan;

    affectedRows = await updateDPR(dpr_id, baseUpdatePayload);
  }

  // 2) Replace today_prog rows if provided as array
  if (Array.isArray(today_prog)) {
    await replaceTodayProg(dpr_id, today_prog);
  }

  // 3) Replace tomorrow_plan rows if provided as array
  if (Array.isArray(tomorrow_plan)) {
    await replaceTomPlan(dpr_id, tomorrow_plan);
  }

  return affectedRows;
}


/* ───────────────── HELPERS ───────────────── */

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

    console.log(prev_dpr)
    console.log(project_data)

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

async function submitDPR(dpr_id, user_id) {
  // 1. Fetch DPR
  const dpr = await knexDB("dpr").where({ dpr_id }).first();
  if (!dpr) throw new Error("DPR not found");

  // 2. Validate state + handler
  if (dpr.dpr_status === "approved") throw new Error("DPR is already approved");
  if (dpr.current_handler !== user_id) {
    throw new Error("You are not the current handler for this DPR");
  }

  // 3. Get user role and users involved
  const project_id = await knexDB("dpr")
    .where({ dpr_id })
    .first()
    .then(row => row?.project_id);

  const userRole = await getUserRoleForProject(user_id, project_id);
  const { data: users_involved = {} } = await getUsersInvolvedInProject(project_id);

  let next_handler = null;
  let new_status = "";
  let fieldsToUpdate = {};

  // 4. Workflow logic
  if (dpr.dpr_status === "in_progress") {
    if (userRole.role_name !== "reporter") {
      throw new Error("Only the reporter can submit at this stage");
    }

    if (!users_involved.approver && !users_involved.final_approver) {
      next_handler = null;
      new_status = "approved";
    } else if (users_involved.approver) {
      next_handler = users_involved.approver;
      new_status = "under_review";
    }
  }

  else if (dpr.dpr_status === "under_review") {
    if (userRole.role_name !== "approver") {
      throw new Error("Only the approver can submit at this stage");
    }

    fieldsToUpdate.approved_by = user_id;

    if (!users_involved.final_approver) {
      next_handler = null;
      new_status = "approved";
    } else {
      next_handler = users_involved.final_approver;
      new_status = "final_review";
    }
  }

  else if (dpr.dpr_status === "final_review") {
    if (userRole.role_name !== "final_approver") {
      throw new Error("Only the final approver can submit at this stage");
    }

    fieldsToUpdate.final_approved_by = user_id;
    next_handler = null;
    new_status = "approved";
  }

  else {
    throw new Error("DPR in invalid state");
  }

  // 5. Update DPR using knex
  fieldsToUpdate.current_handler = next_handler;
  fieldsToUpdate.dpr_status = new_status;

  await knexDB("dpr")
    .where({ dpr_id })
    .update(fieldsToUpdate);

  return { ok: true, new_status, next_handler };
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
    const result = await insertDPR({
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

    const projects = await getDPRsByProject(project_id, limit);
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

// POST /updateDPR/:dpr_id
router.post("/updateDPR/:dpr_id", authenticateJWT, async (req, res) => {
  try {
    const {
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      report_footer,
    } = req.body || {};

    const dpr_id = parseInt(req.params.dpr_id, 10);
    if (isNaN(dpr_id)) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid dpr_id",
        data: null,
      });
    }

    // get project_id for permission checks
    const project_id = await getProject_idByDpr_id(dpr_id);

    const user_id = req.user.user_id;

    // role check
    const role = await checkUserProjectRole(user_id, project_id);
    if (!role.ok || !role.role || !role.role.can_edit_dpr) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to edit DPR for this project.",
        data: null,
      });
    }

    // handler check
    const current_handler = await getCurrentHandlerForDpr(dpr_id);
    if (user_id !== current_handler) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: This DPR is under another user's control.",
        data: null,
      });
    }

    const updateData = {
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,     // can be array or undefined
      tomorrow_plan,  // can be array or undefined
      report_footer,
    };

    const affectedRows = await updateDPRWithProgAndPlan(dpr_id, updateData);

    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: "No DPR found to update" });
    }

    return res.json({ success: true, updated: affectedRows });
  } catch (error) {
    console.error("❌ API error in updateDPR:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get call to submit a DPR
router.get("/submit/:dpr_id", authenticateJWT, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const dpr_id = parseInt(req.params.dpr_id, 10);

    // Call the DPR submit function
    const result = await submitDPR(dpr_id, user_id);
    
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


export default router;
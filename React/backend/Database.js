import mysql from 'mysql2';
import Fuse from "fuse.js";
import knex from 'knex';
import './config.js';

// Create a MySQL pool with connection details
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}).promise();


export const knexDB = knex({
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  pool: { min: 2, max: 10 },
});



// #region 🛠️ HELP FUNCTIONS ─────────────────────────────────────────────

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

// #endregion

// #region 🧑‍💼 USERS ─────────────────────────────────────────────

export const ALLOWED_UPDATE_FIELDS = new Set([
  "user_name",
  "user_password",
  "email",
  "phone_no",
  "title_id",
]);

// Function to fetch User by user_name
export async function r_fetchUserByName(name) {
  const query = `SELECT 
      u.user_id, 
      u.user_name, 
      u.user_password, 
      u.email, 
      t.title_id AS title_id,
      t.title_name AS title_name
    FROM users u
    JOIN titles t ON u.title_id = t.title_id
    WHERE u.user_name = ?;
    `;
  try {
    const [row] = await pool.query(query, [name]);
    return row[0] || null;
  } catch (error) {
    console.error("Error fetching user by name:", error);
    throw error;
  }
}

// Function to fetch all users
export async function getAllUsers() {
  const Query = `SELECT 
      u.user_id, 
      u.user_name,
      u.email,
      u.phone_no, 
      t.title_name AS title_name
    FROM users u
    JOIN titles t ON u.title_id = t.title_id`;

  try {
    const [Rows] = await pool.query(Query);

    return { ok: true, users: Rows };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { ok: false, message: 'Database error' };
  }
}

// Function to fetch User by email
export async function r_fetchUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = ?"
  try {
    const [row] = await pool.query(query, [email]);
    return row[0] || null;
  } catch (error) {
    console.error("Error fetching user by name:", error);
    throw error;
  }
}

// Function to update user password
export async function updateUserPassword(email, hashedPassword) {
  const query = "UPDATE users SET user_password = ? WHERE email = ?";
  try {
    const [result] = await pool.query(query, [hashedPassword, email]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error updating user password:", error);
    throw error;
  }
}

export async function checkUserExists(email, phone) {
  const [rows] = await pool.query(
    "SELECT user_id FROM users WHERE email = ? OR phone_no = ? LIMIT 1",
    [email, phone]
  );
  return rows.length > 0;
}

export async function insertUser(username, email, hashedPassword, phone) {
  try {
    const userInsertQuery = `INSERT INTO users (user_name, email, user_password, phone_no, title_id) VALUES (?, ?, ?, ?, ?)`;
    const [userResult] = await pool.query(userInsertQuery, [username, email, hashedPassword, phone, 1]);
    return !!userResult.insertId;
  } catch (error) {
    console.error('Error inserting user:', error);
    return false;
  }
}

export async function updateUserById(user_id, updates) {
  const fields = [];
  const values = [];

  for (const key in updates) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    return { ok: false, message: "No valid fields to update" };
  }

  values.push(user_id);
  const query = `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`;

  try {
    const [result] = await pool.query(query, values);
    if (result.affectedRows === 0) {
      return { ok: false, message: "User not found" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { ok: false, message: "Database error" };
  }
}

export async function updateUserByMail(email, updates) {
  const fields = [];
  const values = [];

  for (const key in updates) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    return { ok: false, message: "No valid fields to update" };
  }

  values.push(email);
  const query = `UPDATE users SET ${fields.join(", ")} WHERE email = ?`;

  try {
    const [result] = await pool.query(query, values);
    if (result.affectedRows === 0) {
      return { ok: false, message: "User not found" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { ok: false, message: "Database error" };
  }
}

export async function deleteUserById(user_id) {
  const query = 'DELETE FROM users WHERE user_id = ?';
  try {
    const [result] = await pool.query(query, [user_id]);
    if (result.affectedRows === 0) {
      return { ok: false, message: "User not found" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { ok: false, message: "Database error" };
  }
}

export async function getTitles() {
  const query = `SELECT title_id, title_name FROM titles;`;
  try {
    const [rows] = await pool.query(query, []);

    const titlesObj = rows.reduce((acc, item) => {
      acc[item.title_id] = item.title_name;
      return acc;
    }, {});

    return { ok: true, titles: titlesObj };
  } catch (error) {
    console.error('Error fetching titles:', error);
    return { ok: false, message: 'Database error' };
  }
}

// #endregion

// #region 🧱 PROJECT ─────────────────────────────────────────────

// Function to fetch Project by ID
export async function r_getProjectById(project_id) {
  if (!project_id) throw new Error("Project ID is required");

  const query = `SELECT * FROM projects WHERE project_id = ?`;

  try {
    const [rows] = await pool.query(query, [project_id]);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      user_roles: typeof row.user_roles === "string" ? JSON.parse(row.user_roles) : row.user_roles
    };
  } catch (error) {
    console.error("❌ Error fetching project by ID:", error.message);
    throw error;
  }
}

// Function to fetch all projects a user is involved
export async function r_fetchProjectsByUser(user_id) {
  const query = `
    SELECT 
      p.project_id,
      p.project_name,
      p.project_description,
      p.start_date,
      p.end_date,
      p.project_code,
      p.location
    FROM projects p
    JOIN project_user_roles pur ON p.project_id = pur.project_id
    WHERE pur.user_id = ?;
  `;

  try {
    const [rows] = await pool.query(query, [user_id]);
    return rows || [];
  } catch (error) {
    console.error("❌ Error fetching projects for user:", error);
    throw error;
  }
}

// Exported function to get eligible users (title_id < 6)
export async function r_getEligibleUsers() {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, user_name AS name, title_id FROM users WHERE title_id < 6`
    );
    return rows;
  } catch (error) {
    console.error("❌ Error fetching eligible users:", error.message);
    throw error;
  }
}

// Function to insert Project
export async function r_insertProject(data) {
  const {
    project_name,
    created_by,
    project_description = null,
    start_date = null,
    end_date = null,
    location = null,
    project_code = null,
    Employer = null,
    metadata = null,
    user_roles = {}
  } = data;

  if (!project_name || !created_by) {
    throw new Error("Missing required field: project_name or created_by");
  }

  const metadataValue = metadata ? JSON.stringify(metadata) : null;

  const insertSQL = `
        INSERT INTO projects (
            project_name,
            project_description,
            start_date,
            end_date,
            location,
            project_code,
            Employer,
            metadata,
            created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

  const values = [
    project_name,
    project_description,
    start_date,
    end_date,
    location,
    project_code,
    Employer,
    metadataValue,
    created_by
  ];

  try {
    const [projResult] = await pool.query(insertSQL, values);
    const newProjectId = projResult.insertId;

    // Always set reporter to creator if not already set
    if (!user_roles.reporter) {
      user_roles.reporter = { insert: [created_by] }; // Wrap as insert array
    }
    if (user_roles && typeof user_roles === 'object' && Object.keys(user_roles).length > 0) {
      const roleUpdateResult = await patchProjectRoles(newProjectId, user_roles);
      if (!roleUpdateResult.ok) {
        throw new Error(`Project created but failed to set roles: ${roleUpdateResult.msg}`);
      }
    }

    return { ok: true, project_id: newProjectId };
  } catch (error) {
    console.error("❌ Error inserting project:", error.message);
    throw error;
  }
}

// Function to update Project
export async function r_updateProject(project_id, data) {
  const {
    user_roles,
    ...fields
  } = data;

  if (!project_id) {
    throw new Error("Missing required field: project_id");
  }

  const allowedColumns = new Set([
    'project_name',
    'project_description',
    'start_date',
    'end_date',
    'location',
    'project_code',
    'Employer',
    'metadata'
  ]);

  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(fields)) {
    if (!allowedColumns.has(key)) continue;
    if (typeof value === "undefined") continue;

    if (key === "metadata") {
      setClauses.push(`\`${key}\` = ?`);
      values.push(JSON.stringify(value)); // store as stringified JSON
    } else {
      setClauses.push(`\`${key}\` = ?`);
      values.push(value); // normal value
    }
  }

  let affectedRows = 0;

  if (setClauses.length > 0) {
    const sql = `
            UPDATE projects
            SET ${setClauses.join(', ')}
            WHERE project_id = ?;
        `;
    values.push(project_id);
    try {
      const [result] = await pool.query(sql, values);
      affectedRows = result.affectedRows;
    } catch (error) {
      console.error("❌ Error updating project:", error.message);
      throw error;
    }
  }

  if (user_roles && typeof user_roles === 'object' && Object.keys(user_roles).length > 0) {
    const roleUpdateResult = await patchProjectRoles(project_id, user_roles);
    if (!roleUpdateResult.ok) {
      throw new Error(`Project updated but failed to update roles: ${roleUpdateResult.msg}`);
    }
  }

  return affectedRows;
}

// Function to update Project
export async function r_updateProjectMetadata({ project_id, metadata }) {
  const [result] = await pool.execute(
    `UPDATE projects SET metadata = ? WHERE project_id = ?`,
    [metadata, project_id]
  )
};

// #endregion

// #region 🏷️ VENDOR ─────────────────────────────────────────────

// Fetch vendors with pagination, filtering and search
export async function fetchVendors({
  queryString = "",
  category = 0,
  limit = 11,
  page = 1,
  locationIds = [],
  jobNatureIds = [],
  order = 'ASC',
} = {}) {
  const offset = (page - 1) * limit;

  let baseQuery = "FROM vendors WHERE 1=1";
  const params = [];

  if (category !== 0) {
    baseQuery += " AND category_id = ?";
    params.push(category);
  }
  if (locationIds.length > 0) {
    baseQuery += ` AND location_id IN (${locationIds.map(() => '?').join(',')})`;
    params.push(...locationIds);
  }
  if (jobNatureIds.length > 0) {
    baseQuery += ` AND job_nature_id IN (${jobNatureIds.map(() => '?').join(',')})`;
    params.push(...jobNatureIds);
  }

  // If no search string, fetch paginated results directly from DB
  if (!queryString.trim()) {
    const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;
    const [[{ total }]] = await pool.query(countQuery, params);

    const fetchQuery = `SELECT * ${baseQuery} ORDER BY name ${order === 'DESC' ? 'DESC' : 'ASC'} LIMIT ? OFFSET ?`;
    const fetchParams = [...params, limit, offset];
    const [vendors] = await pool.query(fetchQuery, fetchParams);

    return {
      vendors,
      vendorCount: total,
    };
  }

  // With search, fetch ALL matching vendors (no limit, no offset)
  const fullFetchQuery = `SELECT * ${baseQuery} ORDER BY name ${order === 'DESC' ? 'DESC' : 'ASC'}`;
  const [allVendors] = await pool.query(fullFetchQuery, params);

  const fuse = new Fuse(allVendors, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "remarks", weight: 0.2 },
      { name: "email", weight: 0.1 },
      { name: "website", weight: 0.1 },
      { name: "telephone", weight: 0.05 },
      { name: "mobile", weight: 0.05 },
      { name: "reference", weight: 0.025 },
      { name: "contact_person", weight: 0.025 },
    ],
    threshold: 0.4,
  });
  const results = fuse.search(queryString).map(r => r.item);

  const paginatedResults = results.slice(offset, offset + limit);

  return {
    vendors: paginatedResults,
    vendorCount: results.length,
  };
}

// Insert a new vendor
export async function r_insertVendor(data) {
  const query = `
        INSERT INTO vendors (
            name, job_nature_id, contact_person, telephone_no, mobile,
            location_id, email, address, gst_no, constitution,
            website, reference, remarks, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  const params = [
    data.name, data.job_nature_id, data.contact_person, data.telephone_no, data.mobile,
    data.location_id, data.email, data.address, data.gst_no, data.constitution,
    data.website, data.reference, data.remarks, data.category_id
  ];

  const [result] = await pool.query(query, params);
  return { id: result.insertId };
}

// Update existing vendor
export async function r_updateVendor(id, data) {
  const query = `
        UPDATE vendors SET
            name = ?, job_nature_id = ?, contact_person = ?, telephone_no = ?, mobile = ?,
            location_id = ?, email = ?, address = ?, gst_no = ?, constitution = ?,
            website = ?, reference = ?, remarks = ?, category_id = ?
        WHERE id = ?
    `;
  const params = [
    data.name, data.job_nature_id, data.contact_person, data.telephone_no, data.mobile,
    data.location_id, data.email, data.address, data.gst_no, data.constitution,
    data.website, data.reference, data.remarks, data.category_id,
    id
  ];

  const [result] = await pool.query(query, params);
  return { affectedRows: result.affectedRows };
}

// Delete vendor
export async function r_deleteVendor(id) {
  const query = `DELETE FROM vendors WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return { affectedRows: result.affectedRows };
}

// Fetch Count of vendors in table
export async function r_fetchVendorsCount() {
  const query = "SELECT COUNT(*) AS count FROM vendors";
  try {
    const [[result]] = await pool.query(query);
    return result.count;
  } catch (error) {
    console.error("Error fetching vendor count:", error);
    throw error;
  }
}

// Fetch all Job Natures in table
export async function r_fetchVendorsAllJobNatures() {
  const query = `SELECT job_id, job_name FROM job_nature`;
  try {
    const [rows] = await pool.query(query);
    return Object.fromEntries(rows.map(row => [row.job_name, row.job_id]));
  } catch (error) {
    console.error(`Error fetching data from job_nature:`, error);
    throw error;
  }
}

// Fetch all Locations in table
export async function r_fetchVendorsAllLocations() {
  const query = `SELECT loc_id, loc_name FROM locations`;
  try {
    const [rows] = await pool.query(query);
    return Object.fromEntries(rows.map(row => [row.loc_name, row.loc_id]));
  } catch (error) {
    console.error(`Error fetching data from locations:`, error);
    throw error;
  }
}

// #endregion

// #region 📝 DPR  ─────────────────────────────────────────────

// Fetch DPR by ID
export async function getDPRById(dpr_id) {
  if (!dpr_id) {
    throw new Error("DPR ID is required");
  }

  const query = `SELECT * FROM dpr WHERE dpr_id = ?`;

  try {
    const [rows] = await pool.query(query, [dpr_id]);
    if (rows.length === 0) return null;

    const row = rows[0];

    return {
      ...row,
      site_condition: safeParse(row.site_condition),
      labour_report: safeParse(row.labour_report),
      today_prog: safeParse(row.today_prog),
      tomorrow_plan: safeParse(row.tomorrow_plan),
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

// Fetch PDR current handler
export async function getCurrentHandlerForDpr(dpr_id) {
  const [rows] = await pool.query(
    'SELECT current_handler FROM dpr WHERE dpr_id = ?',
    [dpr_id]
  );
  return rows[0] ? rows[0].current_handler : null;
}

// Insert DPR
export async function insertDPR(dprData) {
  if (!dprData.project_id || !dprData.report_date) {
    throw new Error("Missing required fields: project_id or report_date");
  }

  // Step 1: Check if DPR already exists for the same project and date
  const checkQuery = `
    SELECT dpr_id FROM dpr WHERE project_id = ? AND report_date = ? LIMIT 1;
  `;
  const [existing] = await pool.query(checkQuery, [dprData.project_id, dprData.report_date]);

  if (existing.length > 0) {
    return { ok: false, message: "DPR already exists for this date.", data: null };
  }
  console.log(dprData.user_id);
  // Step 2: Insert new DPR
  const insertQuery = `
    INSERT INTO dpr (
      project_id, report_date, site_condition, labour_report,
      cumulative_manpower, today_prog, tomorrow_plan,
      report_footer, created_by, current_handler
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const values = [
    dprData.project_id,
    dprData.report_date,
    dprData.site_condition ? JSON.stringify(dprData.site_condition) : null,
    dprData.labour_report ? JSON.stringify(dprData.labour_report) : null,
    dprData.cumulative_manpower ?? 0,
    dprData.today_prog ? JSON.stringify(dprData.today_prog) : null,
    dprData.tomorrow_plan ? JSON.stringify(dprData.tomorrow_plan) : null,
    dprData.report_footer ? JSON.stringify(dprData.report_footer) : null,
    dprData.user_id,
    dprData.user_id
  ];

  try {
    const [result] = await pool.query(insertQuery, values);
    return {
      ok: true,
      message: "DPR inserted successfully.",
      data: { insertId: result.insertId }
    };
  } catch (error) {
    console.error("❌ Error inserting DPR:", error.message, "\nData:", dprData);
    throw error;
  }
}

// Update DPR
export async function updateDPR(dpr_id, dprData) {
  if (!dpr_id) {
    throw new Error("Missing required field: dpr_id");
  }

  // Allowed updatable columns (remove user_roles if desired)
  const allowedColumns = new Set([
    'report_date',
    'site_condition',
    'labour_report',
    'cumulative_manpower',
    'today_prog',
    'tomorrow_plan',
    'report_footer',
    'created_by',
    'approved_by',
    'final_approved_by',
    'current_handler',
    'dpr_status'
  ]);

  const jsonColumns = new Set([
    'site_condition',
    'labour_report',
    'today_prog',
    'tomorrow_plan',
    'report_footer'
  ]);

  const setClauses = [];
  const values = [];

  for (const column of allowedColumns) {
    if (dprData.hasOwnProperty(column)) {
      let val = dprData[column];

      // Skip keys with undefined values (not sent)
      if (val === undefined) continue;

      if (val === null) {
        val = null; // Explicit null is respected - will clear field
      } else if (jsonColumns.has(column)) {
        try {
          val = JSON.stringify(val); // Serialize objects/arrays if needed
        } catch (e) {
          throw new Error(`Failed to JSON.stringify field ${column}: ${e.message}`);
        }
      } else if (column === 'created_at' && !val) {
        val = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      setClauses.push(`\`${column}\` = ?`);
      values.push(val);
    }
  }

  if (setClauses.length === 0) {
    throw new Error("No valid fields provided to update");
  }

  const query = `
    UPDATE dpr
    SET ${setClauses.join(', ')}
    WHERE dpr_id = ?;
  `;

  values.push(dpr_id);

  try {
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  } catch (error) {
    console.error("❌ Error updating DPR:", error.message, "\nData:", dprData);
    throw error;
  }
}

// Fetch the last DPR of a project
export async function fetchLastDPR(project_id) {
  const query = `
        SELECT * FROM dpr
        WHERE project_id = ?
        ORDER BY report_date DESC
        LIMIT 1;
    `;

  try {
    const [rows] = await pool.query(query, [project_id]);
    return rows[0] || null;
  } catch (error) {
    console.error("❌ Error fetching last DPR:", error);
    throw error;
  }
}

// Fetch all DPR under a specific Project
export async function fetchDPRsByProject(project_id, limit = 20) {
  const query = `
    SELECT 
      dpr_id,
      report_date,
      dpr_status,
      current_handler,
      created_by, approved_by, final_approved_by
    FROM dpr
    WHERE project_id = ?
    ORDER BY report_date DESC
    LIMIT ?;
  `;

  try {
    const [results] = await pool.query(query, [project_id, Number(limit)]);

    return results;
  } catch (error) {
    console.error("❌ Error fetching DPRs for project:", error);
    throw error;
  }
}

// Fetch project_id from 
export async function getProjByDprID(dpr_id) {
  const query = `SELECT project_id FROM dpr WHERE dpr_id = ?`;
  try {
    const [rows] = await pool.query(query, [dpr_id]);
    if (!rows.length) {
      return { ok: false, message: "No DPR found for that ID.", project_id: null };
    }
    return { ok: true, project_id: rows[0].project_id };
  } catch (error) {
    console.error("❌ Error fetching DPR by ID:", error.message);
    throw error;
  }
}

// Submit DPR
export async function submitDPR(dpr_id, user_id) {
  // 1. Get the DPR row
  const dpr = await getDPRById(dpr_id);
  if (!dpr) throw new Error("DPR not found");

  // 2. Initial check: dpr_status and current_handler
  if (dpr.dpr_status === "approved") throw new Error("DPR is already approved");
  if (dpr.current_handler !== user_id) throw new Error("You are not the current handler for this DPR");

  // 3. Get user role and users involved
  const project_id = await getProject_idByDpr_id(dpr_id);
  const userRole = await getUserRoleForProject(user_id, project_id);
  const { data: users_involved = {} } = await getUsersInvolvedInProject(project_id);

  let next_handler = null;
  let new_status = "";
  let fieldsToUpdate = {};

  // 4. Workflow logic with skip option
  if (dpr.dpr_status === "in_progress") {
    if (userRole.role_name !== "reporter") throw new Error("Only the reporter can submit at this stage");

    // If neither approver nor final_approver, mark as approved directly
    if (!users_involved.approver && !users_involved.final_approver) {
      next_handler = null;
      new_status = "approved";
    }
    // If only approver exists
    else if (users_involved.approver) {
      next_handler = users_involved.approver;
      new_status = "under_review";
    }
  } else if (dpr.dpr_status === "under_review") {
    if (userRole.role_name !== "approver") throw new Error("Only the approver can submit at this stage");

    fieldsToUpdate.approved_by = user_id;

    // If no final approver, directly approve
    if (!users_involved.final_approver) {
      next_handler = null;
      new_status = "approved";
    }
    // Otherwise, assign to final approver
    else {
      next_handler = users_involved.final_approver;
      new_status = "final_review";
    }
  } else if (dpr.dpr_status === "final_review") {
    if (userRole.role_name !== "final_approver") throw new Error("Only the final approver can submit at this stage");
    fieldsToUpdate.final_approved_by = user_id;
    // Approve and end flow
    next_handler = null;
    new_status = "approved";
  } else {
    throw new Error("DPR in invalid state");
  }

  // 5. Compose update
  fieldsToUpdate.current_handler = next_handler;
  fieldsToUpdate.dpr_status = new_status;
  await updateDPR(dpr_id, fieldsToUpdate);

  return { ok: true, new_status, next_handler };
}



// #endregion

// #endregion

// #region ✅ TASKS ─────────────────────────────────────────────

// Function to fetch task by task_id
export async function fetchTaskById(task_id) {
  const sql = "SELECT * FROM tasks WHERE task_id = ?";
  try {
    const [[result]] = await pool.query(sql, [task_id])
    return result;
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    throw err;
  }
}

// Function to fetch all task of people under the user control
export async function fetchTasksOfControlled(user_id) {
  const sql = "SELECT controlled_id FROM task_control WHERE controller_id = ?";
  try {
    const [result] = await pool.query(sql, [user_id])
    const ids = result.map(item => item.controlled_id);
    let allTask = []
    for (const id of ids) {
      const tasks = await fetchTasks(id);
      allTask.push(...tasks)
    }
    return allTask;
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    throw err;
  }
}

// Function to fetch all task under a user
export async function fetchTasks(user_id) {
  const sql = "SELECT * FROM tasks WHERE assigned_to = ?";
  try {
    const [result] = await pool.query(sql, [user_id])
    return result;
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    throw err;
  }
}

// Function to add new task
export async function insertTask({
  task_name,
  task_description = null,
  assigned_to = null,
  assigned_date = null,
  due_date = null,
  status = null
}) {
  const sql = `
        INSERT INTO tasks (task_name, task_description, assigned_to, assigned_date, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
  try {
    const [result] = await pool.query(sql, [
      task_name, task_description, assigned_to, assigned_date, due_date, status
    ]);
    return result.insertId;
  } catch (err) {
    console.error("❌ Error inserting task:", err.message);
    throw err;
  }
}

// Function to update task
export async function updateTask(task_id, {
  task_name,
  task_description,
  assigned_to,
  assigned_date,
  due_date, status }) {

  try {
    const allowed = ["task_name", "task_description", "assigned_to", "assigned_date", "due_date", "status"];
    const updates = [];
    const values = [];
    for (const k of allowed) {
      if (typeof arguments[1][k] !== "undefined") {
        updates.push(`${k} = ?`);
        values.push(arguments[1][k]);
      }
    }
    if (updates.length === 0) return 0;
    const sql = `UPDATE tasks SET ${updates.join(", ")} WHERE task_id = ?`;
    values.push(task_id);
    const [result] = await pool.query(sql, values);
    return result.affectedRows;
  } catch (err) {
    console.error("❌ Error updating task:", err.message);
    throw err;
  }
}

// Function to delete task
export async function deleteTask(task_id) {
  const sql = `DELETE FROM tasks WHERE task_id = ?`;
  try {
    const [result] = await pool.query(sql, [task_id]);
    return result.affectedRows;
  } catch (err) {
    console.error("❌ Error deleting task:", err.message);
    throw err;
  }
}

// Function to get control_type
export async function getControlType(controller_id, controlled_id) {
  const sql = `SELECT control_type FROM task_control WHERE controller_id = ? AND controlled_id = ?;`;
  try {
    const [[result]] = await pool.query(sql, [controller_id, controlled_id]);
    return result ? result.control_type : null;
  } catch (err) {
    console.error("❌ Error fetching control type:", err.message);
    throw err;
  }
}

// Function to get all controlled user_id and user_name
export async function getControlledUsers(controller_id) {
  const sql = `
    SELECT tc.controlled_id,tc.control_type, u.user_name
    FROM task_control tc
    JOIN users u ON tc.controlled_id = u.user_id
    WHERE tc.controller_id = ?;
  `;
  try {
    const [rows] = await pool.query(sql, [controller_id]);
    // rows will be an array of objects { controlled_id, control_type, user_name }
    return rows;
  } catch (err) {
    console.error("❌ Error fetching controlled users:", err.message);
    throw err;
  }
}

// Function to update controlled for a controller
export async function updateTaskControl(controller_id, add = [], remove = []) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Remove entries
    if (remove.length > 0) {
      for (const { controlled_id } of remove) {
        let sql = `
          DELETE FROM task_control
          WHERE controller_id = ? AND controlled_id = ?
        `;
        let params = [controller_id, controlled_id];
        await connection.query(sql, params);
      }
    }

    // Add entries
    if (add.length > 0) {
      for (const obj of add) {
        const controlled_id = obj.controlled_id;
        const control_type = obj.control_type || "manager";
        await connection.query(`
      INSERT INTO task_control (controller_id, controlled_id, control_type)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE control_type = VALUES(control_type)
    `, [controller_id, controlled_id, control_type]);
      }
    }


    await connection.commit();
    connection.release();
    return { ok: true };
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("❌ Error updating task control:", err);
    return { ok: false, message: err.message };
  }
}

// db.js or relevant file
export async function getAllUserTaskControls() {
  const sql = `
    SELECT 
      tc.controller_id, 
      tc.controlled_id, 
      tc.control_type, 
      u.user_name as controlled_name
    FROM task_control tc
    JOIN users u ON tc.controlled_id = u.user_id
  `;
  try {
    const [rows] = await pool.query(sql);
    // Returns array of { controller_id, controlled_id, control_type, controlled_name }
    return { ok: true, taskControls: rows };
  } catch (err) {
    console.error("❌ Error fetching user task controls:", err.message);
    return { ok: false, message: err.message };
  }
}



// export async function getAssignedTo() {

// }


// #region 🧬 CROSS MODULE ─────────────────────────────────────────────

// Fetches user roles for a user in a given project
export async function getUserRoleForProject(user_id, project_id) {
  const query = `
        SELECT r.*
        FROM project_user_roles upr
        JOIN roles r ON upr.role_id = r.role_id
        WHERE upr.user_id = ? AND upr.project_id = ?;
    `;
  const params = [user_id, project_id];

  try {
    const [[rows]] = await pool.query(query, params);
    return rows
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw error;
  }
}

// Fetch users involved in project and their role
export async function getUsersInvolvedInProject(project_id) {
  const query = `
    SELECT upr.user_id, r.role_name
    FROM project_user_roles upr
    JOIN roles r ON upr.role_id = r.role_id
    WHERE upr.project_id = ?;
  `;
  const params = [project_id];

  try {
    const [rows] = await pool.query(query, params);

    if (!rows || rows.length === 0) {
      return { ok: false, message: "No users involved in this project." };
    }

    // Map role names to user_id lists
    const roleMap = {};

    for (const { user_id, role_name } of rows) {
      if (!roleMap[role_name]) {
        roleMap[role_name] = [];
      }
      roleMap[role_name].push(user_id);
    }

    // For roles with only one user allowed, set as number if present
    ["approver", "final_approver"].forEach(role => {
      if (roleMap[role] && roleMap[role].length > 0) {
        roleMap[role] = roleMap[role][0];
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

// Fetch users involved in project and their role
export async function getProject_idByDpr_id(dpr_id) {
  const query = `
    SELECT project_id
    FROM dpr
    WHERE dpr_id = ?;
  `;

  try {
    const [rows] = await pool.query(query, [dpr_id]);

    if (rows.length === 0) {
      // No matching record found
      return null;
    }

    // Return project_id as a number
    return rows[0].project_id;
  } catch (error) {
    console.error("Error fetching project_id by dpr_id:", error);
    throw error;
  }
}


// Update the roles of users for a project
async function patchProjectRoles(project_id, changes) {
  const roleNameToId = {
    reporter: 1,
    approver: 2,
    client: 3,
    final_approver: 4,
    stranger: 5
  };

  try {
    const deletePairs = [];
    const insertRows = [];

    // Step 1: Prepare the delete list
    for (const [role, change] of Object.entries(changes)) {
      const role_id = roleNameToId[role];
      if (!role_id) continue;

      // For roles that are single-value: only "approver" and "final_approver"
      if (role === "approver" || role === "final_approver") {
        if (change) {
          deletePairs.push([project_id, Number(change)]);
          insertRows.push([project_id, Number(change), role_id]);
        }
      }
      // For roles that are multi-value: "client", "reporter"
      else if (role === "client" || role === "reporter") {
        if (change) {
          if (change.delete?.length) {
            change.delete.forEach(uid => deletePairs.push([project_id, Number(uid)]));
          }
          if (change.insert?.length) {
            change.insert.forEach(uid => insertRows.push([project_id, Number(uid), role_id]));
          }
        }
      }
      // For any other roles, treat as multi-value (future-proofing)
      else if (change) {
        if (change.delete?.length) {
          change.delete.forEach(uid => deletePairs.push([project_id, Number(uid)]));
        }
        if (change.insert?.length) {
          change.insert.forEach(uid => insertRows.push([project_id, Number(uid), role_id]));
        }
      }
    }

    // Step 2: Execute deletes first
    for (const [proj, uid] of deletePairs) {
      await pool.query(
        `DELETE FROM project_user_roles WHERE project_id = ? AND user_id = ?`,
        [proj, uid]
      );
    }

    // Step 3: Check for duplicates in insertRows
    const seen = new Set();
    const safeInserts = insertRows.filter(([proj, uid]) => {
      const key = `${proj}-${uid}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Step 4: Insert new roles
    if (safeInserts.length) {
      await pool.query(
        `INSERT IGNORE INTO project_user_roles (project_id, user_id, role_id) VALUES ?`,
        [safeInserts]
      );
    }

    return { ok: true, msg: "Roles updated safely" };
  } catch (err) {
    console.error("❌ Error updating roles:", err);
    return { ok: false, msg: err.message };
  }
}


// #endregion


// const t = await getTitles();
// console.log(t);

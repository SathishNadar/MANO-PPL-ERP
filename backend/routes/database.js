import mysql from 'mysql2';
import dotenv from 'dotenv';
import Fuse from "fuse.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const result = dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (result.error) {
    console.error("Error loading .env file:", result.error);
}

// Create a MySQL pool with connection details
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
}).promise();


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

// #region 🧑‍💼 USERS  ─────────────────────────────────────────────

// Function to fetch User by user_name
export async function r_fetchUserByName(name) {
    const query = "SELECT * FROM users WHERE user_name = ?"
    try {
        const [row] = await pool.query(query, [name]);
        return row[0] || null;
    } catch (error) {
        console.error("Error fetching user by name:", error);
        throw error;
    }
}

// Function to add user
export async function r_addUser(user_data) {
    const query = "INSERT INTO users (user_name, user_password, email, phone_no) VALUES (?, ?, ?, ?);";

    try {
        const [result] = await pool.query(query, user_data);
        return result[0];
    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
}

// Function to update password
export async function r_updateUserPassword(user_id, hashed_password) {
  const query = `
    UPDATE users 
    SET user_password = ? 
    WHERE user_id = ?;
  `;

  try {
    const [result] = await pool.query(query, [hashed_password, user_id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error updating user password:", error);
    throw error;
  }
}

// Function to check user_name exists
export async function r_usernameExist(user_name) {
    const query = "SELECT user_id FROM users WHERE user_name = ?";
    try {
        const [rows] = await pool.query(query, user_name);
        return rows[0]
    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
}

// Function to check Email or PhoneNo. is Taken
export async function r_isEmailOrPhoneTaken(email, phone) {
    const query = "SELECT COUNT(*) AS count FROM users WHERE email = ? OR phone_no = ?";

    try {
        const [rows] = await pool.query(query, [email, phone]);
        return rows[0].count > 0;
    } catch (error) {
        console.error("Error checking email or phone:", error);
        throw error;
    }
}

// #endregion

// #region 🧱 PROJECT  ─────────────────────────────────────────────

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
      p.end_date
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

// Function to insert Project  ###### Hardcoded 
export async function r_insertProject(data) {
    const {
        project_name,
        user_id = null,
        project_description = null,
        start_date = null,
        end_date = null,
        location = null,
        contract_no = null,
        Employer = null
    } = data;

    if (!project_name) {
        throw new Error("Missing required fields: project_name");
    }

    const projQuery = `
        INSERT INTO projects (
            project_name, project_description,
            start_date, end_date, location,
            contract_no, Employer
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const roleQuery = `
        INSERT INTO project_user_roles (
            project_id, user_id, role_id
        ) VALUES (?, ?, ?);
    `;

    const values = [
        project_name,
        project_description,
        start_date,
        end_date,
        location,
        contract_no,
        Employer
    ];

    try {
        const [projResult] = await pool.query(projQuery, values);
        await pool.query(roleQuery, [projResult.insertId, user_id, 1]);
        return projResult.insertId;
    } catch (error) {
        console.error("❌ Error inserting project:", error.message);
        throw error;
    }
}

// Function to update Project
export async function r_updateProject(data) {
    const {
        project_id,
        project_name,
        project_description = null,
        start_date = null,
        end_date = null,
        location = null,
        contract_no = null,
        Employer = null
    } = data;

    if (!project_id || !project_name) {
        throw new Error("Missing required fields: project_id or project_name");
    }

    const query = `
        UPDATE projects
        SET 
            project_name = ?,
            project_description = ?,
            start_date = ?,
            end_date = ?,
            location = ?,
            contract_no = ?,
            Employer = ?
        WHERE project_id = ?;
    `;

    const values = [
        project_name,
        project_description,
        start_date,
        end_date,
        location,
        contract_no,
        Employer,
        project_id
    ];

    try {
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    } catch (error) {
        console.error("❌ Error updating project:", error.message);
        throw error;
    }
}

// Function to get a user role in project
export async function r_fetchRole(user_id, project_id) {
    const relation_query = `
        SELECT role_id 
        FROM project_user_roles 
        WHERE user_id = ? AND project_id = ?;
    `; 
    
    const role_query = `
        SELECT * 
        FROM roles 
        WHERE role_id = ?;
    `; 

    try {
        const [rows] = await pool.query(relation_query, [user_id, project_id]);
        const role_id = rows.length > 0 ? rows[0].role_id : null;

        if (!role_id) return null;

        const [data] = await pool.query(role_query, [role_id]);
        return data[0] || null;
    } catch (error) {
        console.error("❌ Error fetching role for user:", error);
        throw error;
    }
}

// #endregion

// #region 📝 DPR  ─────────────────────────────────────────────

// Fetch DPR by ID
export async function r_getDPRById(dpr_id) {
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
export async function r_insertDPR(dprData) {
    if (!dprData.project_id || !dprData.report_date) {
        throw new Error("Missing required fields: project_id or report_date");
    }

    // Step 1: Check if DPR already exists for same project and date
    const checkQuery = `
        SELECT dpr_id FROM dpr WHERE project_id = ? AND report_date = ? LIMIT 1;
    `;
    const [existing] = await pool.query(checkQuery, [dprData.project_id, dprData.report_date]);

    if (existing.length > 0) {
        return { ok: false, message: "DPR already exists for this date.", data: null };
    }

    // Step 2: Insert new DPR
    const insertQuery = `
        INSERT INTO dpr (
            project_id, report_date, site_condition, labour_report,
            cumulative_manpower, today_prog, tomorrow_plan,
            user_roles, report_footer, created_at
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
        dprData.user_roles ? JSON.stringify(dprData.user_roles) : null,
        dprData.report_footer ? JSON.stringify(dprData.report_footer) : null,
        dprData.created_at ?? new Date()
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
export async function r_updateDPR(dprData) {
  if (!dprData.dpr_id || !dprData.project_id) {
    throw new Error("Missing required field: dpr_id or project_id");
  }

  const allowedColumns = new Set([
    'project_id',
    'report_date',
    'site_condition',
    'labour_report',
    'cumulative_manpower',
    'today_prog',
    'tomorrow_plan',
    'user_roles',
    'report_footer',
    'created_at',
    'created_by',
    'approved_by',
    'final_approved_by',
    'current_handler',
    'dpr_status',
  ]);

  const jsonColumns = new Set([
    'site_condition',
    'labour_report',
    'today_prog',
    'tomorrow_plan',
    'user_roles',
    'report_footer',
  ]);

  const setClauses = [];
  const values = [];

  for (const column of allowedColumns) {
    if (dprData.hasOwnProperty(column)) {
      let val = dprData[column];
      
      if (val === undefined) continue;
      if (val === null) {
        val = null;
      } else if (jsonColumns.has(column)) {
        try {
          val = JSON.stringify(val);
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

  values.push(dprData.dpr_id);

  try {
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  } catch (error) {
    console.error("❌ Error updating DPR:", error.message, "\nData:", dprData);
    throw error;
  }
}

// Fetch the last DPR of a project
export async function r_fetchLastDPR(project_id) {
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
export async function r_fetchDPRsByProject(project_id, limit = 20) {
    const query = `
    SELECT 
      dpr_id,
      report_date,
      user_roles
    FROM dpr
    WHERE project_id = ?
    ORDER BY report_date DESC
    LIMIT ?;
  `;

    try {
        const [rows] = await pool.query(query, [project_id, Number(limit)]);

        const results = rows.map(row => {
            let userRoles = row.user_roles;

            if (typeof userRoles === "string") {
                try {
                    userRoles = JSON.parse(userRoles);
                } catch (e) {
                    console.warn("⚠️ Failed to parse user_roles:", e);
                    userRoles = {};
                }
            }

            const approvals = userRoles.approvals || {};


            const approverValues = Object.values(approvals);
            console.log(approvals);
            const approved = approverValues.length === 0 || approverValues.every(v => v === true || v === "true");

            return {
                dpr_id: row.dpr_id,
                report_date: row.report_date,
                approval_status: approved
            };
        });

        return results;
    } catch (error) {
        console.error("❌ Error fetching DPRs for project:", error);
        throw error;
    }
}

// Fetch project_id from 
export async function r_getProjByDprID(dpr_id) {
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


// #endregion

// #region 🏷️ VENDOR ─────────────────────────────────────────────

// Fetch vendors with pagination, filtering and search
export async function r_fetchVendors({
  queryString = "",
  category = 0,
  tab = 1,
  limit = 25,
  locationIds = [],
  jobNatureIds = [],
  order = 'ASC',
} = {}) {
  const offset = (tab - 1) * limit;

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

// #region 🧬 CROSS MODULE ─────────────────────────────────────────────

// Fetches user roles for a user in a given project
export async function r_getUserRoleForProject(user_id, project_id) {
    const query = `
        SELECT r.*
        FROM project_user_roles upr
        JOIN roles r ON upr.role_id = r.role_id
        WHERE upr.user_id = ? AND upr.project_id = ?;
    `;
    const params = [user_id, project_id];

    try {
        const [[rows]] = await pool.query(query, params);
        console.log(rows)
        return rows
    } catch (error) {
        console.error("Error fetching vendors:", error);
        throw error;
    }
}


// #endregion




// const t = await fetchVendors(vendor);
// console.log(t)


// pool.end()


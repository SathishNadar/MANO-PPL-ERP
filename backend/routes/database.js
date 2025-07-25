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


// ----------------------- HELPING FUNCTIONS ----------------------- //

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

// ----------------------------- USER ----------------------------- //

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


// ---------------------- PROJECT ----------------------- //

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


// ------------------------ DPR ------------------------- //

const dprFormat = {
    project_id: null,
    report_date: "",

    site_condition: {
        ground_state: "",         // e.g., "dry", "slushy"
        is_rainy: false,          // true/false
        rain_timing: []           // e.g., ["10:10-11:00", "01:05-02:00"]
    },

    labour_report: {
        agency: [],               // List of agency names
        mason: [],                // Count per agency
        carp: [],
        fitter: [],
        electrical: [],
        painter: [],
        gypsum: [],
        plumber: [],
        helper: [],
        staff: [],
        remarks: ""               // Any remarks
    },

    cumulative_manpower: null,   // Total manpower count (including today)

    today_prog: {
        progress: [],             // e.g., ["cement imported.", "water distributed."]
        qty: []                   // e.g., ["1kg", "5L"]
    },

    tomorrow_plan: {
        plan: [],                 // e.g., ["cement imported.", "water distributed."]
        qty: []                   // e.g., ["1kg", "5L"]
    },

    user_roles: {
        created_by: null,
        approvals: {},            // e.g., { "1": true, "3": false }
        viewers: [],              // user IDs
        editors: []               // user IDs
    },

    report_footer: {
        events_visit: [],         // e.g., [{ time: "10:00", note: "VIP visit" }] or just []
        distribute: [],           // e.g., ["L&T", "MAPLANI"]
        prepared_by: ""           // Name of preparer
    },

    created_at: ""               // e.g., "2025-01-19 12:00:00"
};

// Function to fetch DPR by ID
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

// Function to Insert DPR
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
        return { success: false, message: "DPR already exists for this date.", data: null };
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
            success: true,
            message: "DPR inserted successfully.",
            data: { insertId: result.insertId }
        };
    } catch (error) {
        console.error("❌ Error inserting DPR:", error.message, "\nData:", dprData);
        throw error;
    }
}

// Function to Update DPR
export async function r_updateDPR(dprData) {
    if (!dprData.dpr_id || !dprData.project_id || !dprData.report_date) {
        throw new Error("Missing required fields: dpr_id, project_id, or report_date");
    }

    const query = `
    UPDATE dpr
    SET
        project_id = ?,
        report_date = ?,
        site_condition = ?,
        labour_report = ?,
        cumulative_manpower = ?,
        today_prog = ?,
        tomorrow_plan = ?,
        user_roles = ?,
        report_footer = ?,
        created_at = ?
    WHERE
        dpr_id = ?;
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
        dprData.created_at || new Date().toISOString().slice(0, 19).replace("T", " "),
        dprData.dpr_id
    ];

    try {
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    } catch (error) {
        console.error("❌ Error updating DPR:", error.message, "\nData:", dprData);
        throw error;
    }
}

// Function to fetch the last DPR of a project
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

// Function to fetch all DPR under a specific Project
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


// ----------------------- VENDOR ----------------------- //

// Fetch vendors with pagination and filtering
export async function r_fetchVendorsByTab({
    category = 0,
    tab = 1,
    limit = 25,
    locationIds = [],
    jobNatureIds = [],
    order = 'ASC'
} = {}) {
    limit = Math.max(1, Math.min(limit, 100));
    tab = Math.max(1, tab);

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

    const query = `SELECT * ${baseQuery} ORDER BY name ${order === 'DESC' ? 'DESC' : 'ASC'} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;

    try {
        const [[{ total }]] = await pool.query(countQuery, params.slice(0, -2));
        const [rows] = await pool.query(query, params);

        return {
            vendors: rows,
            vendorCount: total
        };
    } catch (error) {
        console.error("Error fetching vendors:", error);
        throw error;
    }
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

// Fetch all Locations in table
export async function r_fetchVendors({
    queryString = "",
    category = 0,
    tab = 1,
    limit = 25,
    locationIds = [],
    jobNatureIds = [],
    order = 'ASC'
} = {}) {
    const offset = (tab - 1) * limit;

    const { vendors } = await r_fetchVendorsByTab({
        category,
        tab: 1,
        limit: 10000,
        locationIds,
        jobNatureIds,
        order
    });

    if (!queryString.trim()) {
        return {
            vendors: vendors.slice(offset, offset + limit),
            vendorCount: vendors.length
        };
    }

    const fuse = new Fuse(vendors, {
        keys: ["name", "remarks", "reference", "contact_person"],
        threshold: 0.4,
    });

    const results = fuse.search(queryString).map(r => r.item);
    return {
        vendors: results.slice(offset, offset + limit),
        vendorCount: results.length
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



// const t = await r_fetchRole(6, 166)
// console.log(t)


// pool.end()


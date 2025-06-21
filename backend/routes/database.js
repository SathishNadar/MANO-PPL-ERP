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

// Function to fetch User by ID
export async function r_fetchUserByID(user_id) {
    const query = "SELECT * FROM users WHERE user_id = ?";
    try {
        const [row] = await pool.query(query, [user_id]);
        return row[0] || null;
    } catch (error) {
        console.error("Error fetching DPR by ID:", error);
        throw error;
    }
}

// Function to fetch Multiple Users by ID
export async function r_fetchUsersByID(user_ids) {
    const placeHolder = user_ids.map(() => "?").join(', ');
    const query = `SELECT * FROM users WHERE user_id IN (${placeHolder})`;

    try {
        const [rows] = await pool.query(query, user_ids);
        return rows || null;
    } catch (error) {
        console.error("Error fetching DPR by ID:", error);
        throw error;
    }
}

// Function to fetch user_name by ID
export async function r_fetchUserNameByID(user_id) {
    const query = "SELECT user_name FROM users WHERE user_id = ?";
    try {
        const [row] = await pool.query(query, [user_id]);
        return row[0].user_name || null;
    } catch (error) {
        console.error("Error fetching DPR by ID:", error);
        throw error;
    }
}

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

// Function to insert Project
export async function r_insertProject(data) {
    const {
        project_name,
        project_description = null,
        start_date = null,
        end_date = null,
        location = null,
        contract_no = null,
        Employer = null,
        user_roles = {}
    } = data;

    if (!project_name) {
        throw new Error("Missing required fields: project_name");
    }

    const query = `
        INSERT INTO projects (
            user_roles, project_name, project_description,
            start_date, end_date, location,
            contract_no, Employer
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
        JSON.stringify(user_roles),
        project_name,
        project_description,
        start_date,
        end_date,
        location,
        contract_no,
        Employer
    ];

    try {
        const [result] = await pool.query(query, values);
        return result.insertId;
    } catch (error) {
        console.error("❌ Error inserting project:", error.message);
        throw error;
    }
}

// Function to update Project
export async function r_updateProject(data) {
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
    } = data;

    if (!project_id || !project_name) {
        throw new Error("Missing required fields: project_id or project_name");
    }

    const query = `
        UPDATE projects
        SET 
            user_roles = ?,
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
        JSON.stringify(user_roles),
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

    const query = `
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
        const [result] = await pool.query(query, values);
        return result.insertId;
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

// Function to fetch last DPR cummulative manpower
export async function r_fetchLastManPower(project_id) {
    const query = "SELECT cumulative_manpower FROM DPR WHERE project_id = ? ORDER BY report_date DESC LIMIT 1;";
    try {
        const [data] = await pool.query(query, [project_id]);
        return data.length > 0 ? data[0].cumulative_manpower : 0;
    } catch (error) {
        console.error("❌ Error fetching last DPR cumulative manpower:", error);
        throw error;
    }
}

// Function to structure raw DPR into formatted object
export async function DprInit(project_id, report_by) {

    const project_data = r_fetchProjectByID(project_id);
    let dpr = dprFormat;

    dpr.project_id = project_id;
    dpr.reported_by = report_by;
    dpr.report_date = new Date().toISOString().split("T")[0];
    dpr.cumulative_manpower = await r_fetchLastManPower(project_id);
    dpr.labour_report.agency = project_data.agency.split(",");
    dpr.project_name = project_data.project_name;
    dpr.employer = project_data.employer;

    return dpr;   
}


// ----------------------- VENDOR ----------------------- //

// Function to fetch vendors with pagination and filtering
export async function r_fetchVendorsByTab({
    category = 0,
    tab = 1,
    limit = 25,
    locationIds = [],
    jobNatureIds = [],
    order = 'ASC'
} = {}) {

    const offset = (tab - 1) * limit;
    
    let baseQuery = "FROM vendors";
    const params = [];

    if (category !== 0) {
        baseQuery += " WHERE category_id = ?";
        params.push(category);
    } else {
        baseQuery += " WHERE 1";
    }
    
    if (locationIds.length > 0) {
        baseQuery += ` AND location_id IN (${locationIds.map(() => '?').join(',')})`;
        params.push(...locationIds);
    }
    
    if (jobNatureIds.length > 0) {
        baseQuery += ` AND job_nature_id IN (${jobNatureIds.map(() => '?').join(',')})`;
        params.push(...jobNatureIds);
    }
    
    let query = `SELECT * ${baseQuery} ORDER BY name ${order === 'DESC' ? 'DESC' : 'ASC'} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    let countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;

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

// Generic function to fetch ID-name pairs from any table
export async function r_fetchIdNamePairs(tableName) {
    const query = `SELECT id, name FROM \`${tableName}\``;
    try {
        const [rows] = await pool.query(query);
        return Object.fromEntries(rows.map(row => [row.name, row.id]));
    } catch (error) {
        console.error(`Error fetching data from ${tableName}:`, error);
        throw error;
    }
}

// Function to fetch Count of vendors in table
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

// Function to fetch all Job Natures in table
export async function r_fetchVendorsAllJobNatures() {
    return await r_fetchIdNamePairs("JobNatures");
}

// Function to fetch all Locations in table
export async function r_fetchVendorsAllLocations() {
    return await r_fetchIdNamePairs("Locations");
}

// Function to fetch all Locations in table
export async function r_searchVendors({
    queryString = "",
    category = 1,
    tab = 1,
    limit = 25,
    locationIds = [],
    jobNatureIds = [],
} = {}) {
    const { vendors } = await r_fetchVendorsByTab({
        category,
        tabNumber: 1,
        limit: 10000, 
        locationIds,
        jobNatureIds,
    });

    if (!vendors || vendors.length === 0) {
        console.log("No vendors found");
        return [];
    }

    if (!queryString.trim()) {
        const offset = (tab - 1) * limit;
        return vendors.slice(offset, offset + limit);
    }

    const fuse = new Fuse(vendors, {
        keys: ["name", "remarks", "reference", "contact_person"],
        threshold: 0.4,
    });

    let results = fuse.search(queryString).map(result => result.item);

    const vendorCount = results.length;
    const offset = (tab - 1) * limit;
    results = results.slice(offset, offset + limit)
    return {
        vendors: results,
        vendorCount,
    };
}


const dprData = {
    project_id: 1,
    reported_by: 5,
    report_date: "2024-03-18",
    site_condition: {
        ground_state: "slushy",
        weather_state: "rainy", 
        timing: ["11:00-12:00", "13:00-14:25"]
    },
    labour_report: {
        agency: ["MAPLANI", "L&T", "AMAZON", "NVIDIA"],
        mason: [0, 0, 1, 0],
        carp: [1, 0, 3, 5],
        fitter: [2, 1, 0, 4],
        electrical: [0, 2, 1, 3],
        painter: [1, 1, 0, 0],
        gypsum: [3, 0, 2, 1],
        plumber: [0, 0, 0, 2],
        helper: [5, 2, 3, 1],
        staff: [2, 1, 1, 0],
        remarks: "Nices remark"
    },
    cumulative_manpower: 20,
    today_prog: [{ "task": "Task one done", "qty": "1Kg" }, { "task": "Task two done", "qty": "7Kg" }, { "task": "Task three done", "qty": "1L" }],
    tomorrow_plan: [{ "task": "Task seven done", "qty": "1Kg" }, { "task": "Task eight done", "qty": "7Kg" }, { "task": "Task nine done", "qty": "1L" }],
    events_visit: "Safety audit scheduled",
    distribute: "Material to be distributed",
    prepared_by: "Site Manager",
    approval: {
        "Mano Bharathi": true,
        "Rajesh": true,
        "Sathish Nadar": false
    }
};



// const t = await r_fetchUserByID(2)
// console.log(t)


// pool.end()
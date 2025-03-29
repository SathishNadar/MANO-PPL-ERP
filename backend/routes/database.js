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

// ----------------------- USER FUNCTIONS ----------------------- //

// Function to fetch User by ID
export async function r_fetchUserByID(user_id) {
    const query = "SELECT * FROM Users WHERE user_id = ?";
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
    const query = `SELECT * FROM Users WHERE user_id IN (${placeHolder})`;

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
    const query = "SELECT user_name FROM Users WHERE user_id = ?";
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
    const query = "SELECT * FROM Users WHERE user_name = ?"
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
    const query = "INSERT INTO Users (user_name, user_password, email, phone_no) VALUES (?, ?, ?, ?);";
    
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
    const query = "SELECT user_id FROM Users WHERE user_name = ?";
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
    const query = "SELECT COUNT(*) AS count FROM Users WHERE email = ? OR phone_no = ?";
    
    try {
        const [rows] = await pool.query(query, [email, phone]);
        return rows[0].count > 0;
    } catch (error) {
        console.error("Error checking email or phone:", error);
        throw error;
    }
}

// ------------------------ DPR FUNCTIONS ------------------------- //

// Function to fetch DPR by ID
export async function r_fetchDprByID(id) {
    const query = "SELECT * FROM DPR WHERE dpr_id = ?";
    try {
        const [row] = await pool.query(query, [id]);
        return row[0] || null;
    } catch (error) {
        console.error("❌ Error fetching DPR by ID:", error);
        throw error;
    }
}

// Function to Insert DPR
export async function r_insertDPR(dprData) {
    if (!dprData.project_id || !dprData.reported_by || !dprData.report_date) {
        throw new Error("Missing required fields: project_id, reported_by, or report_date");
    }

    const query = `
    INSERT INTO DPR (
        project_id, reported_by, report_date, site_condition, agency, mason,
        carp, fitter, electrical, painter, gypsum, plumber, helper, staff,
        remarks, cumulative_manpower, today_prog, tomorrow_plan,
        events_visit, distribute, prepared_by, approval
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;


    const values = [
        dprData.project_id,
        dprData.reported_by,
        dprData.report_date,
        dprData.site_condition || null,
        dprData.agency || null,
        dprData.mason || null,
        dprData.carp || null,
        dprData.fitter || null,
        dprData.electrical || null,
        dprData.painter || null,
        dprData.gypsum || null,
        dprData.plumber || null,
        dprData.helper || null,
        dprData.staff || null,
        dprData.remarks || null,
        dprData.cumulative_manpower ?? 0,
        dprData.today_prog || null,
        dprData.tomorrow_plan || null,
        dprData.events_visit || null,
        dprData.distribute || null,
        dprData.prepared_by || null,
        dprData.approval ? JSON.stringify(dprData.approval) : null
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
    if (!dprData.project_id || !dprData.reported_by || !dprData.report_date) {
        throw new Error("Missing required fields: project_id, reported_by, or report_date");
    }

    const query = `
    UPDATE DPR
    SET
        project_id = ?,
        reported_by = ?,
        report_date = ?,
        site_condition = ?,
        agency = ?,
        mason = ?,
        carp = ?,
        fitter = ?,
        electrical = ?,
        painter = ?,
        gypsum = ?,
        plumber = ?,
        helper = ?,
        staff = ?,
        remarks = ?,
        cumulative_manpower = ?,
        today_prog = ?,
        tomorrow_plan = ?,
        events_visit = ?,
        distribute = ?,
        prepared_by = ?, 
        approval = ?
    WHERE
        dpr_id = ?;
`;



    const values = [
        dprData.project_id,
        dprData.reported_by,
        dprData.report_date,
        dprData.site_condition || null,
        dprData.agency || null,
        dprData.mason || null,
        dprData.carp || null,
        dprData.fitter || null,
        dprData.electrical || null,
        dprData.painter || null,
        dprData.gypsum || null,
        dprData.plumber || null,
        dprData.helper || null,
        dprData.staff || null,
        dprData.remarks || null,
        dprData.cumulative_manpower ?? 0,
        dprData.today_prog || null,
        dprData.tomorrow_plan || null,
        dprData.events_visit || null,
        dprData.distribute || null,
        dprData.prepared_by || null,
        dprData.approval || null,
        dprData.dpr_id
    ];

    try {
        const [result] = await pool.query(query, values);
        return result.insertId;
    } catch (error) {
        console.error("❌ Error inserting DPR:", error.message, "\nData:", dprData);
        throw error;
    }
}

// Function to structure raw DPR into formatted object
export async function FormatDprData(dpr_data) {
    try {
        const structuredDpr = { ...dpr_data };

        // Parse site_condition to array
        if (structuredDpr.site_condition) {
            structuredDpr.site_condition = structuredDpr.site_condition.split("|");
            if (structuredDpr.site_condition[1] === "rainy" && structuredDpr.site_condition[2]) {
                structuredDpr.site_condition[2] = structuredDpr.site_condition[2].split(',');
            }
        }

        // agency and distribute as arrays
        if (structuredDpr.agency) {
            structuredDpr.agency = structuredDpr.agency.split(",");
        }
        if (structuredDpr.distribute) {
            structuredDpr.distribute = structuredDpr.distribute.split(",");
        }

        // Split comma-separated integer arrays
        const comma_sep_int = ["mason", "carp", "fitter", "electrical", "painter", "gypsum", "plumber", "helper", "staff", "approval"];
        comma_sep_int.forEach((agent) => {
            if (structuredDpr[agent]) {
                structuredDpr[agent] = structuredDpr[agent].split(",").map(num => {
                    const parsed = parseInt(num, 10);
                    return isNaN(parsed) ? null : parsed;
                });
            }
        });

        // Split progress/plans to [task, quantity] arrays
        ["today_prog", "tomorrow_plan"].forEach((item) => {
            if (structuredDpr[item]) {
                structuredDpr[item] = structuredDpr[item].split("|").map(x => x.split("~"));
            }
        });

        structuredDpr.reported_by = await r_fetchUserNameByID(structuredDpr.reported_by);

        structuredDpr.approval = await Promise.all(
            structuredDpr.approval.map(user_id => r_fetchUserNameByID(user_id))
        );

        return structuredDpr;

    } catch (error) {
        console.error("❌ Error formatting DPR:", error.message);
        throw error;
    }
}


// ----------------------- VENDOR FUNCTIONS ----------------------- //

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
    
    let baseQuery = "FROM Vendors";
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
    const query = "SELECT COUNT(*) AS count FROM Vendors";
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
    results.forEach((vendor) => {console.log(vendor.id)})
    results = results.slice(offset, offset + limit)
    console.log(offset, limit)
    results.forEach((vendor) => {console.log(vendor.id)})
    return {
        vendors: results,
        vendorCount,
    };
}









// const dprData = {
//     project_id: 1,
//     reported_by: 5,
//     report_date: "2024-03-18",
//     site_condition: "normal",
//     agency: "XYZ Constructions",
//     mason: "John, Alex",
//     carp: "David, Robert",
//     fitter: "Mike, Steve",
//     electrical: "Electric Corp",
//     painter: "PainterX",
//     gypsum: "GypsumPro",
//     plumber: "PlumbIt",
//     helper: "Helper1, Helper2",
//     staff: "StaffA, StaffB",
//     remarks: "Site inspected, materials arrived",
//     cumulative_manpower: 20,
//     today_prog: "Foundation work completed",
//     tomorrow_plan: "Start brickwork",
//     events_visit: "Safety audit scheduled",
//     distribute: "Material to be distributed",
//     prepared_by: "Site Manager",
//     approval: "12, 15, 18"
// };

// console.log(dprData);


// const nice = await r_fetchDprByID(1);
// console.log(nice)
// const bike = await FormatDprData(nice);
// console.log(bike)

// pool.end()
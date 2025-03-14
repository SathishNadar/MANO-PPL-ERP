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

// ----------------------- RAW FUNCTIONS ----------------------- //

// ----------> USER
// Function to fetch USER by ID
export async function r_fetchUserByID(id) {
    const query = "SELECT * FROM Users WHERE user_id = ?";
    try {
        const [row] = await pool.query(query, [id]);
        return row[0] || null;
    } catch (error) {
        console.error("Error fetching DPR by ID:", error);
        throw error;
    }
}

// Function to fetch user by username
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

// ----------> DPR
// Function to fetch DPR by ID
export async function r_fetchDprByID(id) {
    const query = "SELECT * FROM dpr WHERE dpr_id = ?";
    try {
        const [row] = await pool.query(query, [id]);
        return row[0] || null;
    } catch (error) {
        console.error("Error fetching DPR by ID:", error);
        throw error;
    }
}

// Function to Insert DPR
export async function r_insertDPR(dprData) {
    const query = `
    INSERT INTO dpr (
        project_id, reported_by, report_date, approved_by, agency, mason,
        carp, fitter, electrical, painter, gypsum, plumber, helper, staff,
        remarks, cumulative_manpower, today_prog, tomorrow_plan,
        events_visit, distribute, prepared_by, approval
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    try {
        const [result] = await pool.query(query, [
            dprData.project_id,
            dprData.reported_by,
            dprData.report_date,
            dprData.approved_by || null,
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
            dprData.cumulative_manpower || 0,
            dprData.today_prog || null,
            dprData.tomorrow_plan || null,
            dprData.events_visit || null,
            dprData.distribute || null,
            dprData.prepared_by || null,
            dprData.approval || null,
        ]);

        return result.insertId;
    } catch (error) {
        console.error("Error inserting DPR:", error);
        throw error;
    }
}


// Function to Update DPR
export async function r_updateDPR(dprId, updatedData) {
    const query = `
    UPDATE dpr
    SET 
    project_id = ?, 
    reported_by = ?, 
    report_date = ?, 
    details = ?, 
    approved_by = ?
    WHERE dpr_id = ?;
    `;
    try {
        const [result] = await pool.query(query, [
            updatedData.project_id,
            updatedData.reported_by,
            updatedData.report_date,
            updatedData.details || null,
            updatedData.approved_by || null,
            dprId
        ]);
        return result.affectedRows;
    } catch (error) {
        console.error("Error updating DPR:", error);
        throw error;
    }
}


// ----------> Vendors List
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
    tabNumber = 1,
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
        const offset = (tabNumber - 1) * limit;
        return vendors.slice(offset, offset + limit);
    }

    const fuse = new Fuse(vendors, {
        keys: ["name", "remarks", "reference", "contact_person"],
        threshold: 0.4,
    });

    let results = fuse.search(queryString).map(result => result.item);

    const vendorCount = results.length;
    const offset = (tabNumber - 1) * limit;
    results = results.slice(offset, offset + limit)
    return {
        vendors: results,
        vendorCount,
    };
}




// ----------------------- PROCESSED FUNCTIONS ----------------------- //
const delimiter = '|'

export async function InsertDprByID(dprData) {
    let formated = {};
    
    
    
}






// const nice = await r_searchVendors({
//     queryString: "abc"
// })
// console.log("nice : ", nice)



// pool.end()


// Test function for debugging
export async function test() {
    try {
        return "holy";
    } catch (error) {
        console.error("Error in test function:", error);
        throw error;
    }
}

import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables
// const result = dotenv.config();
const result = dotenv.config({ path: './Mano/.env' });
if (result.error) {
    console.error("Error loading .env file:", result.error);
}

// Create a MySQL pool with connection details
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    // password: "mysql#8983",
    database: process.env.MYSQL_DATABASE,
}).promise();

// ----------------------- RAW FUNCTIONS ----------------------- //

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

// Function to fetch user by username
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
    const query = "INSERT INTO users (user_name, user_password, email, mob_no) VALUES (?, ?, ?, ?);";
    
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
    const query = "SELECT user_name FROM users WHERE user_name = ?";
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
    const query = "SELECT COUNT(*) AS count FROM users WHERE email = ? OR mob_no = ?";
    
    try {
        const [rows] = await pool.query(query, [email, phone]);
        return rows[0].count > 0;
    } catch (error) {
        console.error("Error checking email or phone:", error);
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
// Function to fetch vendors with pagination
export async function r_fetchVendorsByTab(tabNumber = 1, limit = 25) {
    const offset = (tabNumber - 1) * limit; // Calculates the starting point
    const query = "SELECT * FROM Vendors ORDER BY name ASC LIMIT ? OFFSET ?";
    
    try {
        const [rows] = await pool.query(query, [limit, offset]);
        return rows;
    } catch (error) {
        console.error("Error fetching vendors:", error);
        throw error;
    }
}




// ----------------------- PROCESSED FUNCTIONS ----------------------- //
const delimiter = '|'

export async function InsertDprByID(dprData) {
    let formated = {};
    
    
    
}






// const nice = await r_fetchVendorsByTab()
// console.log(nice)



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

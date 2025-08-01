import mysql from 'mysql2';
import './config.js';

// Create a MySQL pool with connection details
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
}).promise();

// ----------------------- USER FUNCTIONS ----------------------- //

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

export async function insertUser(username, email, hashedPassword, phone) {
  const query = "INSERT INTO users (user_name, email, user_password, phone_no) VALUES (?, ?, ?, ?)";
  try {
    const [result] = await pool.query(query, [username, email, hashedPassword, phone]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error inserting user:', error);
    return false;
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

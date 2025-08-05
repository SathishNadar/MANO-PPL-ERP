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

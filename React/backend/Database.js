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
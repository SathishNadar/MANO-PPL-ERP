import mysql from 'mysql2'

// Alternative: const { Pool } = require('pg'); // for PostgreSQL

class DatabaseService {
  constructor() {
    // MySQL Configuration
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'your_app_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
    });

    // PostgreSQL Configuration (alternative)
    // this.pool = new Pool({
    //   host: process.env.DB_HOST || 'localhost',
    //   user: process.env.DB_USER || 'postgres',
    //   password: process.env.DB_PASSWORD || '',
    //   database: process.env.DB_NAME || 'your_app_db',
    //   port: process.env.DB_PORT || 5432,
    //   max: 10,
    //   idleTimeoutMillis: 30000,
    //   connectionTimeoutMillis: 2000,
    // });
  }

  // Initialize database tables
  async initializeTables() {
    try {
      // Users table
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          is_active BOOLEAN DEFAULT TRUE,
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          INDEX idx_email (email),
          INDEX idx_active (is_active)
        )
      `);

      // Password reset tokens table (optional - for additional security)
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          token VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_token (token),
          INDEX idx_expires (expires_at)
        )
      `);

      // Security events log table
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS security_events (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_event_type (event_type),
          INDEX idx_created_at (created_at)
        )
      `);

      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT id, email, password, first_name, last_name, is_active, email_verified FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT id, email, first_name, last_name, is_active, email_verified FROM users WHERE id = ? AND is_active = TRUE',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Update user password
  async updateUserPassword(userId, hashedPassword) {
    try {
      const [result] = await this.pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, userId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('User not found or password update failed');
      }
      
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const { email, password, firstName, lastName } = userData;
      const [result] = await this.pool.execute(
        'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
        [email, password, firstName, lastName]
      );
      
      return { 
        success: true, 
        userId: result.insertId, 
        message: 'User created successfully' 
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email already exists');
      }
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(userId) {
    try {
      await this.pool.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Log security event
  async logSecurityEvent(userId, eventType, metadata = {}) {
    try {
      await this.pool.execute(
        'INSERT INTO security_events (user_id, event_type, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?)',
        [
          userId,
          eventType,
          metadata.ip || null,
          metadata.userAgent || null,
          JSON.stringify(metadata)
        ]
      );
      return { success: true };
    } catch (error) {
      console.error('Error logging security event:', error);
      // Don't throw error for logging failures
      return { success: false };
    }
  }

  // Create password reset token (optional - for additional security)
  async createPasswordResetToken(userId, token, expiresAt) {
    try {
      // Clean up old tokens first
      await this.pool.execute(
        'DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < NOW()',
        [userId]
      );

      const [result] = await this.pool.execute(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );

      return { success: true, tokenId: result.insertId };
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw error;
    }
  }

  // Verify password reset token
  async verifyPasswordResetToken(token) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE',
        [token]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      throw error;
    }
  }

  // Mark password reset token as used
  async markTokenAsUsed(tokenId) {
    try {
      await this.pool.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
        [tokenId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error marking token as used:', error);
      throw error;
    }
  }

  // Clean up expired tokens (run this periodically)
  async cleanupExpiredTokens() {
    try {
      await this.pool.execute(
        'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE'
      );
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }

  // Get user's recent security events
  async getUserSecurityEvents(userId, limit = 10) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT event_type, ip_address, created_at FROM security_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
      );
      return rows;
    } catch (error) {
      console.error('Error getting user security events:', error);
      throw error;
    }
  }

  // Close database connection
  async close() {
    try {
      await this.pool.end();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

export default new DatabaseService();
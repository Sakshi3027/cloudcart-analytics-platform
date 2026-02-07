const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { cacheHelper } = require('../config/redis');
const logger = require('../utils/logger');

class UserController {
  // Register new user
  async register(req, res, next) {
    const client = await pool.connect();
    
    try {
      const { email, password, first_name, last_name } = req.body;

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(
        password,
        parseInt(process.env.BCRYPT_ROUNDS)
      );

      // Insert user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, password_hash, first_name, last_name]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      logger.info('User registered successfully:', { userId: user.id, email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            created_at: user.created_at,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  // User login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Get user from database
      const result = await pool.query(
        `SELECT id, email, password_hash, first_name, last_name, role, is_active
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      // Cache user data (expire in 1 hour)
      await cacheHelper.set(`user:${user.id}`, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      }, 3600);

      logger.info('User logged in:', { userId: user.id, email });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  // Get user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      // Try to get from cache first
      let user = await cacheHelper.get(`user:${userId}`);

      if (!user) {
        // If not in cache, get from database
        const result = await pool.query(
          `SELECT id, email, first_name, last_name, role, created_at, updated_at
           FROM users WHERE id = $1`,
          [userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        user = result.rows[0];

        // Cache for future requests
        await cacheHelper.set(`user:${userId}`, user, 3600);
      }

      logger.debug('Profile retrieved:', { userId });

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    const client = await pool.connect();
    
    try {
      const userId = req.user.id;
      const { first_name, last_name, email } = req.body;

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (first_name) {
        updates.push(`first_name = $${paramCount}`);
        values.push(first_name);
        paramCount++;
      }

      if (last_name) {
        updates.push(`last_name = $${paramCount}`);
        values.push(last_name);
        paramCount++;
      }

      if (email) {
        // Check if new email already exists
        const emailCheck = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, userId]
        );

        if (emailCheck.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use',
          });
        }

        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update',
        });
      }

      // Add updated_at
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      // Execute update
      const result = await client.query(
        `UPDATE users SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, email, first_name, last_name, role, updated_at`,
        values
      );

      const user = result.rows[0];

      // Invalidate cache
      await cacheHelper.del(`user:${userId}`);

      logger.info('Profile updated:', { userId });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Get all users (admin only - we'll add role check later)
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const result = await pool.query(
        `SELECT id, email, first_name, last_name, role, is_active, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await pool.query('SELECT COUNT(*) FROM users');
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      next(error);
    }
  }

  // Health check
  async healthCheck(req, res) {
    try {
      // Check database connection
      await pool.query('SELECT 1');
      
      // Check Redis connection
      const redisConnected = await cacheHelper.set('health:check', 'ok', 10);

      res.json({
        success: true,
        message: 'Service is healthy',
        data: {
          service: 'user-service',
          status: 'UP',
          timestamp: new Date().toISOString(),
          database: 'connected',
          cache: redisConnected ? 'connected' : 'disconnected',
        },
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Service is unhealthy',
        data: {
          service: 'user-service',
          status: 'DOWN',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

module.exports = new UserController();
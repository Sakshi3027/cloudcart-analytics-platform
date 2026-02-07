const { pool } = require('../config/database');
const { cacheHelper } = require('../config/redis');
const logger = require('../utils/logger');

class ProductController {
  async createProduct(req, res, next) {
    const client = await pool.connect();
    try {
      const { name, description, price, category_name, inventory_count, image_url, sku } = req.body;

      if (sku) {
        const existingSKU = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
        if (existingSKU.rows.length > 0) {
          return res.status(409).json({ success: false, message: 'Product with this SKU already exists' });
        }
      }

      let category_id = null;
      if (category_name) {
        const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [category_name]);
        if (categoryResult.rows.length > 0) {
          category_id = categoryResult.rows[0].id;
        }
      }

      const result = await client.query(
        `INSERT INTO products (name, description, price, category_id, category_name, inventory_count, image_url, sku)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, description, price, category_id, category_name, inventory_count || 0, image_url, sku]
      );

      await cacheHelper.delPattern('products:*');
      logger.info('Product created:', { productId: result.rows[0].id, name });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product: result.rows[0] },
      });
    } catch (error) {
      logger.error('Create product error:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  async getProducts(req, res, next) {
    try {
      const { page = 1, limit = 20, category, search, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;

      const cacheKey = `products:page:${page}:limit:${limit}:category:${category || 'all'}:search:${search || 'none'}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const conditions = ['is_active = true'];
      const values = [];
      let paramCount = 1;

      if (category) {
        conditions.push(`category_name = $${paramCount}`);
        values.push(category);
        paramCount++;
      }

      if (search) {
        conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
        values.push(`%${search}%`);
        paramCount++;
      }

      if (minPrice) {
        conditions.push(`price >= $${paramCount}`);
        values.push(minPrice);
        paramCount++;
      }

      if (maxPrice) {
        conditions.push(`price <= $${paramCount}`);
        values.push(maxPrice);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const allowedSortFields = ['name', 'price', 'created_at', 'inventory_count'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      values.push(limit, offset);
      const result = await pool.query(
        `SELECT * FROM products ${whereClause} ORDER BY ${validSortBy} ${validSortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        values
      );

      const countResult = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, values.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);

      const response = {
        success: true,
        data: {
          products: result.rows,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
        },
      };

      await cacheHelper.set(cacheKey, response, 300);
      res.json(response);
    } catch (error) {
      logger.error('Get products error:', error);
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const cacheKey = `product:${id}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: { product: cached } });
      }

      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await cacheHelper.set(cacheKey, result.rows[0], 3600);
      res.json({ success: true, data: { product: result.rows[0] } });
    } catch (error) {
      logger.error('Get product by ID error:', error);
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const updates = req.body;

      const updateFields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach((key) => {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await client.query(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await cacheHelper.del(`product:${id}`);
      await cacheHelper.delPattern('products:*');
      logger.info('Product updated:', { productId: id });

      res.json({ success: true, message: 'Product updated successfully', data: { product: result.rows[0] } });
    } catch (error) {
      logger.error('Update product error:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await cacheHelper.del(`product:${id}`);
      await cacheHelper.delPattern('products:*');
      logger.info('Product deleted (soft):', { productId: id });

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      logger.error('Delete product error:', error);
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const cacheKey = 'categories:all';
      const cached = await cacheHelper.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: { categories: cached } });
      }

      const result = await pool.query('SELECT * FROM categories ORDER BY name');
      await cacheHelper.set(cacheKey, result.rows, 3600);

      res.json({ success: true, data: { categories: result.rows } });
    } catch (error) {
      logger.error('Get categories error:', error);
      next(error);
    }
  }

  async healthCheck(req, res) {
    try {
      await pool.query('SELECT 1');
      const redisConnected = await cacheHelper.set('health:check', 'ok', 10);

      res.json({
        success: true,
        message: 'Service is healthy',
        data: {
          service: 'product-service',
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
        data: { service: 'product-service', status: 'DOWN', timestamp: new Date().toISOString() },
      });
    }
  }
}

module.exports = new ProductController();

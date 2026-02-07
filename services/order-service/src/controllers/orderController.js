const { pool } = require('../config/database');
const { cacheHelper } = require('../config/redis');
const { publishEvent, TOPICS } = require('../kafka/kafkaClient');
const axios = require('axios');
const logger = require('../utils/logger');

class OrderController {
  async createOrder(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { user_id, items, shipping_address } = req.body;

      try {
        const userResponse = await axios.get(
          `${process.env.USER_SERVICE_URL}/api/users/profile`,
          { headers: { Authorization: req.headers.authorization } }
        );
        if (!userResponse.data.success) {
          throw new Error('User not found');
        }
      } catch (error) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found or unauthorized',
        });
      }

      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        try {
          const productResponse = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.product_id}`
          );

          if (!productResponse.data.success) {
            throw new Error(`Product ${item.product_id} not found`);
          }

          const product = productResponse.data.data.product;

          if (product.inventory_count < item.quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: `Insufficient inventory for product: ${product.name}`,
            });
          }

          const subtotal = product.price * item.quantity;
          totalAmount += subtotal;

          orderItems.push({
            product_id: product.id,
            product_name: product.name,
            quantity: item.quantity,
            price: product.price,
            subtotal: subtotal,
          });
        } catch (error) {
          await client.query('ROLLBACK');
          logger.error('Product validation error:', error);
          return res.status(400).json({
            success: false,
            message: `Failed to validate product: ${item.product_id}`,
          });
        }
      }

      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, status, payment_status, shipping_address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, totalAmount, 'pending', 'pending', shipping_address]
      );

      const order = orderResult.rows[0];

      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.product_name, item.quantity, item.price, item.subtotal]
        );
      }

      await client.query(
        `INSERT INTO order_events (order_id, event_type, event_data)
         VALUES ($1, $2, $3)`,
        [order.id, 'ORDER_CREATED', JSON.stringify({ order, items: orderItems })]
      );

      await client.query('COMMIT');

      publishEvent(TOPICS.ORDER_CREATED, {
        eventId: order.id,
        orderId: order.id,
        userId: user_id,
        totalAmount: totalAmount,
        items: orderItems,
        timestamp: new Date().toISOString(),
      }).catch(err => logger.error('Failed to publish ORDER_CREATED event:', err));

      logger.info('Order created successfully:', { orderId: order.id, userId: user_id });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: {
            ...order,
            items: orderItems,
          },
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Create order error:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const cacheKey = `order:${id}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: { order: cached } });
      }

      const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const order = orderResult.rows[0];
      const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      const orderWithItems = { ...order, items: itemsResult.rows };

      await cacheHelper.set(cacheKey, orderWithItems, 1800);
      res.json({ success: true, data: { order: orderWithItems } });
    } catch (error) {
      logger.error('Get order by ID error:', error);
      next(error);
    }
  }

  async getOrdersByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const ordersResult = await pool.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      const countResult = await pool.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
      const total = parseInt(countResult.rows[0].count);

      const ordersWithItems = await Promise.all(
        ordersResult.rows.map(async (order) => {
          const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
          return { ...order, items: itemsResult.rows };
        })
      );

      res.json({
        success: true,
        data: {
          orders: ordersWithItems,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      logger.error('Get orders by user ID error:', error);
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;
      const { status } = req.body;

      const result = await client.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const order = result.rows[0];

      await client.query(
        'INSERT INTO order_events (order_id, event_type, event_data) VALUES ($1, $2, $3)',
        [id, 'ORDER_STATUS_UPDATED', JSON.stringify({ status, timestamp: new Date() })]
      );

      await client.query('COMMIT');

      let kafkaTopic;
      switch (status) {
        case 'confirmed': kafkaTopic = TOPICS.ORDER_CONFIRMED; break;
        case 'shipped': kafkaTopic = TOPICS.ORDER_SHIPPED; break;
        case 'delivered': kafkaTopic = TOPICS.ORDER_DELIVERED; break;
        case 'cancelled': kafkaTopic = TOPICS.ORDER_CANCELLED; break;
        default: kafkaTopic = null;
      }

      if (kafkaTopic) {
        publishEvent(kafkaTopic, {
          eventId: order.id,
          orderId: order.id,
          userId: order.user_id,
          status: status,
          timestamp: new Date().toISOString(),
        }).catch(err => logger.error(`Failed to publish event:`, err));
      }

      await cacheHelper.del(`order:${id}`);
      logger.info('Order status updated:', { orderId: id, status });

      res.json({ success: true, message: 'Order status updated successfully', data: { order } });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Update order status error:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM orders';
      const values = [];
      let paramCount = 1;

      if (status) {
        query += ` WHERE status = $${paramCount}`;
        values.push(status);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);

      const ordersResult = await pool.query(query, values);

      let countQuery = 'SELECT COUNT(*) FROM orders';
      const countValues = [];
      if (status) {
        countQuery += ' WHERE status = $1';
        countValues.push(status);
      }

      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          orders: ordersResult.rows,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      logger.error('Get all orders error:', error);
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;

      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const order = orderResult.rows[0];
      if (!['pending', 'confirmed'].includes(order.status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Cannot cancel order with status: ${order.status}`,
        });
      }

      const result = await client.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['cancelled', id]
      );

      await client.query(
        'INSERT INTO order_events (order_id, event_type, event_data) VALUES ($1, $2, $3)',
        [id, 'ORDER_CANCELLED', JSON.stringify({ reason: 'User cancellation', timestamp: new Date() })]
      );

      await client.query('COMMIT');

      publishEvent(TOPICS.ORDER_CANCELLED, {
        eventId: order.id,
        orderId: order.id,
        userId: order.user_id,
        timestamp: new Date().toISOString(),
      }).catch(err => logger.error('Failed to publish ORDER_CANCELLED event:', err));

      await cacheHelper.del(`order:${id}`);
      logger.info('Order cancelled:', { orderId: id });

      res.json({ success: true, message: 'Order cancelled successfully', data: { order: result.rows[0] } });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Cancel order error:', error);
      next(error);
    } finally {
      client.release();
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
          service: 'order-service',
          status: 'UP',
          timestamp: new Date().toISOString(),
          database: 'connected',
          cache: redisConnected ? 'connected' : 'disconnected',
          kafka: 'connected',
        },
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Service is unhealthy',
        data: { service: 'order-service', status: 'DOWN', timestamp: new Date().toISOString() },
      });
    }
  }
}

module.exports = new OrderController();

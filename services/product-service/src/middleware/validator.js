const Joi = require('joi');
const logger = require('../utils/logger');

const schemas = {
  createProduct: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(2000),
    price: Joi.number().positive().precision(2).required(),
    category_name: Joi.string().max(100),
    inventory_count: Joi.number().integer().min(0).default(0),
    image_url: Joi.string().uri().max(500),
    sku: Joi.string().max(100),
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(2).max(255),
    description: Joi.string().max(2000),
    price: Joi.number().positive().precision(2),
    category_name: Joi.string().max(100),
    inventory_count: Joi.number().integer().min(0),
    image_url: Joi.string().uri().max(500),
    sku: Joi.string().max(100),
    is_active: Joi.boolean(),
  }).min(1),
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = validate;

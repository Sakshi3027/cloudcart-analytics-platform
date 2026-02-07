const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
    first_name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'First name must be at least 2 characters',
      'any.required': 'First name is required',
    }),
    last_name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Last name must be at least 2 characters',
      'any.required': 'Last name is required',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().min(2).max(100),
    last_name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
  }).min(1), // At least one field must be provided
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error('Validation schema not found:', schemaName);
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      logger.debug('Validation failed:', { errors });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

module.exports = validate;
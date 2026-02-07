const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

// Public routes
router.post('/register', validate('register'), userController.register);
router.post('/login', validate('login'), userController.login);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validate('updateProfile'), userController.updateProfile);
router.get('/all', authMiddleware, userController.getAllUsers);

module.exports = router;
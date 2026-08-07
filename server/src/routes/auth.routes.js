const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const { registerRules, loginRules, handleValidation } = require('../middleware/validators');

const router = express.Router();

// Slows down brute-force / credential-stuffing attempts against auth endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, registerRules, handleValidation, register);
router.post('/login', authLimiter, loginRules, handleValidation, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Ingresá un email válido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  login
);
router.get('/me', protect, getMe);

module.exports = router;

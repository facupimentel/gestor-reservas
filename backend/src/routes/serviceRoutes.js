const express = require('express');
const { body, param } = require('express-validator');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const serviceRules = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('El nombre es requerido'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('duration').isInt({ min: 5, max: 600 }).withMessage('La duración debe ser entre 5 y 600 minutos'),
  body('price').isFloat({ min: 0 }).withMessage('El precio no puede ser negativo'),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
];

router.get('/', getServices);
router.get('/:id', [param('id').isMongoId()], validate, getService);
router.post('/', protect, serviceRules, validate, createService);
router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body('duration').optional().isInt({ min: 5, max: 600 }),
    body('price').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateService
);
router.delete('/:id', protect, [param('id').isMongoId()], validate, deleteService);

module.exports = router;

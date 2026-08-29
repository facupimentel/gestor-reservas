const express = require('express');
const { body, query, param } = require('express-validator');
const {
  getAvailability,
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  updateAppointment,
  sendDailyScheduleWhatsApp,
  exportAppointments,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Públicas (flujo de reserva del cliente)
router.get(
  '/availability',
  [
    query('serviceId').isMongoId().withMessage('Servicio inválido'),
    query('date').matches(DATE_REGEX).withMessage('Fecha inválida (usá YYYY-MM-DD)'),
  ],
  validate,
  getAvailability
);

router.post(
  '/',
  [
    body('serviceId').isMongoId().withMessage('Servicio inválido'),
    body('date').matches(DATE_REGEX).withMessage('Fecha inválida (usá YYYY-MM-DD)'),
    body('startTime').matches(TIME_REGEX).withMessage('Horario inválido'),
    body('clientName').trim().isLength({ min: 2, max: 100 }).withMessage('Ingresá un nombre válido'),
    body('clientEmail').trim().isEmail().withMessage('Ingresá un email válido').normalizeEmail(),
    body('clientPhone')
      .trim()
      .isLength({ min: 6, max: 30 })
      .withMessage('Ingresá un teléfono válido')
      .matches(/^[\d\s+()-]+$/)
      .withMessage('El teléfono solo puede tener números y + ( ) -'),
    body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Las notas son demasiado largas'),
  ],
  validate,
  createAppointment
);

// Admin
router.get(
  '/',
  protect,
  [
    query('from').optional().matches(DATE_REGEX).withMessage('Fecha "from" inválida'),
    query('to').optional().matches(DATE_REGEX).withMessage('Fecha "to" inválida'),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  ],
  validate,
  getAppointments
);

router.get(
  '/export',
  protect,
  [
    query('from').optional().matches(DATE_REGEX).withMessage('Fecha "from" inválida'),
    query('to').optional().matches(DATE_REGEX).withMessage('Fecha "to" inválida'),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  ],
  validate,
  exportAppointments
);

router.get('/:id', protect, [param('id').isMongoId()], validate, getAppointment);

router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId(),
    body('date').optional().matches(DATE_REGEX).withMessage('Fecha inválida'),
    body('startTime').optional().matches(TIME_REGEX).withMessage('Horario inválido'),
    body('clientName').optional().trim().isLength({ min: 2, max: 100 }),
    body('clientEmail').optional().trim().isEmail().normalizeEmail(),
    body('clientPhone').optional().trim().isLength({ min: 6, max: 30 }),
    body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  ],
  validate,
  updateAppointment
);

router.patch(
  '/:id/status',
  protect,
  [
    param('id').isMongoId(),
    body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Estado inválido'),
    body('cancelReason').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  ],
  validate,
  updateAppointmentStatus
);

router.post(
  '/schedule/whatsapp',
  protect,
  [body('date').matches(DATE_REGEX).withMessage('Fecha inválida (usá YYYY-MM-DD)')],
  validate,
  sendDailyScheduleWhatsApp
);

module.exports = router;

const express = require('express');
const {
  getAvailability,
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  updateAppointment,
  sendDailyScheduleWhatsApp,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Públicas (flujo de reserva del cliente)
router.get('/availability', getAvailability);
router.post('/', createAppointment);

// Admin
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.put('/:id', protect, updateAppointment);
router.patch('/:id/status', protect, updateAppointmentStatus);
router.post('/schedule/whatsapp', protect, sendDailyScheduleWhatsApp);

module.exports = router;

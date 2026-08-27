const mongoose = require('mongoose');

// Horario semanal: un documento embebido por día de la semana (0=Domingo ... 6=Sábado)
const dayScheduleSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, default: false },
    startTime: { type: String, default: '09:00' }, // HH:mm
    endTime: { type: String, default: '18:00' }, // HH:mm
  },
  { _id: false }
);

const businessConfigSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, default: 'Mi Negocio' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    slotDuration: { type: Number, default: 30 }, // minutos, tamaño de grilla de turnos
    bufferBetweenAppointments: { type: Number, default: 0 }, // minutos de colchón
    advanceBookingDays: { type: Number, default: 30 }, // hasta cuántos días a futuro se puede reservar
    minNoticeHours: { type: Number, default: 1 }, // mínima anticipación para reservar
    weeklySchedule: { type: [dayScheduleSchema], default: [] },
    // fechas puntuales cerradas (feriados, vacaciones), formato 'YYYY-MM-DD'
    closedDates: { type: [String], default: [] },

    // Notificaciones por WhatsApp
    adminWhatsapp: { type: String, default: '' }, // número del negocio que recibe avisos, ej. +5493810000000
    sendClientWhatsapp: { type: Boolean, default: true }, // confirmar el turno al cliente
    sendAdminWhatsapp: { type: Boolean, default: true }, // avisar al negocio de cada nueva reserva
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessConfig', businessConfigSchema);

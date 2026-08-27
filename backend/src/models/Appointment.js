const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    serviceName: { type: String, required: true }, // snapshot por si el servicio cambia luego
    duration: { type: Number, required: true }, // minutos, snapshot
    price: { type: Number, required: true }, // snapshot

    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, trim: true, lowercase: true },
    clientPhone: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },

    date: { type: String, required: true }, // 'YYYY-MM-DD'
    startTime: { type: String, required: true }, // 'HH:mm'
    endTime: { type: String, required: true }, // 'HH:mm'
    start: { type: Date, required: true }, // datetime completo, para ordenar/consultar
    end: { type: Date, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

appointmentSchema.index({ start: 1, end: 1 });
appointmentSchema.index({ date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

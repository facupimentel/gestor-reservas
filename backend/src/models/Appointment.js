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

    // Clave de bloqueo de horario: "YYYY-MM-DD_HH:mm". Solo se setea mientras el turno
    // está activo (no cancelado). Un índice único sobre este campo es lo que evita, a
    // nivel de base de datos, que dos reservas simultáneas se queden con el mismo horario
    // (una simple validación en el código no alcanza: dos requests pueden pasar el chequeo
    // al mismo tiempo, justo antes de guardar). Al cancelar, se limpia para liberar el horario.
    slotKey: { type: String, default: undefined },

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
// sparse: el índice solo aplica a documentos que tengan slotKey definido (turnos activos),
// así que al cancelar (y borrar el campo) el horario queda libre para nuevas reservas.
appointmentSchema.index({ slotKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

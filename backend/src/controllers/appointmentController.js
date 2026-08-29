const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const { getOrCreateConfig } = require('./configController');
const {
  getAvailableSlots,
  dateStringToWeekday,
  buildDateTime,
  timeToMinutes,
} = require('../utils/slots');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const {
  clientConfirmationMessage,
  adminNewBookingMessage,
  dailyScheduleMessage,
} = require('../utils/whatsappMessages');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/appointments/availability?serviceId=...&date=YYYY-MM-DD
const getAvailability = async (req, res, next) => {
  try {
    const { serviceId, date } = req.query;
    if (!serviceId || !date || !DATE_RE.test(date)) {
      return res.status(400).json({ message: 'serviceId y date (YYYY-MM-DD) son requeridos' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const config = await getOrCreateConfig();

    if (config.closedDates.includes(date)) {
      return res.json({ date, slots: [], reason: 'closed_date' });
    }

    const weekday = dateStringToWeekday(date);
    const daySchedule = config.weeklySchedule.find((d) => d.day === weekday);

    const existingAppointments = await Appointment.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('startTime endTime');

    const slots = getAvailableSlots({
      dateStr: date,
      daySchedule,
      serviceDuration: service.duration,
      slotDuration: config.slotDuration,
      bufferBetweenAppointments: config.bufferBetweenAppointments,
      existingAppointments,
      minNoticeHours: config.minNoticeHours,
      now: new Date(),
    });

    res.json({ date, slots });
  } catch (error) {
    next(error);
  }
};

// POST /api/appointments  (público - reserva de un cliente)
const createAppointment = async (req, res, next) => {
  try {
    const {
      serviceId,
      date,
      startTime,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = req.body;

    if (!serviceId || !date || !startTime || !clientName || !clientEmail || !clientPhone) {
      return res.status(400).json({ message: 'Faltan datos requeridos para la reserva' });
    }
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ message: 'Formato de fecha inválido' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const config = await getOrCreateConfig();
    if (config.closedDates.includes(date)) {
      return res.status(409).json({ message: 'El negocio está cerrado ese día' });
    }

    const weekday = dateStringToWeekday(date);
    const daySchedule = config.weeklySchedule.find((d) => d.day === weekday);

    const existingAppointments = await Appointment.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('startTime endTime');

    const availableSlots = getAvailableSlots({
      dateStr: date,
      daySchedule,
      serviceDuration: service.duration,
      slotDuration: config.slotDuration,
      bufferBetweenAppointments: config.bufferBetweenAppointments,
      existingAppointments,
      minNoticeHours: config.minNoticeHours,
      now: new Date(),
    });

    const chosenSlot = availableSlots.find((s) => s.startTime === startTime);
    if (!chosenSlot) {
      return res.status(409).json({
        message: 'Ese horario ya no está disponible. Por favor elegí otro.',
      });
    }

    const start = buildDateTime(date, chosenSlot.startTime);
    const end = buildDateTime(date, chosenSlot.endTime);

    let appointment;
    try {
      appointment = await Appointment.create({
        service: service._id,
        serviceName: service.name,
        duration: service.duration,
        price: service.price,
        clientName,
        clientEmail,
        clientPhone,
        notes: notes || '',
        date,
        startTime: chosenSlot.startTime,
        endTime: chosenSlot.endTime,
        start,
        end,
        slotKey: `${date}_${chosenSlot.startTime}`,
        status: 'confirmed',
      });
    } catch (err) {
      // Código 11000 = choque contra el índice único de slotKey: alguien reservó
      // ese mismo horario en el instante entre que chequeamos disponibilidad y guardamos.
      if (err.code === 11000) {
        return res.status(409).json({
          message: 'Ese horario acaba de ser reservado por otra persona. Por favor elegí otro.',
        });
      }
      throw err;
    }

    // Notificaciones por WhatsApp: no bloquean ni rompen la respuesta si fallan
    const notifications = [];
    if (config.sendClientWhatsapp !== false) {
      notifications.push(
        sendWhatsAppMessage(appointment.clientPhone, clientConfirmationMessage(appointment, config.businessName))
      );
    }
    if (config.sendAdminWhatsapp !== false && config.adminWhatsapp) {
      notifications.push(
        sendWhatsAppMessage(config.adminWhatsapp, adminNewBookingMessage(appointment, config.businessName))
      );
    }
    if (notifications.length) {
      await Promise.allSettled(notifications);
    }

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments  (admin) ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=
const getAppointments = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ start: 1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/:id  (admin)
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Turno no encontrado' });
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/appointments/:id/status  (admin) - confirmar/cancelar/completar
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Turno no encontrado' });

    appointment.status = status;
    appointment.cancelReason = status === 'cancelled' ? cancelReason || '' : '';

    if (status === 'cancelled') {
      // Libera el horario: al borrar slotKey, el índice único deja de aplicar sobre este documento
      appointment.slotKey = undefined;
    } else if (!appointment.slotKey) {
      // Reactivar un turno cancelado: hay que volver a tomar el horario (puede fallar si
      // alguien más lo ocupó mientras tanto)
      appointment.slotKey = `${appointment.date}_${appointment.startTime}`;
    }

    try {
      await appointment.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          message: 'No se puede reactivar: ese horario ya fue tomado por otra reserva.',
        });
      }
      throw err;
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// PUT /api/appointments/:id  (admin) - reprogramar / editar datos
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Turno no encontrado' });

    const { date, startTime, clientName, clientEmail, clientPhone, notes } = req.body;

    if (date && startTime) {
      const service = await Service.findById(appointment.service);
      const config = await getOrCreateConfig();
      const weekday = dateStringToWeekday(date);
      const daySchedule = config.weeklySchedule.find((d) => d.day === weekday);

      const existingAppointments = await Appointment.find({
        date,
        status: { $ne: 'cancelled' },
        _id: { $ne: appointment._id },
      }).select('startTime endTime');

      const availableSlots = getAvailableSlots({
        dateStr: date,
        daySchedule,
        serviceDuration: appointment.duration,
        slotDuration: config.slotDuration,
        bufferBetweenAppointments: config.bufferBetweenAppointments,
        existingAppointments,
        minNoticeHours: 0,
        now: new Date(),
      });

      const chosenSlot = availableSlots.find((s) => s.startTime === startTime);
      if (!chosenSlot) {
        return res.status(409).json({ message: 'Ese horario no está disponible' });
      }

      appointment.date = date;
      appointment.startTime = chosenSlot.startTime;
      appointment.endTime = chosenSlot.endTime;
      appointment.start = buildDateTime(date, chosenSlot.startTime);
      appointment.end = buildDateTime(date, chosenSlot.endTime);
      if (appointment.status !== 'cancelled') {
        appointment.slotKey = `${date}_${chosenSlot.startTime}`;
      }
    }

    if (clientName) appointment.clientName = clientName;
    if (clientEmail) appointment.clientEmail = clientEmail;
    if (clientPhone) appointment.clientPhone = clientPhone;
    if (notes !== undefined) appointment.notes = notes;

    try {
      await appointment.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Ese horario ya fue tomado por otra reserva.' });
      }
      throw err;
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// POST /api/appointments/schedule/whatsapp  (admin) - envía el cronograma de un día al WhatsApp del negocio
const sendDailyScheduleWhatsApp = async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ message: 'Fecha inválida (usá formato YYYY-MM-DD)' });
    }

    const config = await getOrCreateConfig();
    if (!config.adminWhatsapp) {
      return res.status(400).json({
        message:
          'No hay un número de WhatsApp del negocio configurado. Cargalo en Horarios y configuración.',
      });
    }

    const appointments = await Appointment.find({ date }).sort({ start: 1 });
    const message = dailyScheduleMessage(date, appointments, config.businessName);
    const result = await sendWhatsAppMessage(config.adminWhatsapp, message);

    if (result.error) {
      return res.status(502).json({ message: `No se pudo enviar el WhatsApp: ${result.error}` });
    }
    if (result.skipped) {
      return res.status(400).json({
        message: 'El envío de WhatsApp no está configurado en el servidor (faltan credenciales de Twilio).',
      });
    }

    res.json({ message: 'Cronograma enviado por WhatsApp', sid: result.sid });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/export  (admin) - descarga CSV de turnos en un rango de fechas
const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const STATUS_LABEL = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

const exportAppointments = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ start: 1 });

    const headers = [
      'Fecha',
      'Hora inicio',
      'Hora fin',
      'Cliente',
      'Email',
      'Teléfono',
      'Servicio',
      'Precio',
      'Estado',
      'Notas',
      'Reservado el',
    ];
    const rows = appointments.map((a) => [
      a.date,
      a.startTime,
      a.endTime,
      a.clientName,
      a.clientEmail,
      a.clientPhone,
      a.serviceName,
      a.price,
      STATUS_LABEL[a.status] || a.status,
      a.notes,
      a.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    // BOM al inicio para que Excel detecte UTF-8 y no rompa los acentos/ñ
    const csvWithBom = '\uFEFF' + csv;

    const filename = `turnos_${from || 'inicio'}_a_${to || 'hoy'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBom);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  updateAppointment,
  sendDailyScheduleWhatsApp,
  exportAppointments,
};

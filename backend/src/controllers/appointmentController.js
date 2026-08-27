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

    const appointment = await Appointment.create({
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
      status: 'confirmed',
    });

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
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, cancelReason: status === 'cancelled' ? cancelReason || '' : '' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Turno no encontrado' });
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
    }

    if (clientName) appointment.clientName = clientName;
    if (clientEmail) appointment.clientEmail = clientEmail;
    if (clientPhone) appointment.clientPhone = clientPhone;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();
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

module.exports = {
  getAvailability,
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  updateAppointment,
  sendDailyScheduleWhatsApp,
};

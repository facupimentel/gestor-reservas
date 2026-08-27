// Utilidades de fecha/hora sin dependencias externas.
// Todas las fechas se manejan en hora local del servidor.

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const dateStringToWeekday = (dateStr) => {
  // dateStr: 'YYYY-MM-DD' -> devuelve 0 (domingo) a 6 (sábado), en hora LOCAL
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

const buildDateTime = (dateStr, timeStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
};

/**
 * Genera los bloques posibles de inicio de turno para un día dado,
 * en base al horario de apertura y la duración deseada del servicio,
 * y los filtra contra los turnos ya ocupados.
 */
function getAvailableSlots({
  dateStr,
  daySchedule, // { isOpen, startTime, endTime }
  serviceDuration, // minutos
  slotDuration, // minutos, tamaño de la grilla
  bufferBetweenAppointments = 0,
  existingAppointments = [], // [{ startTime, endTime }]
  minNoticeHours = 0,
  now = new Date(),
}) {
  if (!daySchedule || !daySchedule.isOpen) return [];

  const openMin = timeToMinutes(daySchedule.startTime);
  const closeMin = timeToMinutes(daySchedule.endTime);
  const step = slotDuration && slotDuration > 0 ? slotDuration : serviceDuration;

  const busyRanges = existingAppointments.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime) + bufferBetweenAppointments,
  }));

  const slots = [];
  for (let start = openMin; start + serviceDuration <= closeMin; start += step) {
    const end = start + serviceDuration;

    const overlaps = busyRanges.some((b) => start < b.end && end > b.start - bufferBetweenAppointments);
    if (overlaps) continue;

    const candidateDateTime = buildDateTime(dateStr, minutesToTime(start));
    const minAllowed = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
    if (candidateDateTime < minAllowed) continue;

    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    });
  }

  return slots;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  dateStringToWeekday,
  buildDateTime,
  getAvailableSlots,
};

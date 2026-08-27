const formatMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const clientConfirmationMessage = (appt, businessName) =>
  `Hola ${appt.clientName}! ✅ Tu turno en *${businessName}* quedó confirmado.\n\n` +
  `📅 ${appt.date}\n` +
  `🕐 ${appt.startTime} a ${appt.endTime} hs\n` +
  `💈 ${appt.serviceName}\n` +
  `💰 ${formatMoney(appt.price)}\n\n` +
  `Si necesitás cancelar o reprogramar, contactanos directamente. ¡Te esperamos!`;

const adminNewBookingMessage = (appt, businessName) =>
  `🔔 Nueva reserva en ${businessName}\n\n` +
  `👤 ${appt.clientName} (${appt.clientPhone})\n` +
  `💈 ${appt.serviceName}\n` +
  `📅 ${appt.date}  🕐 ${appt.startTime}-${appt.endTime} hs\n` +
  `💰 ${formatMoney(appt.price)}` +
  (appt.notes ? `\n📝 ${appt.notes}` : '');

const dailyScheduleMessage = (dateStr, appointments, businessName) => {
  if (appointments.length === 0) {
    return `📋 Cronograma de ${businessName} — ${dateStr}\n\nNo hay turnos agendados para este día.`;
  }
  const statusEmoji = { pending: '🟡', confirmed: '🟢', cancelled: '🔴', completed: '⚪' };
  const lines = appointments
    .map(
      (a) =>
        `${statusEmoji[a.status] || '•'} ${a.startTime}-${a.endTime}  ${a.clientName} — ${a.serviceName}`
    )
    .join('\n');
  const total = appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.price, 0);

  return `📋 Cronograma de ${businessName} — ${dateStr}\n\n${lines}\n\nTotal estimado: ${formatMoney(total)}`;
};

module.exports = { clientConfirmationMessage, adminNewBookingMessage, dailyScheduleMessage, formatMoney };

// Envío de WhatsApp vía Twilio. Diseñado para nunca tirar abajo el flujo de
// reservas: si falta configuración o Twilio falla, se loguea y se sigue.

let twilioClient = null;

const isConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);

const getClient = () => {
  if (!isConfigured()) return null;
  if (!twilioClient) {
    // require perezoso: si el paquete no está instalado y nadie configuró Twilio, no rompe el arranque
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

/**
 * Normaliza un número de teléfono a formato E.164 con prefijo "whatsapp:".
 * Si el número no trae "+", le agrega el código de país por defecto.
 */
const formatWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let digits = String(phone).trim().replace(/[^\d+]/g, '');
  if (!digits) return null;

  if (!digits.startsWith('+')) {
    const countryCode = process.env.DEFAULT_COUNTRY_CODE || '54';
    digits = digits.replace(/^0+/, ''); // saca el 0 inicial típico de códigos de área
    digits = `+${countryCode}${digits}`;
  }
  return `whatsapp:${digits}`;
};

/**
 * Envía un mensaje de WhatsApp. Nunca lanza excepción: devuelve un objeto
 * describiendo el resultado para que quien llama decida qué mostrar.
 */
const sendWhatsAppMessage = async (toPhone, body) => {
  const client = getClient();
  if (!client) {
    console.warn('[whatsapp] Twilio no configurado, se omite el envío. Mensaje:\n', body);
    return { skipped: true, reason: 'not_configured' };
  }

  const to = formatWhatsAppNumber(toPhone);
  if (!to) {
    return { skipped: true, reason: 'invalid_number' };
  }

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to,
      body,
    });
    return { sid: message.sid };
  } catch (error) {
    console.error('[whatsapp] Error enviando mensaje:', error.message);
    return { error: error.message };
  }
};

module.exports = { sendWhatsAppMessage, formatWhatsAppNumber, isConfigured };

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * WhatsApp Service – Meta Cloud API Integration
 *
 * Currently operates in PLACEHOLDER mode when WHATSAPP_TOKEN is not set.
 * To activate: set WHATSAPP_API_URL, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID in .env
 *
 * Meta Cloud API Reference:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */

const isConfigured = () =>
  !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_API_URL);

/**
 * Send a text message via WhatsApp.
 * Falls back to placeholder logging when not configured.
 */
const sendWhatsApp = async ({ to, message }) => {
  // Normalize phone: strip spaces, ensure + prefix
  const phone = to.replace(/\s+/g, '').startsWith('+') ? to.replace(/\s+/g, '') : `+94${to.replace(/\s+/g, '').replace(/^0/, '')}`;

  if (!isConfigured()) {
    logger.info(`[WhatsApp PLACEHOLDER] To: ${phone} | Message: ${message}`);
    return { placeholder: true, to: phone, message };
  }

  const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  logger.info(`[WhatsApp] Sent to ${phone} | MessageId: ${response.data?.messages?.[0]?.id}`);
  return response.data;
};

// ── Message Templates ──────────────────────────────────────────────────────

const sendPaymentReminderWhatsApp = async ({ name, phone, dueDate, amount }) => {
  const message = `Hi ${name} 👋\n\nThis is a reminder that your Focus Fitness membership fee of *LKR ${amount}* is due on *${dueDate}*.\n\nPlease make your cash payment at the gym before the due date.\n\nThank you! 💪\n– Focus Fitness Team`;
  return sendWhatsApp({ to: phone, message });
};

const sendBirthdayWhatsApp = async ({ name, phone }) => {
  const message = `Happy Birthday ${name}! 🎉🎂\n\nWishing you a wonderful day filled with strength and joy! Stay strong 💪\n\n– Focus Fitness Team`;
  return sendWhatsApp({ to: phone, message });
};

module.exports = { sendWhatsApp, sendPaymentReminderWhatsApp, sendBirthdayWhatsApp, isConfigured };

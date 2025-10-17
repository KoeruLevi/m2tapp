const sgMail = require('@sendgrid/mail');

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

if (!API_KEY) {
  console.warn('[MAILER] SENDGRID_API_KEY no está configurada. No se enviarán correos.');
} else {
  sgMail.setApiKey(API_KEY);
}

function normalizeList(to) {
  if (Array.isArray(to)) return to.filter(Boolean);
  return String(to || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Enviar correo usando SendGrid API (HTTP).
 * @param {Object} opts
 * @param {string|string[]} opts.to - destinatario(s)
 * @param {string} opts.subject
 * @param {string} [opts.html]
 * @param {string} [opts.text]
 */
async function sendMail({ to, subject, html, text }) {
  const list = normalizeList(to);

  if (!API_KEY) {
    console.log('[MAILER] Envío omitido (sin API key). Destinatarios:', list);
    return;
  }
  if (!list.length) return;

  const base = { from: FROM, subject, html, text };

  try {
    if (list.length > 1) {
      // envía a N destinatarios
      await sgMail.sendMultiple({ ...base, to: list });
      console.log('[MAILER] SendGrid OK (multiple) ->', list.join(', '));
    } else {
      // envía a 1 destinatario
      const [resp] = await sgMail.send({ ...base, to: list[0] });
      console.log('[MAILER] SendGrid OK:', resp?.statusCode, '->', list[0]);
    }
  } catch (err) {
    const details = err?.response?.body?.errors || err?.message || err;
    console.error('[MAILER] Error SendGrid:', details);
    // No relanzamos para no bloquear el flujo de la API
  }
}

module.exports = { sendMail };
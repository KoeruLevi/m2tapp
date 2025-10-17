const sgMail = require('@sendgrid/mail');

const API_KEY = process.env.SENDGRID_API_KEY;
const DEFAULT_FROM = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

if (!API_KEY) {
  console.warn('[MAILER] SENDGRID_API_KEY no está configurada. No se enviarán correos.');
} else {
  sgMail.setApiKey(API_KEY);
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
  if (!API_KEY) {
    console.log('[MAILER] Envío omitido (sin API key). Destinatarios:', to);
    return;
  }

  const list = Array.isArray(to)
    ? to
    : String(to)
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

  const msg = {
    to: list,
    from: DEFAULT_FROM,       // Debe estar verificado en SendGrid (Single Sender o dominio)
    subject,
    text,
    html,
  };

  try {
    const [resp] = await sgMail.send(msg, false); // false = no usar batch por defecto
    console.log('[MAILER] Enviado SendGrid:', resp?.statusCode, '->', list.join(', '));
  } catch (err) {
    // No propagamos el error para que NUNCA bloquee tu request
    console.error('[MAILER] Error SendGrid:', err?.message || err);
  }
}

module.exports = { sendMail };
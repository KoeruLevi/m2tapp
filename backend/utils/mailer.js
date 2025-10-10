const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const secure = process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!host || !user || !pass) {
  console.warn('[MAILER] Variables SMTP incompletas. No se enviarán correos.');
}

const transporter = (host && user && pass)
  ? nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      logger: true,
    })
  : null;

if (transporter) {
  transporter.verify().then(() => {
    console.log('[MAILER] SMTP listo para enviar.');
  }).catch(err => {
    console.error('[MAILER] Error de SMTP en verify():', err.message);
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('[MAILER] Envío omitido: transporter no configurado. Destinatarios:', to);
    return;
  }
  const from = process.env.SMTP_FROM || user;
  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log('[MAILER] Enviado:', info.messageId, '->', to);
    return info;
  } catch (err) {
    console.error('[MAILER] Error al enviar:', err.message);
    throw err;
  }
}

module.exports = { sendMail };
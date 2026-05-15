// utils/mailer.js

const PROVIDER = (process.env.MAIL_PROVIDER || 'emailjs').toLowerCase();

const FROM_NAME = process.env.MAIL_FROM_NAME || 'Soporte M2T';

// EmailJS
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const EMAILJS_REPLY_TO = process.env.EMAILJS_REPLY_TO || '';

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

// EmailJS tiene rate limit de 1 request por segundo.
// Como los tickets pueden tener varios asignados, se envía uno por uno.
const EMAILJS_DELAY_MS = Number(process.env.EMAILJS_DELAY_MS || 1100);

function normalizeList(to) {
  if (Array.isArray(to)) return to.filter(Boolean);

  return String(to || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function ensureEmailJsConfig() {
  const missing = [];

  if (!EMAILJS_SERVICE_ID) missing.push('EMAILJS_SERVICE_ID');
  if (!EMAILJS_TEMPLATE_ID) missing.push('EMAILJS_TEMPLATE_ID');
  if (!EMAILJS_PUBLIC_KEY) missing.push('EMAILJS_PUBLIC_KEY');

  if (missing.length) {
    console.warn(`[MAILER] EmailJS no configurado. Faltan variables: ${missing.join(', ')}`);
    return false;
  }

  return true;
}

async function sendEmailJsOne({ toEmail, subject, html, text }) {
  if (typeof fetch !== 'function') {
    console.error('[MAILER] fetch no está disponible. Usa Node 18+ o Node 20 en Render.');
    return;
  }

  const messageText = text || stripHtml(html || '');

  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email: toEmail,
      from_name: FROM_NAME,
      reply_to: EMAILJS_REPLY_TO,
      subject,
      message_text: messageText,
      message_html: html || messageText,
    },
  };

  // Private Key / Access Token de EmailJS.
  // Es opcional en EmailJS, pero recomendado si se usa desde backend.
  if (EMAILJS_PRIVATE_KEY) {
    payload.accessToken = EMAILJS_PRIVATE_KEY;
  }

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`EmailJS respondió ${response.status}: ${responseText}`);
  }

  console.log('[MAILER] EmailJS OK ->', toEmail, responseText || 'OK');
}

/**
 * Enviar correo.
 * Mantiene la misma interfaz que ya usa ticketController.js:
 * sendMail({ to, subject, html, text })
 *
 * @param {{to:string|string[], subject:string, html?:string, text?:string}} param0
 */
async function sendMail({ to, subject, html, text }) {
  const list = normalizeList(to);

  if (!list.length) {
    console.log('[MAILER] Envío omitido: no hay destinatarios.');
    return;
  }

  if (PROVIDER !== 'emailjs') {
    console.warn('[MAILER] MAIL_PROVIDER no soportado en este mailer:', PROVIDER);
    return;
  }

  if (!ensureEmailJsConfig()) {
    console.log('[MAILER] Envío omitido. Destinatarios:', list);
    return;
  }

  for (let i = 0; i < list.length; i++) {
    const toEmail = list[i];

    try {
      await sendEmailJsOne({ toEmail, subject, html, text });
    } catch (err) {
      console.error('[MAILER] Error EmailJS:', err?.message || err);
    }

    if (i < list.length - 1) {
      await sleep(EMAILJS_DELAY_MS);
    }
  }
}

module.exports = { sendMail };
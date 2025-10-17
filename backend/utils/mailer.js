// utils/mailer.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const PROVIDER = (process.env.MAIL_PROVIDER || 'brevo').toLowerCase();
// Para Brevo:
const BREVO_KEY = process.env.BREVO_API_KEY;
// Remitente (usa el mismo para cualquier proveedor)
const FROM_EMAIL = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
const FROM_NAME  = process.env.MAIL_FROM_NAME || 'Soporte M2T';

// --- Inicialización Brevo ---
let brevoTransactional = null;
if (PROVIDER === 'brevo') {
  if (!BREVO_KEY) {
    console.warn('[MAILER] BREVO_API_KEY no está configurada. No se enviarán correos.');
  } else {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = BREVO_KEY;
    brevoTransactional = new SibApiV3Sdk.TransactionalEmailsApi();
  }
}

function normalizeList(to) {
  if (Array.isArray(to)) return to.filter(Boolean);
  return String(to || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Enviar correo (actualmente Brevo).
 * @param {{to:string|string[], subject:string, html?:string, text?:string}} param0
 */
async function sendMail({ to, subject, html, text }) {
  const list = normalizeList(to);
  if (!list.length) return;

  if (PROVIDER === 'brevo') {
    if (!brevoTransactional) {
      console.log('[MAILER] Envío omitido (Brevo no configurado). Destinatarios:', list);
      return;
    }
    const payload = {
      sender: { email: FROM_EMAIL, name: FROM_NAME }, // remitente DEBES tenerlo verificado en Brevo
      to: list.map(email => ({ email })),
      subject,
      htmlContent: html,
      textContent: text,
    };

    try {
      const data = await brevoTransactional.sendTransacEmail(payload);
      console.log('[MAILER] Brevo OK ->', list.join(', '), 'messageId:', data?.messageId || data?.messageIds?.[0]);
    } catch (err) {
      const detail = err?.response?.text || err?.message || err;
      console.error('[MAILER] Error Brevo:', detail);
      // No relanzamos para no bloquear el flujo de la API
    }
    return;
  }

  // Si en el futuro quieres soportar otros proveedores, agrégalos aquí.
  console.warn('[MAILER] MAIL_PROVIDER no soportado:', PROVIDER);
}

module.exports = { sendMail };
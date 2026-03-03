// utils/mailer.js
const PROVIDER = (process.env.MAIL_PROVIDER || 'resend').toLowerCase();

// Remitente (para cualquier proveedor)
const FROM_EMAIL = process.env.MAIL_FROM; // ej: "soporte@tudominio.com"
const FROM_NAME  = process.env.MAIL_FROM_NAME || 'Soporte M2T';

// ============ RESEND ============
let resendClient = null;
if (PROVIDER === 'resend') {
  const RESEND_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_KEY) {
    console.warn('[MAILER] RESEND_API_KEY no está configurada. No se enviarán correos.');
  } else {
    // Resend SDK (CommonJS)
    let ResendCtor = null;
    try {
      // Algunas versiones exponen { Resend }
      ResendCtor = require('resend').Resend;
    } catch (_) {
      ResendCtor = null;
    }

    if (!ResendCtor) {
      // fallback por si el export cambia
      const pkg = require('resend');
      ResendCtor = pkg.Resend || pkg.default || pkg;
    }

    resendClient = new ResendCtor(RESEND_KEY);
  }

  if (!FROM_EMAIL) {
    console.warn('[MAILER] MAIL_FROM no está configurado. Resend requiere "from" válido (dominio verificado).');
  }
}

// ============ BREVO (opcional) ============
let brevoTransactional = null;
if (PROVIDER === 'brevo') {
  const SibApiV3Sdk = require('sib-api-v3-sdk');
  const BREVO_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_KEY) {
    console.warn('[MAILER] BREVO_API_KEY no está configurada. No se enviarán correos.');
  } else {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = BREVO_KEY;
    brevoTransactional = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  if (!FROM_EMAIL) {
    console.warn('[MAILER] MAIL_FROM no está configurado. Brevo requiere sender verificado.');
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
 * Enviar correo
 * @param {{to:string|string[], subject:string, html?:string, text?:string}} param0
 */
async function sendMail({ to, subject, html, text }) {
  const list = normalizeList(to);
  if (!list.length) return;

  // -------- RESEND --------
  if (PROVIDER === 'resend') {
    if (!resendClient || !FROM_EMAIL) {
      console.log('[MAILER] Envío omitido (Resend no configurado). Destinatarios:', list);
      return;
    }

    const from = FROM_NAME ? `${FROM_NAME} <${FROM_EMAIL}>` : FROM_EMAIL;

    try {
      // Resend: admite "to" como string o array
      const resp = await resendClient.emails.send({
        from,
        to: list,
        subject,
        html: html || undefined,
        text: text || undefined,
      });

      // resp suele traer id
      console.log('[MAILER] Resend OK ->', list.join(', '), 'id:', resp?.data?.id || resp?.id);
    } catch (err) {
      const detail =
        err?.response?.data ||
        err?.message ||
        err;
      console.error('[MAILER] Error Resend:', detail);
    }
    return;
  }

  // -------- BREVO --------
  if (PROVIDER === 'brevo') {
    if (!brevoTransactional || !FROM_EMAIL) {
      console.log('[MAILER] Envío omitido (Brevo no configurado). Destinatarios:', list);
      return;
    }

    const payload = {
      sender: { email: FROM_EMAIL, name: FROM_NAME },
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
    }
    return;
  }

  console.warn('[MAILER] MAIL_PROVIDER no soportado:', PROVIDER);
}

module.exports = { sendMail };
// ============================================================================
// mercadoPago.js — integração com Mercado Pago Checkout Pro.
//
// Usa a REST API direta (sem SDK) para evitar dependências extras.
// Exporta:
//   - createPreference({ sale, items, payer, backUrls, notificationUrl })
//   - fetchPayment(paymentId)
//   - verifyWebhookSignature(req)  (se MP_WEBHOOK_SECRET estiver setado)
//
// Env vars necessárias:
//   MP_ACCESS_TOKEN      — token de acesso da aplicação (produção: APP_USR-...)
//   MP_WEBHOOK_SECRET    — opcional, validação HMAC do webhook
//   PUBLIC_BACKEND_URL   — URL pública do backend (ex: https://api.donadenna.com)
//                          usada como notification_url. Em dev, use ngrok.
//   PUBLIC_FRONTEND_URL  — URL pública do frontend, usada como back_urls
// ============================================================================

const crypto = require('crypto');

const MP_BASE = 'https://api.mercadopago.com';

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error('MP_ACCESS_TOKEN não configurado');
  return t;
}

async function mpFetch(path, { method = 'GET', body, idempotencyKey } = {}) {
  const headers = {
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  const res = await fetch(`${MP_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message || data?.error || `Mercado Pago ${res.status}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

/**
 * Cria uma preferência de pagamento (Checkout Pro).
 * Retorna { id, init_point, sandbox_init_point }.
 */
async function createPreference({ sale, items, shipping, payer, backUrls, notificationUrl, externalReference }) {
  const preferenceItems = items.map((it) => ({
    id: String(it.variant_id || it.id || ''),
    title: it.product_name || it.title || 'Produto',
    description: it.variant_label || it.description || undefined,
    quantity: Number(it.quantity || 1),
    currency_id: 'BRL',
    unit_price: Number(it.unit_price || it.price || 0),
  }));

  // Soma do frete entra como item separado (padrão MP — não tem campo
  // dedicado de "shipping_amount" no Checkout Pro fora do marketplace).
  if (shipping && Number(shipping.amount) > 0) {
    preferenceItems.push({
      id: 'shipping',
      title: `Frete · ${shipping.service || 'Entrega'}`,
      quantity: 1,
      currency_id: 'BRL',
      unit_price: Number(shipping.amount),
    });
  }

  const body = {
    items: preferenceItems,
    external_reference: externalReference || sale?.id,
    statement_descriptor: 'DONADENNA',
    back_urls: backUrls,
    auto_return: 'approved',
    notification_url: notificationUrl,
    metadata: { sale_id: sale?.id },
    payer: payer || undefined,
    // Permite todos os meios. Para forçar só PIX use:
    //   payment_methods: { excluded_payment_types: [{ id: 'credit_card' }, ...] }
  };

  return mpFetch('/checkout/preferences', {
    method: 'POST',
    body,
    idempotencyKey: `pref-${sale?.id}-${Date.now()}`,
  });
}

async function fetchPayment(paymentId) {
  return mpFetch(`/v1/payments/${paymentId}`);
}

/**
 * Valida assinatura HMAC do webhook (header x-signature).
 * Doc: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 * Retorna true se válido ou se MP_WEBHOOK_SECRET não estiver configurado
 * (em dev/sem secret a gente confia mas loga).
 */
function verifyWebhookSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret => sem validação (apenas dev)

  const signatureHeader = req.headers['x-signature'] || '';
  const requestId = req.headers['x-request-id'] || '';
  const dataId = String(req.query['data.id'] || req.body?.data?.id || '');

  // x-signature: "ts=1234567890,v1=abc..."
  const parts = String(signatureHeader).split(',').reduce((acc, kv) => {
    const [k, v] = kv.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
}

module.exports = { createPreference, fetchPayment, verifyWebhookSignature };

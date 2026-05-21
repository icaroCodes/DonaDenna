// ============================================================================
// /webhooks/mercadopago — recebe notificações de pagamento do Mercado Pago.
//
// ROTA PÚBLICA — não passa por shopperAuth nem requireAuth. Segurança:
//   1. Valida x-signature (HMAC) se MP_WEBHOOK_SECRET estiver configurado.
//   2. Faz fetch do pagamento na API do MP usando o access_token nosso
//      (não confia no payload do request — ele só nos diz o ID).
//
// Quando o pagamento volta "approved":
//   - Insere em sale_payments (sale_id, amount, payment_date, notes)
//   - Atualiza sales.paid_amount += amount, status='paid' se quitado
//   - Insere financial_transactions (entrada, vendas, origin='venda')
//
// Idempotente: o mesmo payment_id pode chegar várias vezes — verificamos
// se já existe sale_payment com mesma referência antes de inserir.
// ============================================================================

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const mp = require('../lib/mercadoPago');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.post('/mercadopago', async (req, res) => {
  // Responde 200 cedo — MP reenvia se a gente demorar; o processamento
  // continua em background.
  try {
    const signatureOk = mp.verifyWebhookSignature(req);
    if (!signatureOk) {
      console.warn('[mp-webhook] assinatura inválida');
      return res.status(401).send('invalid signature');
    }

    const type = req.body?.type || req.query?.type;
    const dataId = req.body?.data?.id || req.query['data.id'];
    if (type !== 'payment' || !dataId) {
      // Outros tipos (merchant_order, plan, subscription) — ignora.
      return res.status(200).send('ignored');
    }

    res.status(200).send('ok'); // ACK imediato

    // Processamento assíncrono
    processPayment(dataId).catch((e) =>
      console.error('[mp-webhook] erro processando payment', dataId, e?.message)
    );
  } catch (err) {
    console.error('[mp-webhook] erro', err?.message);
    if (!res.headersSent) res.status(500).send('error');
  }
});

async function processPayment(paymentId) {
  const payment = await mp.fetchPayment(paymentId);

  const saleId = payment.external_reference;
  const status = payment.status; // approved | pending | rejected | refunded | ...
  const amount = Number(payment.transaction_amount || 0);
  const method = payment.payment_method_id || payment.payment_type_id || 'mercadopago';
  const paidAt = payment.date_approved || payment.date_created || new Date().toISOString();

  console.log(`[mp-webhook] payment ${paymentId} status=${status} sale=${saleId} amount=${amount}`);

  if (!saleId) {
    console.warn('[mp-webhook] payment sem external_reference; ignorando');
    return;
  }

  if (status !== 'approved') {
    // Só agimos em approved. Outros estados ficam pra retry do MP.
    return;
  }

  // Idempotência: se já registramos esse payment_id, sai.
  const reference = `mp:${paymentId}`;
  const { data: existing } = await supabase
    .from('sale_payments')
    .select('id')
    .eq('sale_id', saleId)
    .ilike('notes', `%${reference}%`)
    .maybeSingle();
  if (existing) {
    console.log('[mp-webhook] payment já registrado, idempotência ok');
    return;
  }

  // Busca a venda
  const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .select('id, customer_name, total_amount, paid_amount, status')
    .eq('id', saleId)
    .maybeSingle();
  if (saleErr || !sale) {
    console.error('[mp-webhook] venda não encontrada', saleId, saleErr?.message);
    return;
  }

  // 1) sale_payments
  const { error: payErr } = await supabase.from('sale_payments').insert({
    sale_id: sale.id,
    amount,
    payment_date: paidAt.slice(0, 10),
    notes: `Mercado Pago (${method}) · ${reference}`,
  });
  if (payErr) {
    console.error('[mp-webhook] insert sale_payments', payErr.message);
    return;
  }

  // 2) sales.paid_amount / status
  const newPaid = Math.round((Number(sale.paid_amount || 0) + amount) * 100) / 100;
  const isFullyPaid = newPaid >= Number(sale.total_amount || 0) - 0.01;
  await supabase
    .from('sales')
    .update({
      paid_amount: newPaid,
      status: isFullyPaid ? 'paid' : 'partial',
    })
    .eq('id', sale.id);

  // 3) financial_transactions (entrada)
  await supabase.from('financial_transactions').insert({
    type: 'entrada',
    amount,
    description: `Venda online para ${sale.customer_name || 'Cliente'} (Mercado Pago · ${method})`,
    origin: 'venda',
    reference_id: sale.id,
    date: paidAt.slice(0, 10),
  });

  console.log(`[mp-webhook] venda ${sale.id} atualizada: paid=${newPaid}, status=${isFullyPaid ? 'paid' : 'partial'}`);
}

module.exports = router;

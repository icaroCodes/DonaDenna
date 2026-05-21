// ============================================================================
// /orders — pedidos do e-commerce (exige shopperAuth).
//
// POST /orders          cria pedido (status='pending', channel='online')
// GET  /orders          lista pedidos do shopper logado
// GET  /orders/:id      detalhe (apenas se for do shopper)
//
// Reutiliza saleEngine.js — mesma lógica de POS. Adiciona sale_deliveries.
// ============================================================================

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const { createSaleEngine } = require('../lib/saleEngine');
const mp = require('../lib/mercadoPago');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const engine = createSaleEngine(supabase);

const ORDER_SELECT =
  '*, sale_items(*, product_variants(image_url, color_image_url)), ' +
  'sale_payments(*), sale_deliveries(*)';

// ─── Criar pedido ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    items, payment_method, delivery, notes,
  } = req.body || {};

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Adicione pelo menos um produto.' });
  }
  if (!payment_method) {
    return res.status(400).json({ error: 'Selecione um método de pagamento.' });
  }
  if (!delivery || !['pickup','shipping'].includes(delivery.mode)) {
    return res.status(400).json({ error: 'Informe uma forma de entrega.' });
  }
  if (delivery.mode === 'shipping' && !delivery.address_id && !delivery.cep) {
    return res.status(400).json({ error: 'Informe o endereço de entrega.' });
  }

  try {
    // 1) cria a venda (status pending, online, paid_amount 0)
    const sale = await engine.commitSale({
      customer_id: req.customer.id,
      customer_name: req.customer.name,
      payment_method,
      items: items.map((it) => ({ variant_id: it.variant_id, quantity: it.quantity })),
      paid_amount: 0,
      notes,
      channel: 'online',
      status_override: 'pending',
    });

    // 2) snapshot do endereço para sale_deliveries
    let addrSnapshot = {};
    if (delivery.mode === 'shipping') {
      if (delivery.address_id) {
        const { data: addr } = await supabase
          .from('shopper_addresses')
          .select('*')
          .eq('id', delivery.address_id)
          .eq('customer_id', req.customer.id)
          .maybeSingle();
        if (!addr) return res.status(400).json({ error: 'Endereço inválido.' });
        addrSnapshot = {
          address_id: addr.id,
          recipient: addr.recipient,
          cep: addr.cep,
          street: addr.street,
          number: addr.number,
          complement: addr.complement,
          district: addr.district,
          city: addr.city,
          state: addr.state,
          phone: addr.phone,
        };
      } else {
        addrSnapshot = {
          recipient: delivery.recipient || req.customer.name,
          cep: delivery.cep,
          street: delivery.street,
          number: delivery.number,
          complement: delivery.complement,
          district: delivery.district,
          city: delivery.city,
          state: delivery.state,
          phone: delivery.phone,
        };
      }
    }

    await supabase.from('sale_deliveries').insert({
      sale_id: sale.id,
      mode: delivery.mode,
      provider: delivery.provider || (delivery.mode === 'pickup' ? 'pickup' : null),
      service: delivery.service || null,
      amount: Number(delivery.amount || 0),
      eta_min_days: delivery.eta_min_days ?? null,
      eta_max_days: delivery.eta_max_days ?? null,
      status: delivery.mode === 'pickup' ? 'pending' : 'pending',
      ...addrSnapshot,
    });

    const { data: full } = await supabase
      .from('sales')
      .select(ORDER_SELECT)
      .eq('id', sale.id)
      .single();

    res.status(201).json(full);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── Meus pedidos ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('sales')
    .select(ORDER_SELECT)
    .eq('customer_id', req.customer.id)
    .eq('channel', 'online')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── Iniciar pagamento (Mercado Pago Checkout Pro) ───────────────────────────
// Cria uma preferência no MP a partir do pedido pendente e devolve a URL
// init_point pra qual o frontend redireciona. Pedido deve estar 'pending' e
// pertencer ao shopper logado.
router.post('/:id/pay', async (req, res) => {
  try {
    const { data: sale, error } = await supabase
      .from('sales')
      .select('id, customer_id, total_amount, paid_amount, status, sale_items(*), sale_deliveries(*)')
      .eq('id', req.params.id)
      .eq('customer_id', req.customer.id)
      .eq('channel', 'online')
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!sale) return res.status(404).json({ error: 'Pedido não encontrado.' });
    if (sale.status === 'paid') return res.status(400).json({ error: 'Pedido já está pago.' });

    const items = (sale.sale_items || []).map((it) => ({
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_label: it.variant_label,
      quantity: it.quantity,
      unit_price: it.unit_price,
    }));
    const delivery = (sale.sale_deliveries || [])[0] || null;
    const shipping = delivery && Number(delivery.amount) > 0
      ? { amount: Number(delivery.amount), service: delivery.service }
      : null;

    const frontUrl = process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || '';
    // FRONTEND_URL pode ter múltiplas origens separadas por vírgula — pega a primeira.
    const frontBase = String(frontUrl).split(',')[0].trim().replace(/\/+$/, '');
    const backBase = (process.env.PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');

    if (!frontBase) {
      return res.status(500).json({ error: 'PUBLIC_FRONTEND_URL não configurado no backend.' });
    }
    if (!backBase) {
      return res.status(500).json({ error: 'PUBLIC_BACKEND_URL não configurado no backend (necessário pro webhook).' });
    }

    const payer = {
      name: req.customer.name || undefined,
      email: req.customer.email || req.user?.email || undefined,
      ...(req.customer.cpf
        ? { identification: { type: 'CPF', number: String(req.customer.cpf).replace(/\D/g, '') } }
        : {}),
    };

    const preference = await mp.createPreference({
      sale,
      items,
      shipping,
      payer,
      backUrls: {
        success: `${frontBase}/pedido/${sale.id}?payment=success`,
        pending: `${frontBase}/pedido/${sale.id}?payment=pending`,
        failure: `${frontBase}/pedido/${sale.id}?payment=failure`,
      },
      notificationUrl: `${backBase}/webhooks/mercadopago`,
      externalReference: sale.id,
    });

    // OBS: não guardamos preference_id no banco (precisaria migration).
    // O webhook usa `external_reference` (= sale.id) pra mapear de volta.
    res.json({
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message, details: err.details });
  }
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('sales')
    .select(ORDER_SELECT)
    .eq('id', req.params.id)
    .eq('customer_id', req.customer.id)
    .eq('channel', 'online')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Pedido não encontrado.' });
  res.json(data);
});

module.exports = router;

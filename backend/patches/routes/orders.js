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

// ============================================================================
// /shopper — perfil, endereços, favoritos (exige shopperAuth).
// ============================================================================

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Eu (perfil shopper) ─────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email },
    customer: req.customer,
  });
});

router.put('/me', async (req, res) => {
  const { name, phone, cpf } = req.body || {};
  const update = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (cpf !== undefined) update.cpf = cpf;
  if (!Object.keys(update).length) return res.json(req.customer);
  const { data, error } = await supabase
    .from('customers')
    .update(update)
    .eq('id', req.customer.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── Endereços ───────────────────────────────────────────────────────────────
router.get('/addresses', async (req, res) => {
  const { data, error } = await supabase
    .from('shopper_addresses')
    .select('*')
    .eq('customer_id', req.customer.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/addresses', async (req, res) => {
  const body = req.body || {};
  const required = ['recipient', 'cep', 'street', 'number', 'district', 'city', 'state'];
  for (const f of required) {
    if (!body[f]) return res.status(400).json({ error: `Campo obrigatório: ${f}` });
  }
  if (body.is_default) {
    await supabase.from('shopper_addresses')
      .update({ is_default: false })
      .eq('customer_id', req.customer.id);
  }
  const { data, error } = await supabase
    .from('shopper_addresses')
    .insert({
      customer_id: req.customer.id,
      label: body.label || null,
      recipient: body.recipient,
      cep: body.cep,
      street: body.street,
      number: body.number,
      complement: body.complement || null,
      district: body.district,
      city: body.city,
      state: body.state,
      phone: body.phone || null,
      is_default: !!body.is_default,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/addresses/:id', async (req, res) => {
  const body = req.body || {};
  if (body.is_default) {
    await supabase.from('shopper_addresses')
      .update({ is_default: false })
      .eq('customer_id', req.customer.id);
  }
  const update = {};
  ['label','recipient','cep','street','number','complement','district','city','state','phone','is_default']
    .forEach((f) => { if (body[f] !== undefined) update[f] = body[f]; });
  const { data, error } = await supabase
    .from('shopper_addresses')
    .update(update)
    .eq('id', req.params.id)
    .eq('customer_id', req.customer.id)
    .select()
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Endereço não encontrado.' });
  res.json(data);
});

router.delete('/addresses/:id', async (req, res) => {
  const { error } = await supabase
    .from('shopper_addresses')
    .delete()
    .eq('id', req.params.id)
    .eq('customer_id', req.customer.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// ─── Favoritos ───────────────────────────────────────────────────────────────
router.get('/favorites', async (req, res) => {
  const { data, error } = await supabase
    .from('shopper_favorites')
    .select('id, product_id, created_at, products(id, name, sale_price, product_variants(image_url, color_image_url, stock))')
    .eq('customer_id', req.customer.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/favorites', async (req, res) => {
  const { product_id } = req.body || {};
  if (!product_id) return res.status(400).json({ error: 'product_id é obrigatório.' });
  const { data, error } = await supabase
    .from('shopper_favorites')
    .upsert({ customer_id: req.customer.id, product_id }, { onConflict: 'customer_id,product_id' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/favorites/:productId', async (req, res) => {
  const { error } = await supabase
    .from('shopper_favorites')
    .delete()
    .eq('customer_id', req.customer.id)
    .eq('product_id', req.params.productId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;

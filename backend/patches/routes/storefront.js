// ============================================================================
// /storefront — rotas PÚBLICAS (sem auth) para o e-commerce.
//
// Catálogo, busca, categorias, destaque, cotação de frete.
// Sanitiza dados sensíveis (cost_price, cost_override) antes de devolver.
// ============================================================================

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const { PRODUCT_CATEGORIES } = require('../lib/categories');
const shipping = require('../lib/shipping');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PRODUCT_SELECT =
  'id, name, description, category, category_slug, subcategory_slug, ' +
  'sale_price, stock, sizes, created_at, ' +
  'product_variants(id, product_id, label, size, color, color_hex, stock, ' +
  '  price_override, image_url, color_image_url, ' +
  '  variant_images(id, image_url, color, color_hex, display_order, is_primary))';

function sanitizeVariant(v) {
  if (!v) return v;
  const { cost_override, ...rest } = v;
  return rest;
}
function sanitizeProduct(p) {
  if (!p) return p;
  const { cost_price, ...rest } = p;
  return {
    ...rest,
    product_variants: (rest.product_variants || []).map(sanitizeVariant),
  };
}

// ─── Categorias (estáticas, vindas do ERP) ───────────────────────────────────
router.get('/categories', (_req, res) => {
  res.json(PRODUCT_CATEGORIES);
});

// ─── Listagem de produtos com filtros ────────────────────────────────────────
router.get('/products', async (req, res) => {
  const {
    category, search, min_price, max_price, sort = 'recent',
    page = '1', limit = '24', include_out_of_stock,
  } = req.query;

  let query = supabase.from('products').select(PRODUCT_SELECT);

  if (category) query = query.eq('category_slug', category);
  if (min_price) query = query.gte('sale_price', Number(min_price));
  if (max_price) query = query.lte('sale_price', Number(max_price));
  if (search) query = query.ilike('name', `%${search}%`);

  switch (sort) {
    case 'price_asc':  query = query.order('sale_price', { ascending: true });  break;
    case 'price_desc': query = query.order('sale_price', { ascending: false }); break;
    case 'name':       query = query.order('name', { ascending: true });        break;
    default:           query = query.order('created_at', { ascending: false });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(60, Math.max(1, parseInt(limit, 10) || 24));
  const from = (pageNum - 1) * lim;
  const to = from + lim - 1;
  query = query.range(from, to);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  let products = (data || []).map(sanitizeProduct);
  if (!include_out_of_stock) {
    products = products.filter((p) =>
      (p.product_variants || []).some((v) => Number(v.stock) > 0)
    );
  }
  res.json({ products, page: pageNum, limit: lim });
});

// ─── Destaques (mais recentes + com estoque) ─────────────────────────────────
router.get('/featured', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) return res.status(500).json({ error: error.message });
  const products = (data || []).map(sanitizeProduct)
    .filter((p) => (p.product_variants || []).some((v) => Number(v.stock) > 0));
  res.json({ products });
});

// ─── Mais vendidos (deriva de sale_items agregando quantidade) ───────────────
router.get('/bestsellers', async (_req, res) => {
  const { data: items } = await supabase
    .from('sale_items')
    .select('product_id, quantity')
    .not('product_id', 'is', null);
  const tally = new Map();
  (items || []).forEach((it) => {
    tally.set(it.product_id, (tally.get(it.product_id) || 0) + Number(it.quantity || 0));
  });
  const topIds = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id]) => id);
  if (topIds.length === 0) return res.json({ products: [] });

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', topIds);
  if (error) return res.status(500).json({ error: error.message });

  const order = new Map(topIds.map((id, i) => [id, i]));
  const products = (data || [])
    .map(sanitizeProduct)
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  res.json({ products });
});

// ─── Detalhe de produto ──────────────────────────────────────────────────────
router.get('/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.json(sanitizeProduct(data));
});

// ─── Busca rápida / autocomplete ─────────────────────────────────────────────
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ products: [] });
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(10);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: (data || []).map(sanitizeProduct) });
});

// ─── Cotação de frete ────────────────────────────────────────────────────────
router.post('/shipping/quote', async (req, res) => {
  const { destination_cep, items } = req.body || {};
  if (!destination_cep) return res.status(400).json({ error: 'CEP é obrigatório.' });
  try {
    const result = await shipping.quote({ destination_cep, items });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Endereço da loja (útil para a UI mostrar) ───────────────────────────────
router.get('/store', (_req, res) => {
  res.json({ origin: shipping.STORE_ORIGIN });
});

module.exports = router;

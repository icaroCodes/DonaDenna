// ============================================================================
// saleEngine.js — núcleo de criação de vendas (POS e online compartilham).
//
// Extraído de routes/sales.js. Tanto /sales (admin/POS) quanto /orders
// (e-commerce) devem usar este módulo para evitar lógica paralela de estoque
// e financeiro.
//
// Mantém EXATAMENTE o mesmo comportamento de sales.js:
//   - valida estoque por variação
//   - cria sale + sale_items
//   - decrementa product_variants.stock
//   - insere stock_movements (reason='venda')
//   - recalcula products.stock
//   - insere financial_transactions quando paid_amount > 0
//
// API:
//   const engine = createSaleEngine(supabase);
//   await engine.commitSale({
//     customer_id, customer_name, sale_date, payment_method,
//     items: [{ variant_id, quantity, unit_price? }],
//     paid_amount, notes, discount_type, discount_value, cash_received_amount,
//     channel: 'pos' | 'online',
//     status_override?: 'paid'|'partial'|'pending',   // opcional p/ online (pending)
//   });
// ============================================================================

function money(value) {
  return Math.max(0, Math.round((Number(value) || 0) * 100) / 100);
}

function applyDiscount(subtotal, type, value) {
  const normalizedType = type === 'percent' || type === 'value' ? type : 'none';
  const numericValue = Math.max(0, Number(value) || 0);
  let discount = 0;
  if (normalizedType === 'percent') discount = (subtotal * Math.min(numericValue, 100)) / 100;
  if (normalizedType === 'value') discount = Math.min(numericValue, subtotal);
  return {
    discountType: normalizedType,
    discountValue: numericValue,
    discountAmount: money(Math.min(discount, subtotal)),
    total: money(subtotal - Math.min(discount, subtotal)),
  };
}

function createSaleEngine(supabase) {
  async function validateAndResolveItems(items) {
    let totalAmount = 0;
    let totalCost = 0;
    const resolved = [];

    for (const item of items) {
      const { data: variant, error: vErr } = await supabase
        .from('product_variants')
        .select('*, products(name, cost_price, sale_price)')
        .eq('id', item.variant_id)
        .single();
      if (vErr || !variant) {
        const err = new Error(`Variação não encontrada: ${item.variant_id}`);
        err.statusCode = 400;
        throw err;
      }
      if (variant.stock < item.quantity) {
        const err = new Error(
          `Estoque insuficiente para "${variant.products.name} (${variant.label})": ` +
          `disponível ${variant.stock}, solicitado ${item.quantity}`
        );
        err.statusCode = 400;
        throw err;
      }

      const unitPrice = item.unit_price || variant.price_override || variant.products.sale_price;
      const unitCost = variant.cost_override || variant.products.cost_price || 0;
      const subtotal = unitPrice * item.quantity;
      const itemCost = unitCost * item.quantity;

      totalAmount += subtotal;
      totalCost += itemCost;

      resolved.push({
        variant_id: variant.id,
        product_id: variant.product_id,
        product_name: variant.products.name,
        variant_label: variant.label,
        quantity: item.quantity,
        unit_cost: unitCost,
        unit_price: unitPrice,
        subtotal,
        current_stock: variant.stock,
      });
    }

    return { resolved, totalAmount: money(totalAmount), totalCost };
  }

  async function commitSale(payload) {
    const {
      customer_id, customer_name, sale_date, payment_method, items,
      paid_amount, notes, discount_type, discount_value, cash_received_amount,
      channel = 'pos',
      status_override,
    } = payload;

    if (!items || items.length === 0) {
      const err = new Error('Adicione pelo menos um produto'); err.statusCode = 400; throw err;
    }
    if (!payment_method) {
      const err = new Error('Método de pagamento é obrigatório'); err.statusCode = 400; throw err;
    }

    const { resolved, totalAmount, totalCost } = await validateAndResolveItems(items);
    const pricing = applyDiscount(totalAmount, discount_type, discount_value);
    const finalAmount = pricing.total;
    const cashReceived = cash_received_amount !== undefined ? money(cash_received_amount) : null;
    const changeAmount = payment_method === 'dinheiro' && cashReceived !== null
      ? money(Math.max(0, cashReceived - finalAmount)) : 0;
    const paidInput = paid_amount !== undefined ? Number(paid_amount) : finalAmount;
    const paidNow = money(Math.min(paidInput, finalAmount));
    const remaining = money(finalAmount - paidNow);

    let status = 'paid';
    if (remaining > 0 && paidNow > 0) status = 'partial';
    if (paidNow === 0) status = 'pending';
    if (status_override) status = status_override;

    const saleDate = sale_date || new Date().toISOString().split('T')[0];

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        customer_id: customer_id || null,
        customer_name: customer_name || 'Cliente avulso',
        sale_date: saleDate,
        payment_method,
        subtotal_amount: totalAmount,
        discount_type: pricing.discountType,
        discount_value: pricing.discountValue,
        discount_amount: pricing.discountAmount,
        total_amount: finalAmount,
        total_cost: totalCost,
        paid_amount: paidNow,
        remaining_amount: remaining,
        cash_received_amount: cashReceived,
        change_amount: changeAmount,
        channel,
        status,
        notes,
      })
      .select()
      .single();
    if (saleError) { const err = new Error(saleError.message); err.statusCode = 500; throw err; }

    const saleItemRows = resolved.map((it) => ({
      sale_id: sale.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_label: it.variant_label,
      quantity: it.quantity,
      unit_cost: it.unit_cost,
      unit_price: it.unit_price,
      subtotal: it.subtotal,
    }));
    const { error: itemsError } = await supabase.from('sale_items').insert(saleItemRows);
    if (itemsError) { const err = new Error(itemsError.message); err.statusCode = 500; throw err; }

    for (const it of resolved) {
      const newStock = it.current_stock - it.quantity;
      await supabase.from('product_variants').update({ stock: newStock }).eq('id', it.variant_id);

      await supabase.from('stock_movements').insert({
        variant_id: it.variant_id,
        product_id: it.product_id,
        type: 'saida',
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        total_cost: it.unit_cost * it.quantity,
        reason: 'venda',
        reference_id: sale.id,
        notes: `Venda #${sale.id.slice(0, 8)}${channel === 'online' ? ' (online)' : ''}`,
      });

      const { data: allVariants } = await supabase
        .from('product_variants').select('stock').eq('product_id', it.product_id);
      const prodStock = (allVariants || []).reduce((s, v) => s + (Number(v.stock) || 0), 0);
      await supabase.from('products').update({ stock: prodStock }).eq('id', it.product_id);
    }

    if (paidNow > 0) {
      await supabase.from('financial_transactions').insert({
        type: 'entrada',
        amount: paidNow,
        description: `Venda ${channel === 'online' ? 'online' : ''} para ${customer_name || 'Cliente avulso'} ` +
                     `(${payment_method.toUpperCase()}${changeAmount > 0 ? `, troco R$${changeAmount.toFixed(2)}` : ''})`,
        origin: 'venda',
        reference_id: sale.id,
        date: saleDate,
      });
    }

    return sale;
  }

  return { validateAndResolveItems, commitSale, money, applyDiscount };
}

module.exports = { createSaleEngine, money, applyDiscount };

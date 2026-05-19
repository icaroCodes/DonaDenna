// Entrega local rápida (Fortaleza e região).
//
// MVP: retorna uma cotação mock estilo Uber Flash / 99Entrega.
// Substituir por integração real (Uber Direct, Lalamove, 99Entrega) trocando
// apenas o conteúdo desta função. A interface permanece igual.
//
// Variáveis de ambiente opcionais:
//   LOCAL_DELIVERY_BASE_FEE  (default 12.90)
//   LOCAL_DELIVERY_PER_ITEM  (default 0.00)

module.exports = {
  name: 'local',
  async quote({ items }) {
    const base = Number(process.env.LOCAL_DELIVERY_BASE_FEE || 12.9);
    const perItem = Number(process.env.LOCAL_DELIVERY_PER_ITEM || 0);
    const qty = (items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const amount = Math.round((base + perItem * qty) * 100) / 100;

    return {
      provider: 'local',
      service: 'Entrega rápida (Fortaleza)',
      mode: 'shipping',
      amount,
      eta_min_days: 0,
      eta_max_days: 1,
      notes: 'Entrega no mesmo dia ou no próximo, por motoboy/parceiro urbano.',
    };
  },
};

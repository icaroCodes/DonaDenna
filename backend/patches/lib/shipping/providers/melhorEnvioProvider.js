// Melhor Envio — multi-transportadora. MVP mockado.
//
// Integração real: usar a API do Melhor Envio (token OAuth) e mapear cada
// serviço retornado para o formato ShippingOption. Manter este arquivo como
// único ponto de mudança.

module.exports = {
  name: 'melhor_envio',
  async quote({ destination, items }) {
    if (!destination?.cep) return [];
    const qty = (items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const jadlogBase = Number(process.env.ME_JADLOG_BASE || 27.5);
    const azulBase   = Number(process.env.ME_AZUL_BASE || 34.9);
    const perItem    = Number(process.env.ME_PER_ITEM || 1.2);

    return [
      {
        provider: 'melhor_envio',
        service: 'Jadlog Package',
        mode: 'shipping',
        amount: Math.round((jadlogBase + perItem * qty) * 100) / 100,
        eta_min_days: 4,
        eta_max_days: 8,
      },
      {
        provider: 'melhor_envio',
        service: 'Azul Cargo',
        mode: 'shipping',
        amount: Math.round((azulBase + perItem * qty) * 100) / 100,
        eta_min_days: 3,
        eta_max_days: 6,
      },
    ];
  },
};

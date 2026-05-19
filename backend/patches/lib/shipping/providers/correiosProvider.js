// Correios — PAC e SEDEX. MVP mockado, pronto para integração real.
//
// Para conectar com a API real dos Correios (ou Melhor Envio fazendo proxy),
// substitua o conteúdo de quote() mantendo o mesmo formato de saída.

module.exports = {
  name: 'correios',
  async quote({ destination, items }) {
    if (!destination?.cep) return [];
    const qty = (items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const pacBase = Number(process.env.CORREIOS_PAC_BASE || 24.9);
    const sedexBase = Number(process.env.CORREIOS_SEDEX_BASE || 39.9);
    const perItem = Number(process.env.CORREIOS_PER_ITEM || 1.5);

    return [
      {
        provider: 'correios',
        service: 'PAC',
        mode: 'shipping',
        amount: Math.round((pacBase + perItem * qty) * 100) / 100,
        eta_min_days: 5,
        eta_max_days: 9,
      },
      {
        provider: 'correios',
        service: 'SEDEX',
        mode: 'shipping',
        amount: Math.round((sedexBase + perItem * qty) * 100) / 100,
        eta_min_days: 2,
        eta_max_days: 4,
      },
    ];
  },
};

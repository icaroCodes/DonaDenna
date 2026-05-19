// Retirada na loja — sempre disponível, frete zero.
module.exports = {
  name: 'pickup',
  async quote(/* ctx */) {
    return {
      provider: 'pickup',
      service: 'Retirar na loja',
      mode: 'pickup',
      amount: 0,
      eta_min_days: 0,
      eta_max_days: 1,
      notes: 'Bom Jardim · Fortaleza/CE — disponível em até 24h após confirmação.',
    };
  },
};

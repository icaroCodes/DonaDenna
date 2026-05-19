// ============================================================================
// shipping/index.js — registry de providers de frete.
//
// quote({ destination_cep, items }) → { options, local_eligible }
//   options: ShippingOption[]
//   ShippingOption = {
//     provider, service, mode, amount, eta_min_days, eta_max_days, notes?
//   }
//
// No MVP os providers retornam valores mockados (ajustáveis via env vars).
// Substituir o arquivo do provider por integração real depois.
// ============================================================================

const { STORE_ORIGIN } = require('./origin');
const { isLocalCep } = require('./coverage');
const pickupProvider       = require('./providers/pickupProvider');
const localProvider        = require('./providers/localProvider');
const correiosProvider     = require('./providers/correiosProvider');
const melhorEnvioProvider  = require('./providers/melhorEnvioProvider');

async function quote({ destination_cep, items, customerId }) {
  const cep = String(destination_cep || '').replace(/\D/g, '');
  const local = isLocalCep(cep);

  const ctx = {
    origin: STORE_ORIGIN,
    destination: { cep },
    items: items || [],
    customerId,
  };

  const providers = local
    ? [pickupProvider, localProvider, correiosProvider, melhorEnvioProvider]
    : [pickupProvider, correiosProvider, melhorEnvioProvider];

  const results = await Promise.all(providers.map(async (p) => {
    try { return await p.quote(ctx); }
    catch (err) {
      console.warn(`[shipping] provider ${p.name || ''} falhou:`, err.message);
      return null;
    }
  }));

  const options = results.flat().filter(Boolean);
  return { options, local_eligible: local, origin: STORE_ORIGIN };
}

module.exports = { quote, STORE_ORIGIN };

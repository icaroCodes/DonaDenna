// Define se um CEP de destino se enquadra como "entrega local rápida".
//
// Heurística MVP: faixas de CEP de Fortaleza e parte da Região Metropolitana
// (60000-000 a 61999-999). Inclui Fortaleza, Caucaia, Maracanaú, Eusébio,
// Aquiraz, Maranguape, Pacatuba e adjacências.
//
// Pode ser substituído por uma API real (Google Distance Matrix, ViaCEP +
// geofence custom etc.) sem alterar a interface.

function normalizeCep(cep) {
  return String(cep || '').replace(/\D/g, '').padStart(8, '0');
}

function isLocalCep(cep) {
  const n = normalizeCep(cep);
  if (n.length !== 8) return false;
  const prefix = parseInt(n.slice(0, 5), 10);
  if (Number.isNaN(prefix)) return false;
  return prefix >= 60000 && prefix <= 61999;
}

module.exports = { isLocalCep, normalizeCep };

// Espelho server-side das categorias (igual ao frontend/src/lib/categories.ts).
// Manter sincronizado manualmente — única lista de categorias do sistema.
const PRODUCT_CATEGORIES = [
  { slug: 'conjunto',   name: 'Conjunto' },
  { slug: 'blusa',      name: 'Blusa' },
  { slug: 'tshirt',     name: 'Tshirt' },
  { slug: 'cropped',    name: 'Cropped' },
  { slug: 'macaquinho', name: 'Macaquinho' },
  { slug: 'calca',      name: 'Calça' },
  { slug: 'body',       name: 'Body' },
  { slug: 'short',      name: 'Short' },
  { slug: 'short_tlf',  name: 'Short TLF' },
  {
    slug: 'acessorio',
    name: 'Acessório',
    subcategories: [
      { slug: 'bone',     name: 'Boné' },
      { slug: 'bolsa',    name: 'Bolsa' },
      { slug: 'brinco',   name: 'Brinco' },
      { slug: 'joia',     name: 'Joia' },
      { slug: 'colar',    name: 'Colar' },
      { slug: 'anel',     name: 'Anel' },
      { slug: 'pulseira', name: 'Pulseira' },
      { slug: 'oculos',   name: 'Óculos' },
      { slug: 'cinto',    name: 'Cinto' },
      { slug: 'outro',    name: 'Outro' },
    ],
  },
];

module.exports = { PRODUCT_CATEGORIES };

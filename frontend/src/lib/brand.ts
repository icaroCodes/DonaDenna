// Informações oficiais da marca DonaDenna — single source of truth.
// Trocou algo? Atualize aqui e propaga pra todo o site.

export const BRAND = {
  name: 'DonaDenna',
  tagline: 'Moda autoral · Fortaleza',
  founded: 2009, // 15+ anos no mercado
  yearsInMarket: 15,
  instagramFollowers: '10 mil',

  address: {
    street: 'Rua Martins de Carvalho',
    number: '3885',
    district: 'Bom Jardim',
    city: 'Fortaleza',
    state: 'CE',
    cep: '60540-184',
    full: 'Rua Martins de Carvalho, 3885 · Bom Jardim · Fortaleza/CE · CEP 60540-184',
  },

  whatsapp: {
    raw: '+55 85 9257-7759',
    display: '(85) 9257-7759',
    e164: '558592577759',
    link: 'https://wa.me/558592577759',
    linkWithMessage: 'https://wa.me/558592577759?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20DonaDenna%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.',
  },

  instagram: {
    handle: '@donadenna',
    url: 'https://www.instagram.com/donadenna/',
  },

  hours: [
    { day: 'Segunda a sexta', value: '15h às 19h', online: true },
    { day: 'Sábado',          value: '9h às 20h',  online: true },
    { day: 'Domingo',         value: 'Fechado',    online: true },
  ],
  hoursNote: 'Atendimento online via WhatsApp em qualquer horário.',

  about: {
    short:
      'Há mais de 15 anos vestindo mulheres em todo o Brasil. Loja confiável, atendimento humanizado e peças autorais que cabem na sua história.',
    medium:
      'A DonaDenna é uma loja de moda feminina com mais de 15 anos de história — construída em Fortaleza, conhecida em todo o Brasil. Atendemos pessoalmente no Bom Jardim e enviamos pedidos para todas as regiões, com a mesma dedicação dos primeiros dias.',
    paragraphs: [
      'A DonaDenna é uma loja de moda feminina reconhecida pela confiança, qualidade e credibilidade construídas ao longo de mais de 15 anos no mercado. Uma trajetória sólida, centenas de clientes satisfeitas e o compromisso de oferecer peças modernas, elegantes e acessíveis para mulheres de todo o país.',
      'Atuamos tanto na loja física quanto no digital: enviamos pedidos para todo o Brasil e mantemos uma comunidade ativa no Instagram, com quase 10 mil seguidoras que acompanham lançamentos, looks e bastidores do atelier.',
      'Estamos localizadas em Bom Jardim, em Fortaleza — onde recebemos clientes pessoalmente e seguimos crescendo no mercado da moda feminina com dedicação, atendimento de verdade e carinho em cada detalhe.',
    ],
  },

  reasonsToBuy: [
    'Mais de 15 anos de experiência no mercado',
    'Loja confiável e reconhecida por centenas de clientes',
    'Entregas para todo o Brasil',
    'Peças femininas modernas, elegantes e acessíveis',
    'Atendimento humanizado e suporte de verdade',
    'Quase 10 mil seguidoras no Instagram',
    'Compromisso com qualidade, confiança e credibilidade',
  ],
} as const

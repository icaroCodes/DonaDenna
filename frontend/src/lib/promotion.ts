import type { Product } from '@/types/catalog'

export interface PromotionStatus {
  isActive: boolean
  percentage: number
  originalPrice: number
  promotionalPrice: number
  savings: number
  endDate: string | null
  isEndingSoon: boolean
}

export function getPromotionStatus(product: Product): PromotionStatus {
  const defaultStatus: PromotionStatus = {
    isActive: false,
    percentage: 0,
    originalPrice: product.sale_price,
    promotionalPrice: product.sale_price,
    savings: 0,
    endDate: null,
    isEndingSoon: false,
  }

  if (!product.promo_active) return defaultStatus

  const now = new Date()

  // Verify dates if not indefinite
  if (!product.promo_indefinite) {
    if (product.promo_start_date) {
      const startDate = new Date(product.promo_start_date)
      if (now < startDate) return defaultStatus
    }
    if (product.promo_end_date) {
      const endDate = new Date(product.promo_end_date)
      if (now > endDate) return defaultStatus
    }
  }

  let promoPrice = product.sale_price
  let percentage = 0

  if (product.promo_type === 'percentage') {
    percentage = product.promo_percentage || 0
    if (percentage > 0) {
      promoPrice = product.sale_price * (1 - percentage / 100)
    }
  } else if (product.promo_type === 'fixed_price') {
    promoPrice = product.promo_price || product.sale_price
    if (promoPrice < product.sale_price) {
      percentage = Math.round(((product.sale_price - promoPrice) / product.sale_price) * 100)
    }
  }

  // Double check if there's actually a discount
  if (promoPrice >= product.sale_price) return defaultStatus

  const savings = product.sale_price - promoPrice
  
  let isEndingSoon = false
  if (!product.promo_indefinite && product.promo_end_date) {
    const endDate = new Date(product.promo_end_date)
    const hoursLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    isEndingSoon = hoursLeft > 0 && hoursLeft <= 48 // 48h to show "Ending Soon" urgency
  }

  return {
    isActive: true,
    percentage,
    originalPrice: product.sale_price,
    promotionalPrice: promoPrice,
    savings,
    endDate: product.promo_indefinite ? null : product.promo_end_date || null,
    isEndingSoon,
  }
}

// ─── PIX-only discount ───────────────────────────────────────────────────────
//
// Calcula o desconto PIX sobre um preço base (que pode já estar com promo
// geral aplicada). Retorna o desconto somente se as janelas estiverem ativas.
export interface PixDiscount {
  isActive: boolean
  percentage: number      // arredondado para exibição
  basePrice: number       // preço antes do PIX
  pixPrice: number        // preço final com PIX
  savings: number
}

export function getPixDiscount(product: Product, basePrice?: number): PixDiscount {
  const base = basePrice != null ? basePrice : product.sale_price
  const inactive: PixDiscount = {
    isActive: false, percentage: 0, basePrice: base, pixPrice: base, savings: 0,
  }
  if (!product.pix_active) return inactive

  if (!product.pix_indefinite) {
    const now = new Date()
    if (product.pix_start_date && now < new Date(product.pix_start_date)) return inactive
    if (product.pix_end_date   && now > new Date(product.pix_end_date))   return inactive
  }

  let price = base
  let percentage = 0
  if (product.pix_type === 'fixed_price') {
    const fp = Number(product.pix_price || 0)
    if (fp > 0 && fp < base) {
      price = fp
      percentage = Math.round(((base - fp) / base) * 100)
    }
  } else {
    const pct = Number(product.pix_percentage || 0)
    if (pct > 0) {
      price = base * (1 - pct / 100)
      percentage = Math.round(pct)
    }
  }

  if (price >= base) return inactive
  return { isActive: true, percentage, basePrice: base, pixPrice: price, savings: base - price }
}

// ─── Headline (selo psicológico) ─────────────────────────────────────────────
//
// Junta o desconto da promo geral com o desconto exclusivo do PIX e devolve
// o "% de vitrine" — o maior desconto possível (pagando no PIX).
//
//   Ex.: vendedor coloca 15% off, PIX dá 5% sobre o preço promocional
//        → vitrine mostra ~20% OFF (arredondado de 15 + 5 sobre o já descontado)
//        Mas só PIX pega esse % cheio. Cartão/boleto = 15%.
//
// Use `paymentMethodPrice` quando o cliente não pagar PIX, e `bestPrice`
// quando pagar PIX. `totalPercent` é o número grande do selo.
export interface HeadlineDiscount {
  isActive: boolean
  totalPercent: number          // selo de vitrine (promo + PIX combinados)
  basePercent: number           // % válido para todas as formas (só promo)
  pixBoostPercent: number       // extra ganho ao pagar PIX
  originalPrice: number         // sale_price
  paymentMethodPrice: number    // preço pagando cartão/boleto/dinheiro
  bestPrice: number             // preço pagando PIX
  totalSavings: number          // original − bestPrice
  endDate: string | null        // a janela que termina antes (promo vs. pix)
  isEndingSoon: boolean         // últimas 48h
  isOpenEnded: boolean          // sem prazo definido
}

export function getHeadlineDiscount(product: Product): HeadlineDiscount {
  const promo = getPromotionStatus(product)
  const pix = getPixDiscount(product, product.sale_price) // % do PIX sobre o ORIGINAL
  const original = Number(product.sale_price || 0)

  const basePercent = promo.isActive ? Math.round(promo.percentage) : 0
  const pixBoostPercent = pix.isActive ? Math.round(pix.percentage) : 0

  // ✨ Aditivo: 20% promo + 5% PIX = 25% no selo.
  //    Bate com o backend (saleEngine) que aplica os dois off do original.
  const totalPercent = Math.min(100, basePercent + pixBoostPercent)

  // Preços derivados do mesmo % aditivo — sem composição.
  const paymentMethodPrice = basePercent > 0
    ? Math.max(0, original * (1 - basePercent / 100))
    : original
  const bestPrice = totalPercent > 0
    ? Math.max(0, original * (1 - totalPercent / 100))
    : original
  const totalSavings = Math.max(0, original - bestPrice)

  // Janela combinada: vence quem termina antes.
  const promoEnd = promo.endDate
  const pixEnd = (pix.isActive && !product.pix_indefinite) ? (product.pix_end_date || null) : null
  const endCandidates = [promoEnd, pixEnd].filter(Boolean) as string[]
  const endDate = endCandidates.length
    ? endCandidates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
    : null

  const isOpenEnded = totalPercent > 0 && !endDate
  const isEndingSoon = endDate
    ? (new Date(endDate).getTime() - Date.now()) / 36e5 <= 48
    : false

  return {
    isActive: totalPercent > 0,
    totalPercent, basePercent, pixBoostPercent,
    originalPrice: original, paymentMethodPrice, bestPrice,
    totalSavings, endDate, isEndingSoon, isOpenEnded,
  }
}

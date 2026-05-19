import { Flame, Zap, Clock } from 'lucide-react'
import { Countdown } from './Countdown'
import type { HeadlineDiscount } from '@/lib/promotion'

/**
 * Selo de vitrine com gatilho psicológico de urgência.
 *  - Mostra o desconto MÁXIMO possível (promo + PIX combinados).
 *  - Subtexto explica que esse % é pagando no PIX.
 *  - Quando há prazo: countdown ao vivo + estado "termina hoje!!!" nas últimas 48h.
 *  - Sem prazo: "Por tempo limitado".
 *
 * Tamanhos:
 *  - "sm" usado nos cards do catálogo
 *  - "lg" usado na página de produto
 */
export function HypeBadge({
  headline,
  size = 'sm',
  className = '',
}: {
  headline: HeadlineDiscount
  size?: 'sm' | 'lg'
  className?: string
}) {
  if (!headline.isActive || headline.totalPercent <= 0) return null

  const isUrgent = headline.isEndingSoon
  const hasBoost = headline.pixBoostPercent > 0

  if (size === 'lg') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold tracking-wide text-white shadow-sm
            ${isUrgent ? 'bg-red-600 animate-[pulse_1.6s_ease-in-out_infinite]' : 'bg-red-600'}`}
        >
          {isUrgent ? <Flame size={14} className="fill-current" /> : <Zap size={14} className="fill-current" />}
          <span>−{headline.totalPercent}% OFF</span>
          {hasBoost && (
            <span className="text-[11px] font-medium opacity-90 ml-1">no PIX</span>
          )}
        </div>
        <UrgencyLine headline={headline} />
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1.5 items-start ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-sm
          ${isUrgent ? 'bg-red-600 animate-[pulse_1.6s_ease-in-out_infinite]' : 'bg-red-600'}`}
      >
        {isUrgent ? <Flame size={10} className="fill-current" /> : null}
        −{headline.totalPercent}%
        {hasBoost && <span className="opacity-80 font-medium">PIX</span>}
      </span>
      <UrgencyLine headline={headline} compact />
    </div>
  )
}

function UrgencyLine({ headline, compact = false }: { headline: HeadlineDiscount; compact?: boolean }) {
  if (headline.endDate) {
    const base = compact
      ? 'bg-paper/95 text-red-600 px-2 py-0.5 rounded-md shadow-soft'
      : 'bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-100'
    return (
      <div className={base}>
        {headline.isEndingSoon ? (
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wide">
            <Flame size={11} className="fill-current animate-pulse" />
            <span>TERMINA EM</span>
            <Countdown endDate={headline.endDate} className="!text-[10.5px] !gap-0.5" />
            <span>!!!</span>
          </div>
        ) : (
          <Countdown endDate={headline.endDate} className="!text-[10.5px]" />
        )}
      </div>
    )
  }
  if (headline.isOpenEnded) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10.5px] font-medium tracking-wide
        ${compact ? 'bg-paper/95 text-red-600 px-2 py-0.5 rounded-md shadow-soft' : 'text-red-700'}`}>
        <Clock size={10} /> Por tempo limitado
      </span>
    )
  }
  return null
}

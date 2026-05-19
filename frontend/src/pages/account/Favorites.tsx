import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Loader2 } from 'lucide-react'
import { useFavorites } from '@/contexts/FavoritesContext'
import { getProduct } from '@/services/api'
import { formatMoney } from '@/lib/format'
import { primaryImage, totalStock } from '@/lib/product'
import { getHeadlineDiscount } from '@/lib/promotion'
import { HypeBadge } from '@/components/ui/HypeBadge'
import type { Product } from '@/types/catalog'

/**
 * A página usa exclusivamente os IDs do FavoritesContext como fonte da
 * verdade — o contexto já cuida da sincronia local↔servidor. Aqui só
 * hidratamos os produtos via `getProduct`, com timeout pra nunca travar.
 */
export default function FavoritesPage() {
  const { ids } = useFavorites()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    let cancelled = false
    setProducts(null); setErrored(false)

    const idList = [...ids]
    if (idList.length === 0) { setProducts([]); return }

    // Timeout duro pra evitar tela infinita de carregamento.
    const watchdog = setTimeout(() => {
      if (cancelled) return
      setProducts((p) => (p == null ? [] : p))
      setErrored(true)
    }, 8000)

    Promise.all(idList.map((id) =>
      getProduct(id).catch(() => null),
    )).then((results) => {
      if (cancelled) return
      clearTimeout(watchdog)
      setProducts(results.filter(Boolean) as Product[])
    })

    return () => { cancelled = true; clearTimeout(watchdog) }
  }, [ids])

  if (products === null) {
    return <div className="text-sm text-neutral-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
  }
  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-100 p-12 text-center">
        <Heart size={28} className="mx-auto text-neutral-300" />
        <p className="mt-4 text-[15px] font-medium">
          {errored ? 'Não foi possível carregar agora.' : 'Sua lista de favoritos está vazia'}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {errored ? 'Tente novamente em instantes.' : 'Toque no coração das peças que quiser guardar.'}
        </p>
        <Link to="/loja" className="btn-primary mt-6">Explorar a loja</Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
      {products.map((p) => (
        <FavoriteItem key={p.id} product={p} />
      ))}
    </div>
  )
}

function FavoriteItem({ product: p }: { product: Product }) {
  const { toggle } = useFavorites()
  const img = primaryImage(p) || p.product_variants?.find((v) => v.image_url || v.color_image_url)?.image_url
  const headline = getHeadlineDiscount(p)
  const soldout = totalStock(p) <= 0
  const hasDiscount = headline.isActive && headline.originalPrice > headline.paymentMethodPrice

  return (
    <div className="group relative">
      <Link to={`/produto/${p.id}`} className="block relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100">
        {img && <img src={img} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]" />}

        {soldout && (
          <span className="absolute top-2 left-2 chip bg-mocha-900/90 text-cream border-transparent">Esgotado</span>
        )}
        {!soldout && headline.isActive && (
          <HypeBadge headline={headline} size="sm" className="absolute top-2 left-2 z-10" />
        )}

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id) }}
          aria-label="Remover dos favoritos"
          className="absolute top-2 right-2 z-10 rounded-full bg-rose-500 text-paper p-2 shadow-soft active:scale-90 transition touch-manipulation"
        >
          <Heart size={14} className="fill-current" strokeWidth={0} />
        </button>
      </Link>

      <div className="mt-3">
        <Link to={`/produto/${p.id}`}>
          <p className="text-sm font-medium truncate text-mocha-900">{p.name}</p>
        </Link>
        <div className="mt-1 flex items-baseline gap-2 flex-wrap">
          {hasDiscount ? (
            <>
              <span className="text-[14px] font-semibold text-red-600 num">{formatMoney(headline.paymentMethodPrice)}</span>
              <span className="text-[11.5px] text-mocha-400 line-through num">{formatMoney(headline.originalPrice)}</span>
            </>
          ) : (
            <span className="text-[14px] font-medium text-mocha-900 num">{formatMoney(headline.paymentMethodPrice)}</span>
          )}
        </div>
        {headline.pixBoostPercent > 0 && (
          <div className="mt-0.5 text-[11.5px] text-emerald-700 num">
            {formatMoney(headline.bestPrice)} no <span className="font-semibold">PIX</span> <span className="text-emerald-600">(−{headline.pixBoostPercent}%)</span>
          </div>
        )}
      </div>
    </div>
  )
}

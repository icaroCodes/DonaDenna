import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, ShoppingBag, ChevronRight, ChevronLeft, Truck, Store, RefreshCw, Maximize2 } from 'lucide-react'
import { getProduct } from '@/services/api'
import type { Product, ProductVariant } from '@/types/catalog'
import { formatMoney } from '@/lib/format'
import {
  colorOptions, effectivePrice, findVariant, galleryImages, primaryImage, sizeOptions,
} from '@/lib/product'
import { useCart } from '@/contexts/CartContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useToast } from '@/contexts/ToastContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { getPromotionStatus, getHeadlineDiscount } from '@/lib/promotion'
import { HypeBadge } from '@/components/ui/HypeBadge'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const { add } = useCart()
  const { isFavorite, toggle: toggleFav } = useFavorites()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    setProduct(null)
    getProduct(id).then((p) => {
      setProduct(p)
      const colors = colorOptions(p)
      setColor(colors[0]?.color ?? null)
      setSize(null)
      setActiveImg(0)
    })
  }, [id])

  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!product) return null
    return findVariant(product, color, size) ||
           findVariant(product, color, null) ||
           product.product_variants?.[0] ||
           null
  }, [product, color, size])

  const gallery = useMemo(() => {
    if (!product) return []
    const g = galleryImages(product, selectedVariant)
    if (g.length) return g.map((i) => ({ id: i.id, url: i.image_url }))
    const single = primaryImage(product, selectedVariant)
    return single ? [{ id: 'single', url: single }] : []
  }, [product, selectedVariant])

  if (!product) return <ProductSkeleton />

  const colors = colorOptions(product)
  const sizes = sizeOptions(product, color)
  const basePrice = effectivePrice(product, selectedVariant)
  const promo = getPromotionStatus(product)
  const headline = product ? getHeadlineDiscount(product) : null
  const price = promo.isActive ? promo.promotionalPrice : basePrice
  const stock = selectedVariant?.stock ?? 0
  const inStock = stock > 0
  const needsSizeSelection = sizes.length > 0 && !size

  function handleAdd() {
    if (!product || !selectedVariant || !inStock) return
    if (needsSizeSelection) {
      showToast({
        type: 'error',
        title: 'Selecione um tamanho',
        description: 'Escolha o tamanho antes de adicionar à sacola.',
      })
      return
    }
    const img = gallery[activeImg]?.url || primaryImage(product, selectedVariant)
    add({
      variant_id: selectedVariant.id,
      product_id: product.id,
      product_name: product.name,
      variant_label: selectedVariant.label,
      size: selectedVariant.size,
      color: selectedVariant.color,
      color_hex: selectedVariant.color_hex,
      unit_price: price,
      image_url: img,
      quantity: qty,
      max_stock: stock,
      pix_active: product.pix_active,
      pix_type: product.pix_type,
      pix_percentage: product.pix_percentage,
      pix_price: product.pix_price,
    })
    showToast({
      type: 'success',
      title: product.name,
      description: 'Adicionado à sacola',
      image: img,
      action: {
        label: 'Ver sacola',
        onClick: () => navigate('/carrinho'),
      },
    })
  }

  return (
    <div className="container-page py-6 md:py-10">
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <Link to="/" className="hover:text-ink">Início</Link>
        <ChevronRight size={12} />
        <Link to="/loja" className="hover:text-ink">Loja</Link>
        <ChevronRight size={12} />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16">
        {/* Galeria */}
        <ProductGallery
          gallery={gallery}
          productName={product.name}
          activeImg={activeImg}
          setActiveImg={setActiveImg}
        />

        {/* Painel de compra */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="label-eyebrow">{product.category || 'DonaDenna'}</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tighter leading-[1.05]">{product.name}</h1>
          
          <div className="mt-4 flex flex-col items-start gap-2">
            {headline && headline.isActive && (
              <HypeBadge headline={headline} size="lg" />
            )}

            {headline && headline.originalPrice > headline.paymentMethodPrice && (
              <span className="text-lg text-neutral-400 line-through decoration-neutral-300">
                {formatMoney(headline.originalPrice)}
              </span>
            )}

            <p className={`text-3xl font-semibold tracking-tight ${promo.isActive ? 'text-red-600' : 'text-mocha-900'}`}>
              {formatMoney(price)}
              <span className="text-xs text-neutral-500 font-normal ml-2">no cartão/boleto</span>
            </p>

            {headline && headline.pixBoostPercent > 0 && (
              <div className="mt-1 flex items-baseline gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="text-[20px] font-bold text-emerald-700">{formatMoney(headline.bestPrice)}</span>
                <span className="text-[12px] font-semibold text-emerald-800 uppercase tracking-wider">no PIX</span>
                <span className="ml-1 text-[11px] font-bold text-white bg-emerald-600 rounded-md px-1.5 py-0.5">
                  −{headline.totalPercent}%
                </span>
              </div>
            )}

            {headline && headline.totalSavings > 0 && (
              <p className="text-[12px] text-mocha-500">
                Você economiza <span className="font-semibold text-emerald-700">{formatMoney(headline.totalSavings)}</span> pagando no PIX.
              </p>
            )}
          </div>

          {colors.length > 0 && (
            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <p className="label-eyebrow">Cor</p>
                {color && <p className="text-xs text-neutral-700">{color}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {colors.map((c) => {
                  const active = c.color === color
                  return (
                    <button
                      key={c.color}
                      onClick={() => { setColor(c.color); setSize(null); setActiveImg(0) }}
                      aria-label={c.color}
                      className={`relative h-10 w-10 rounded-full border-2 transition ${
                        active ? 'border-ink' : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                      style={{ backgroundColor: c.color_hex || '#EEE' }}
                    >
                      {!c.color_hex && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-600">
                          {c.color.slice(0, 2)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <p className="label-eyebrow">Tamanho</p>
                <button className="text-xs text-neutral-500 hover:text-ink underline-offset-4 hover:underline">Tabela de medidas</button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {sizes.map(({ size: s, variant }) => {
                  const active = s === size
                  const outOf = variant.stock <= 0
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      disabled={outOf}
                      className={`relative h-11 rounded-xl border text-sm font-medium transition ${
                        active ? 'border-ink bg-ink text-paper'
                        : outOf ? 'border-neutral-100 text-neutral-300 cursor-not-allowed line-through'
                        : 'border-neutral-200 hover:border-ink'
                      }`}
                    >{s}</button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-neutral-200">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 text-lg">−</button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(stock || 99, q + 1))} className="h-12 w-12 text-lg">+</button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className="btn-primary flex-1"
            >
              <ShoppingBag size={16} />
              {!inStock ? 'Esgotado' : needsSizeSelection ? 'Selecione o tamanho' : 'Adicionar à sacola'}
            </button>
            {(() => {
              const fav = product ? isFavorite(product.id) : false
              return (
                <button
                  type="button"
                  aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
                  aria-pressed={fav}
                  onClick={() => product && toggleFav(product.id)}
                  className={`rounded-full p-3.5 transition active:scale-90 touch-manipulation ${
                    fav ? 'bg-rose-500 text-white border border-rose-500' : 'border border-neutral-200 hover:border-ink'
                  }`}
                >
                  <Heart size={18} className={fav ? 'fill-current' : ''} strokeWidth={fav ? 0 : 2} />
                </button>
              )
            })()}
          </div>

          <ul className="mt-10 grid gap-3">
            <li className="flex items-start gap-3 text-sm text-neutral-700">
              <Truck size={16} className="mt-0.5 shrink-0" />
              <span>Entrega rápida em Fortaleza · frete nacional disponível</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-neutral-700">
              <Store size={16} className="mt-0.5 shrink-0" />
              <span>Retire grátis no atelier (Bom Jardim · Fortaleza)</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-neutral-700">
              <RefreshCw size={16} className="mt-0.5 shrink-0" />
              <span>Trocas em até 7 dias corridos</span>
            </li>
          </ul>

          {product.description && (
            <div className="mt-10 border-t border-neutral-100 pt-8">
              <p className="label-eyebrow mb-3">Detalhes</p>
              <p className="text-[15px] leading-relaxed text-neutral-700 whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 flex">
        <Link to="/loja" className="btn-link"><ArrowLeft size={14} /> Voltar para a loja</Link>
      </div>
    </div>
  )
}

interface GalleryItem { id: string; url: string }

function ProductGallery({ gallery, productName, activeImg, setActiveImg }: {
  gallery: GalleryItem[]
  productName: string
  activeImg: number
  setActiveImg: (i: number) => void
}) {
  const [lightbox, setLightbox] = useState(false)
  const total = gallery.length
  const safeIdx = total > 0 ? Math.min(activeImg, total - 1) : 0

  function next() { if (total > 1) setActiveImg((safeIdx + 1) % total) }
  function prev() { if (total > 1) setActiveImg((safeIdx - 1 + total) % total) }

  // Teclado: setas ←/→ navegam (sem interferir quando lightbox aberto, que tem o próprio handler)
  useEffect(() => {
    if (lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [safeIdx, total, lightbox])

  // Bloqueia scroll quando lightbox aberto + Esc fecha
  useEffect(() => {
    if (!lightbox) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [lightbox, safeIdx, total])

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-cream group select-none">
        {total > 0 ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={gallery[safeIdx].id}
              src={gallery[safeIdx].url}
              alt={productName}
              draggable={false}
              drag={total > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) next()
                else if (info.offset.x > 60) prev()
              }}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full object-cover cursor-zoom-in"
              onClick={() => setLightbox(true)}
            />
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-mocha-300 text-xs">
            sem imagem
          </div>
        )}

        {/* Setas — só aparecem com mais de 1 foto */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Foto anterior"
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-paper/90 backdrop-blur text-mocha-900 shadow-soft hover:bg-paper hover:scale-105 active:scale-95 transition md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Próxima foto"
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-paper/90 backdrop-blur text-mocha-900 shadow-soft hover:bg-paper hover:scale-105 active:scale-95 transition md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Contador */}
        {total > 1 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-mocha-900/70 backdrop-blur px-3 py-1 text-[11px] font-medium text-cream">
            {safeIdx + 1} / {total}
          </span>
        )}

        {/* Botão expandir (lightbox) */}
        {total > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(true) }}
            aria-label="Ver todas as fotos"
            className="absolute bottom-3 right-3 rounded-full bg-paper/90 backdrop-blur p-2 text-mocha-900 hover:bg-paper transition shadow-soft"
          >
            <Maximize2 size={14} />
          </button>
        )}

        {/* Dots — só mobile */}
        {total > 1 && (
          <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {gallery.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === safeIdx ? 'w-6 bg-paper' : 'w-1.5 bg-paper/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — todas as fotos */}
      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {gallery.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveImg(i)}
              aria-label={`Foto ${i + 1}`}
              className={`relative aspect-[3/4] w-16 md:w-20 shrink-0 overflow-hidden rounded-xl transition ${
                i === safeIdx ? 'ring-2 ring-mocha-900' : 'ring-1 ring-mocha-200 hover:ring-mocha-500'
              }`}
            ><img src={g.url} alt="" className="h-full w-full object-cover" /></button>
          ))}
        </div>
      )}

      {/* Lightbox fullscreen */}
      <AnimatePresence>
        {lightbox && total > 0 && (
          <motion.div
            role="dialog" aria-modal="true" aria-label={`Galeria — ${productName}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-mocha-950/95 backdrop-blur-sm flex flex-col"
            onClick={() => setLightbox(false)}
          >
            {/* Topo */}
            <div className="flex items-center justify-between p-4 md:p-6 text-cream">
              <span className="text-[12px] uppercase tracking-wider opacity-70">
                {safeIdx + 1} / {total}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(false) }}
                aria-label="Fechar"
                className="rounded-full bg-cream/10 hover:bg-cream/20 p-2.5 transition"
              ><ChevronLeft size={18} className="rotate-45" style={{ transform: 'rotate(0deg)' }} />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            {/* Imagem central */}
            <div className="flex-1 relative flex items-center justify-center px-4 pb-4 md:px-12 md:pb-8" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={gallery[safeIdx].id}
                  src={gallery[safeIdx].url}
                  alt={productName}
                  draggable={false}
                  drag={total > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) next()
                    else if (info.offset.x > 60) prev()
                  }}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-h-full max-w-full object-contain rounded-2xl"
                />
              </AnimatePresence>

              {total > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Foto anterior"
                    className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-cream/15 hover:bg-cream/30 text-cream transition"
                  ><ChevronLeft size={20} /></button>
                  <button
                    onClick={next}
                    aria-label="Próxima foto"
                    className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-cream/15 hover:bg-cream/30 text-cream transition"
                  ><ChevronRight size={20} /></button>
                </>
              )}
            </div>

            {/* Thumbs no rodapé */}
            {total > 1 && (
              <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-12 md:pb-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center">
                  {gallery.map((g, i) => (
                    <button
                      key={g.id}
                      onClick={() => setActiveImg(i)}
                      className={`relative aspect-[3/4] w-14 md:w-16 shrink-0 overflow-hidden rounded-lg transition ${
                        i === safeIdx ? 'ring-2 ring-cream' : 'ring-1 ring-cream/30 opacity-60 hover:opacity-100'
                      }`}
                    ><img src={g.url} alt="" className="h-full w-full object-cover" /></button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="container-page py-10 grid lg:grid-cols-[1.1fr_1fr] gap-10">
      <Skeleton className="aspect-[4/5] rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-32" />
        <div className="h-8" />
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import type { Product } from '@/types/catalog'
import { formatMoney } from '@/lib/format'
import { primaryImage, totalStock, colorOptions, findVariant } from '@/lib/product'
import { getPromotionStatus, getHeadlineDiscount } from '@/lib/promotion'
import { HypeBadge } from '@/components/ui/HypeBadge'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'

export function ProductCard({ product }: { product: Product; index?: number }) {
  const { isFavorite, toggle } = useFavorites()
  const { add } = useCart()
  const { showToast } = useToast()
  const fav = isFavorite(product.id)
  const stock = totalStock(product)
  const soldout = stock <= 0
  const promo = getPromotionStatus(product)
  const headline = getHeadlineDiscount(product)
  const finalPrice = headline.paymentMethodPrice
  const pixPrice = headline.bestPrice
  
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  const sizes = useMemo(() => {
    const s = new Set<string>()
    product.product_variants?.forEach(v => {
      if (v.stock > 0 && (!selectedColor || v.color === selectedColor)) {
        if (v.size) s.add(v.size)
      }
    })
    return Array.from(s)
  }, [product, selectedColor])

  const colors = useMemo(() => colorOptions(product), [product])
  
  const allPhotos = useMemo(() => {
    const photos = new Set<string>()
    const primary = primaryImage(product)
    if (primary) photos.add(primary)
      
    for (const v of product.product_variants || []) {
      if (v.image_url) photos.add(v.image_url)
      if (v.color_image_url) photos.add(v.color_image_url)
      for (const vi of v.variant_images || []) {
        if (vi.image_url) photos.add(vi.image_url)
      }
    }
    return Array.from(photos)
  }, [product])

  const [activeImgIdx, setActiveImgIdx] = useState(0)

  const handleColorClick = (e: React.MouseEvent, colorStr: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedColor(colorStr)
    setSelectedSize('')
    setShowQuickAdd(true)
    
    const v = findVariant(product, colorStr, null)
    let img = primaryImage(product, v)
    if (!img) {
      const cOpt = colors.find(c => c.color === colorStr)
      if (cOpt?.image_url) img = cOpt.image_url
    }
    if (img) {
      const idx = allPhotos.indexOf(img)
      if (idx !== -1) {
        setActiveImgIdx(idx)
      }
    }
  }

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (allPhotos.length > 1) {
      setActiveImgIdx((prev) => (prev + 1) % allPhotos.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (allPhotos.length > 1) {
      setActiveImgIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
    }
  }

  const getSelectedVariant = () => {
    let v = product.product_variants?.find(vx => 
      vx.stock > 0 && 
      (!selectedColor || vx.color === selectedColor) && 
      (!selectedSize || vx.size === selectedSize)
    )
    if (!v) v = product.product_variants?.find(vx => vx.stock > 0) || product.product_variants?.[0]
    return v
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (sizes.length > 0 && !selectedSize) {
      setShowQuickAdd(true)
      if (showQuickAdd) {
        showToast({ type: 'error', title: 'Selecione um tamanho', description: 'Escolha o tamanho antes de adicionar à sacola.' })
      }
      return
    }

    const v = getSelectedVariant()
    if (!v || v.stock <= 0) {
      showToast({ type: 'error', title: 'Produto esgotado', description: 'Este item não está mais disponível.' })
      return
    }

    add({
      variant_id: v.id,
      product_id: product.id,
      product_name: product.name,
      variant_label: v.label,
      size: v.size,
      color: v.color,
      color_hex: v.color_hex,
      unit_price: finalPrice,
      image_url: currentImg,
      quantity: 1,
      max_stock: v.stock,
      pix_active: product.pix_active,
      pix_percentage: product.pix_percentage
    })
    showToast({
      type: 'success',
      title: product.name,
      description: 'Adicionado à sacola',
      image: currentImg,
    })
    setShowQuickAdd(false)
  }

  const handleWhatsapp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (sizes.length > 0 && !selectedSize) {
      setShowQuickAdd(true)
      if (showQuickAdd) {
        showToast({ type: 'error', title: 'Selecione um tamanho', description: 'Escolha o tamanho antes de continuar.' })
      }
      return
    }
    const msg = `Olá, quero comprar o produto ${product.name}${selectedSize ? ` no tamanho ${selectedSize}` : ''}${selectedColor ? ` na cor ${selectedColor}` : ''} por ${formatMoney(finalPrice)}`
    window.open(`https://wa.me/558592577759?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const currentImg = allPhotos[activeImgIdx]

  return (
    <div
      className="group flex flex-col h-full"
      onMouseLeave={() => setShowQuickAdd(false)}
    >
      <div className="relative">
        <Link to={`/produto/${product.id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream">
            {currentImg ? (
              <img
                key={currentImg}
                src={currentImg}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-mocha-300 text-xs">sem imagem</div>
            )}
            
            {soldout && (
              <span className="absolute top-3 left-3 chip bg-mocha-900/90 text-cream border-transparent z-10">Esgotado</span>
            )}
            
            {!soldout && headline.isActive && (
              <HypeBadge headline={headline} size="sm" className="absolute top-3 left-3 z-10" />
            )}

            {!soldout && (
              <div className="md:hidden absolute bottom-2.5 right-2.5 z-20 flex items-center gap-2">
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWhatsapp(e); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft hover:scale-105 active:scale-95 transition"
                  aria-label="Comprar pelo WhatsApp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickAdd(true); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 backdrop-blur text-mocha-900 shadow-soft hover:bg-paper active:scale-95 transition"
                  aria-label="Opções de compra"
                >
                  <Plus size={18} strokeWidth={2} />
                </button>
              </div>
            )}
            
            {allPhotos.length > 1 && (
              <>
                <div className="md:hidden absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
                  {allPhotos.map((photo, i) => (
                    <img key={i} src={photo} alt={product.name} className="h-full w-full object-cover shrink-0 snap-center" />
                  ))}
                </div>

                <div 
                  className="hidden md:flex absolute inset-0 transition-transform duration-300 ease-out" 
                  style={{ transform: `translateX(-${activeImgIdx * 100}%)` }}
                >
                  {allPhotos.map((photo, i) => (
                    <img key={i} src={photo} alt={product.name} className="h-full w-full object-cover shrink-0" />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Foto anterior"
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full bg-paper/90 backdrop-blur text-mocha-900 shadow-soft hover:bg-paper hover:scale-105 active:scale-95 transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full bg-paper/90 backdrop-blur text-mocha-900 shadow-soft hover:bg-paper hover:scale-105 active:scale-95 transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={16} />
                </button>
                
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20 transition-opacity duration-300 group-hover:opacity-0">
                  {allPhotos.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all ${i === activeImgIdx ? 'w-4 bg-paper' : 'w-1 bg-paper/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {!soldout && (
              <>
                {/* Mobile Backdrop for Bottom Sheet */}
                {showQuickAdd && (
                  <div
                    className="fixed inset-0 bg-black/30 z-[60] md:hidden backdrop-blur-sm"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickAdd(false); }}
                  />
                )}

                <div
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className={`
                    fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl p-6 pb-8 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                    md:absolute md:rounded-t-none md:p-4 md:pb-4 md:shadow-[0_-12px_40px_rgba(0,0,0,0.06)] md:border-t md:border-black/5 md:z-30 md:bg-white/95 md:backdrop-blur-md
                    ${showQuickAdd ? 'translate-y-0 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]' : 'translate-y-full md:group-hover:translate-y-0'}
                  `}
                >
                  {/* Mobile Drag Handle */}
                  <div className="w-12 h-1 bg-mocha-100 rounded-full mx-auto mb-4 md:hidden" />

                  {/* Mobile Close Button */}
                  <button
                    onClick={() => setShowQuickAdd(false)}
                    className="absolute top-4 right-4 p-2 text-mocha-400 md:hidden"
                  >
                    <X size={18} />
                  </button>

                  {/* Mobile Product Summary Header */}
                  <div className="md:hidden flex items-center gap-4 mb-5 pb-5 border-b border-mocha-50">
                    <img src={currentImg} className="w-14 h-14 object-cover rounded-xl bg-mocha-50" />
                    <div>
                      <p className="text-sm font-semibold text-mocha-900 truncate pr-6">{product.name}</p>
                      <p className="text-[13px] font-bold text-mocha-900 mt-0.5">{formatMoney(finalPrice)}</p>
                    </div>
                  </div>

                  {sizes.length > 0 && (
                    <div className="flex flex-col items-start md:items-center mb-4 md:mb-0">
                      <span className="text-[10px] md:text-[9px] text-mocha-400 uppercase tracking-widest mb-2.5 md:mb-2 font-medium">Tamanho</span>
                      <div className="flex flex-wrap gap-2 md:gap-1.5 justify-start md:justify-center">
                        {sizes.map(s => (
                          <button
                            key={s}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(s); }}
                            className={`h-9 min-w-[36px] md:h-7 md:min-w-[28px] px-3 md:px-2 rounded-full text-[12px] md:text-[11px] font-semibold transition-colors ${selectedSize === s ? 'bg-mocha-900 text-cream' : 'bg-transparent border border-mocha-200 text-mocha-600 hover:text-mocha-900 hover:border-mocha-400 hover:bg-mocha-50'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 md:gap-2 md:mt-3.5">
                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-mocha-900 text-cream text-[12px] md:text-[10px] font-bold tracking-widest h-11 md:h-9 rounded-full uppercase hover:bg-mocha-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Adicionar à Sacola
                    </button>
                    <button
                      onClick={handleWhatsapp}
                      className="w-full bg-transparent text-mocha-900 border border-mocha-200 text-[12px] md:text-[10px] font-bold tracking-widest h-11 md:h-9 rounded-full uppercase hover:border-mocha-400 hover:bg-mocha-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Link>
        
        <button
          type="button"
          aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
          aria-pressed={fav}
          className={`absolute top-3 right-3 z-30 rounded-full p-2 active:scale-90 transition-all touch-manipulation ${
            fav
              ? 'bg-mocha-900 text-cream shadow-soft'
              : 'bg-paper/80 text-mocha-700 backdrop-blur hover:bg-paper hover:text-mocha-900 opacity-0 group-hover:opacity-100 md:opacity-100'
          }`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggle(product.id)
          }}
        >
          <Heart size={14} className={fav ? 'fill-current' : ''} strokeWidth={fav ? 0 : 1.75} />
        </button>
      </div>

      <div className="mt-4 flex-1 flex flex-col">
        <Link to={`/produto/${product.id}`}>
          <p className="text-[13.5px] leading-snug font-medium text-mocha-900 line-clamp-2 min-h-[2.6em]">{product.name}</p>
        </Link>

        {colors.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            {colors.slice(0, 5).map((c) => {
              const v = findVariant(product, c.color, null)
              let img = primaryImage(product, v)
              if (!img && c.image_url) img = c.image_url
              const idx = img ? allPhotos.indexOf(img) : -1
              const isActive = idx !== -1 && idx === activeImgIdx
              const isSelected = selectedColor === c.color || (isActive && !selectedColor)

              return (
                <button
                  key={c.color}
                  onClick={(e) => handleColorClick(e, c.color)}
                  aria-label={c.color}
                  title={c.color}
                  className="relative h-5 w-5 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                >
                  <span
                    className={`absolute inset-0 rounded-full ring-1 transition-all ${
                      isSelected ? 'ring-mocha-900 ring-offset-2 ring-offset-paper' : 'ring-mocha-200'
                    }`}
                  />
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: c.color_hex || '#E7E3DD' }}
                  >
                    {!c.color_hex && (
                      <span className="flex h-full w-full items-center justify-center text-[8px] text-mocha-600">
                        {c.color.slice(0, 1)}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
            {colors.length > 5 && (
              <span className="text-[10px] text-mocha-400 ml-0.5">+{colors.length - 5}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3">
          {soldout ? (
            <p className="text-[13px] font-medium text-mocha-400 italic">Esse acabou :(</p>
          ) : (
            <>
              {headline.isActive && headline.originalPrice > headline.paymentMethodPrice && (
                <p className="text-[12px] text-mocha-400 line-through decoration-mocha-300/70">
                  {formatMoney(headline.originalPrice)}
                </p>
              )}
              <p className={`text-[17px] font-semibold tracking-tight tabular-nums ${promo.isActive ? 'text-red-600' : 'text-mocha-900'}`}>
                {formatMoney(finalPrice)}
              </p>
              {headline.pixBoostPercent > 0 && (
                <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11.5px]">
                  <span className="text-pix-600 font-semibold tabular-nums">{formatMoney(pixPrice)}</span>
                  <span className="text-mocha-500">no PIX · {headline.pixBoostPercent}% off</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[3/4] rounded-2xl bg-cream" />
      <div className="mt-3.5 h-3 w-2/3 bg-cream rounded" />
      <div className="mt-2 h-3 w-1/3 bg-cream rounded" />
      <div className="mt-1.5 h-3 w-1/2 bg-cream rounded" />
    </div>
  )
}

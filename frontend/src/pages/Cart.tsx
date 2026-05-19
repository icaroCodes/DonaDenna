import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, Lock, MessageCircle, ChevronRight, ChevronDown, Check, Ticket } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { formatMoney } from '@/lib/format'
import { supabase } from '@/services/supabase'
import { getFeatured } from '@/services/api'
import type { Product } from '@/types/catalog'
import { ProductCard } from '@/components/product/ProductCard'

const PIX_DISCOUNT = 0.05

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove, clear } = useCart()
  const { user } = useAuth()
  const authModal = useAuthModal()
  const nav = useNavigate()

  // Estado local para a UX estilo Shopee (checkboxes)
  const [selectedIds, setSelectedIds] = useState<string[]>(lines.map(l => l.variant_id))
  
  // Produtos recomendados
  const [recommended, setRecommended] = useState<Product[]>([])

  useEffect(() => {
    async function fetchRecommended() {
      try {
        const { products } = await getFeatured()
        setRecommended(products.slice(0, 4))
      } catch (err) {
        console.error('Failed to fetch recommended products', err)
      }
    }
    fetchRecommended()
  }, [])

  const toggleSelectAll = () => {
    if (selectedIds.length === lines.length) setSelectedIds([])
    else setSelectedIds(lines.map(l => l.variant_id))
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(v => v !== id))
    else setSelectedIds([...selectedIds, id])
  }

  const selectedLines = lines.filter(l => selectedIds.includes(l.variant_id))
  const selectedSubtotal = selectedLines.reduce((acc, l) => acc + (l.unit_price * l.quantity), 0)
  const allSelected = selectedIds.length === lines.length && lines.length > 0

  function goCheckout() {
    if (!user) {
      authModal.show('signup', {
        redirectTo: '/checkout',
        reason: 'Quase lá! Crie sua conta em 10 segundos pra finalizar — seu carrinho continua exatamente como está.',
      })
    } else nav('/checkout')
  }

  const pixTotal = subtotal * (1 - PIX_DISCOUNT)
  const selectedPixTotal = selectedSubtotal * (1 - PIX_DISCOUNT)

  if (lines.length === 0) {
    return (
      <div className="container-page py-12 md:py-20">
        <Link to="/loja" className="btn-link mb-8"><ArrowLeft size={14} /> Continuar comprando</Link>
        <div className="rounded-3xl border border-mocha-100 p-10 md:p-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center rounded-full bg-cream p-5">
            <ShoppingBag size={28} strokeWidth={1.5} className="text-mocha-700" />
          </div>
          <h1 className="mt-6 h-display text-3xl md:text-4xl text-mocha-900">Seu carrinho está vazio</h1>
          <p className="mt-3 text-mocha-500 max-w-sm mx-auto leading-relaxed">
            Que tal explorar a loja? Temos lançamentos, conjuntos e acessórios pra você.
          </p>
          <Link to="/loja" className="btn-primary mt-7">Ir para a loja</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* MOBILE LAYOUT (Shopee Style) */}
      <div className="md:hidden bg-[#F5F5F5] min-h-screen pb-[140px] font-sans">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white flex items-center justify-between px-3 h-[60px] shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/loja" className="p-1"><ArrowLeft className="text-[#EE4D2D]" size={24} /></Link>
            <span className="text-[18px] text-[#333] font-medium">Carrinho ({lines.length})</span>
          </div>
          <div className="flex items-center gap-4 text-[15px] text-[#333]">
            <button className="font-medium text-[#333]">Editar</button>
            <MessageCircle size={22} className="text-[#EE4D2D]" />
          </div>
        </header>

        {/* Content */}
        <div className="mt-2 space-y-2">
          {lines.length > 0 && (
            <div className="bg-white px-3 py-3">
              {/* Store Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleSelectAll}
                    className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-colors ${allSelected ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'bg-white border-gray-300'}`}
                  >
                    {allSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                  </button>
                  <span className="bg-[#EE4D2D] text-white text-[10px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wide">Oficial</span>
                  <span className="text-[14px] font-medium text-[#333]">DonaDenna &gt;</span>
                </div>
                <button className="text-[13px] text-[#333]">Editar</button>
              </div>

              {/* Items */}
              <div className="space-y-6">
                {lines.map((l) => {
                  const isSelected = selectedIds.includes(l.variant_id)
                  return (
                    <div key={l.variant_id} className="flex gap-3 relative">
                      <div className="pt-8">
                        <button 
                          onClick={() => toggleSelect(l.variant_id)}
                          className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'bg-white border-gray-300'}`}
                        >
                          {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                        </button>
                      </div>
                      
                      <Link to={`/produto/${l.product_id}`} className="shrink-0">
                        <img src={l.image_url || ''} className="w-[85px] h-[85px] object-cover bg-gray-50 border border-gray-100 rounded-sm" />
                      </Link>
                      
                      <div className="flex-1 flex flex-col min-w-0">
                        <Link to={`/produto/${l.product_id}`}>
                          <p className="text-[13px] leading-snug text-[#333] line-clamp-2 mb-1 pr-6">{l.product_name}</p>
                        </Link>
                        
                        <div className="self-start flex items-center bg-[#F5F5F5] border border-gray-100 text-[#666] text-[11px] px-1.5 py-0.5 rounded-sm mb-auto max-w-full">
                          <span className="truncate">{[l.color, l.size].filter(Boolean).join(' · ') || l.variant_label}</span>
                          <ChevronDown size={12} className="inline ml-1 shrink-0" />
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[#EE4D2D] text-[15px] font-medium tracking-tight">{formatMoney(l.unit_price)}</span>
                          <div className="flex items-center border border-gray-300 rounded-sm bg-white">
                            <button onClick={() => setQuantity(l.variant_id, l.quantity - 1)} disabled={l.quantity <= 1} className="w-8 h-6 flex items-center justify-center text-gray-500 border-r border-gray-300 disabled:opacity-30"><Minus size={14} /></button>
                            <span className="w-10 h-6 flex items-center justify-center text-[13px] text-[#333] font-medium">{l.quantity}</span>
                            <button onClick={() => setQuantity(l.variant_id, l.quantity + 1)} disabled={l.quantity >= l.max_stock} className="w-8 h-6 flex items-center justify-center text-gray-500 border-l border-gray-300 disabled:opacity-30"><Plus size={14} /></button>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => remove(l.variant_id)}
                        className="absolute top-0 right-0 p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>

            </div>
          )}

        {/* You Might Also Like */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="h-[1px] w-12 bg-gray-300"></div>
          <span className="text-[13px] font-medium text-[#666] uppercase tracking-wide">Você Também Pode Gostar</span>
          <div className="h-[1px] w-12 bg-gray-300"></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 px-2 pb-6">
          {recommended.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-stretch justify-between pl-3 h-[54px] bg-white">
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleSelectAll}
                className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-colors ${allSelected ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'bg-white border-gray-300'}`}
              >
                {allSelected && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>
              <span className="text-[14px] text-[#333]">Tudo</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right py-1">
                <p className="text-[14px] text-[#333]">Total: <span className="text-[#EE4D2D] font-medium">{formatMoney(selectedSubtotal)}</span></p>
                {selectedSubtotal > 0 && <p className="text-[10px] text-gray-500">Economia no PIX: {formatMoney(selectedSubtotal - selectedPixTotal)}</p>}
              </div>
              <button 
                onClick={() => {
                  if (selectedIds.length === 0) alert('Selecione pelo menos um item para continuar.')
                  else goCheckout()
                }} 
                className="bg-[#EE4D2D] text-white text-[14px] font-medium px-6 h-full min-w-[120px] active:bg-[#D74226]"
              >
                Continuar ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block container-page py-8 md:py-12">
        <header className="mb-6 md:mb-8">
          <Link to="/loja" className="btn-link mb-4"><ArrowLeft size={14} /> Continuar comprando</Link>
          <h1 className="h-display text-3xl md:text-4xl text-mocha-900">Seu carrinho</h1>
          <p className="mt-1 text-sm text-mocha-500">{lines.length} {lines.length === 1 ? 'item' : 'itens'} · {formatMoney(subtotal)}</p>
        </header>

        {!user && (
          <div className="mb-5 rounded-2xl border border-mocha-100 bg-cream/60 px-4 py-3 flex items-center gap-3 text-[13px] text-mocha-800">
            <span className="rounded-full bg-paper p-1.5">
              <Lock size={14} className="text-mocha-700" />
            </span>
            <p className="flex-1 leading-snug">
              <strong className="font-semibold">Seu carrinho está salvo.</strong>{' '}
              Pode fechar a aba — quando entrar na sua conta, tudo isso vai junto.
            </p>
            <button onClick={() => authModal.show('signin', { redirectTo: '/carrinho' })} className="text-mocha-900 underline-offset-2 hover:underline font-medium">
              Entrar
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Lista de itens */}
          <section className="space-y-3">
            {lines.map((l, i) => (
              <motion.article
                key={l.variant_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-2xl border border-mocha-100 bg-paper p-3 md:p-4 flex gap-3 md:gap-5"
              >
                <Link to={`/produto/${l.product_id}`} className="shrink-0">
                  <div className="h-24 w-20 md:h-28 md:w-24 rounded-xl overflow-hidden bg-cream">
                    {l.image_url ? (
                      <img src={l.image_url} alt={l.product_name} className="h-full w-full object-cover" loading="lazy" />
                    ) : null}
                  </div>
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/produto/${l.product_id}`} className="block">
                        <p className="text-[14px] md:text-[15px] font-medium leading-tight text-mocha-900 truncate">{l.product_name}</p>
                      </Link>
                      <p className="mt-1 text-xs text-mocha-500">
                        {[l.color, l.size].filter(Boolean).join(' · ') || l.variant_label}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(l.variant_id)}
                      aria-label="Remover do carrinho"
                      className="text-mocha-400 hover:text-mocha-900 p-1.5 -mr-1.5 -mt-1.5"
                    ><Trash2 size={16} /></button>
                  </div>

                  <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-mocha-200">
                      <button
                        onClick={() => setQuantity(l.variant_id, l.quantity - 1)}
                        disabled={l.quantity <= 1}
                        aria-label="Diminuir"
                        className="h-9 w-9 flex items-center justify-center disabled:opacity-30 hover:bg-cream rounded-l-full transition"
                      ><Minus size={14} /></button>
                      <span className="w-8 text-center text-sm font-medium">{l.quantity}</span>
                      <button
                        onClick={() => setQuantity(l.variant_id, l.quantity + 1)}
                        disabled={l.quantity >= l.max_stock}
                        aria-label="Aumentar"
                        className="h-9 w-9 flex items-center justify-center disabled:opacity-30 hover:bg-cream rounded-r-full transition"
                      ><Plus size={14} /></button>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold tracking-tight text-mocha-900">{formatMoney(l.unit_price * l.quantity)}</p>
                      <p className="text-[10px] text-mocha-500">{formatMoney(l.unit_price)} cada</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}

            <div className="pt-2">
              <button
                onClick={() => { if (confirm('Esvaziar o carrinho?')) clear() }}
                className="text-xs text-mocha-500 hover:text-mocha-900 underline-offset-4 hover:underline"
              >
                Esvaziar carrinho
              </button>
            </div>
          </section>

          {/* Resumo */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-mocha-100 bg-cream/30 p-6">
              <p className="label-eyebrow">Resumo do pedido</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-mocha-600">Subtotal ({lines.length} {lines.length === 1 ? 'item' : 'itens'})</span>
                  <span className="text-mocha-900 font-medium">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-mocha-600">Frete</span>
                  <span className="text-mocha-500 text-xs italic">calculado no checkout</span>
                </div>
                <div className="flex items-baseline justify-between pt-3 border-t border-mocha-100">
                  <span className="text-mocha-900 font-semibold">Total</span>
                  <span className="h-display text-2xl text-mocha-900">{formatMoney(subtotal)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-pix-50 px-4 py-3 flex items-center gap-3">
                <div className="rounded-full bg-paper p-2"><Tag size={14} className="text-pix-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-mocha-700">Pagando no PIX você economiza</p>
                  <p className="text-[13px] font-semibold text-pix-600">{formatMoney(pixTotal)} <span className="text-[10px] text-pix-600/80 font-medium">· 5% off</span></p>
                </div>
              </div>

              <button onClick={goCheckout} className="btn-primary w-full mt-5">
                <Lock size={14} /> Ir para o checkout
              </button>
              <Link to="/loja" className="btn-ghost w-full mt-2">Continuar comprando</Link>

              <ul className="mt-6 space-y-2 text-[12px] text-mocha-600">
                <li>· Frete grátis acima de R$ 50 em Fortaleza, Caucaia e Eusébio</li>
                <li>· Parcele em até 5x sem juros no cartão</li>
                <li>· Trocas em até 7 dias corridos</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

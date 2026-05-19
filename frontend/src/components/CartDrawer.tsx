import { AnimatePresence, motion } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { formatMoney } from '@/lib/format'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export function CartDrawer() {
  const { lines, subtotal, isOpen, close, setQuantity, remove } = useCart()
  const { user } = useAuth()
  const authModal = useAuthModal()
  const nav = useNavigate()

  function checkout() {
    close()
    if (!user) {
      authModal.show('signup', {
        redirectTo: '/checkout',
        reason: 'Pra finalizar a compra precisamos da sua conta. Suas peças já estão salvas no carrinho.',
      })
    } else nav('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-ink/40"
            onClick={close}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-[92vw] max-w-[460px] bg-paper flex flex-col"
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <h2 className="text-[15px] font-semibold tracking-tight">Sacola</h2>
                <span className="text-sm text-neutral-500">({lines.length})</span>
              </div>
              <button onClick={close} className="rounded-full p-2 hover:bg-neutral-100"><X size={18} /></button>
            </header>

            {lines.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="rounded-full bg-neutral-100 p-5"><ShoppingBag size={28} strokeWidth={1.6} /></div>
                <p className="mt-5 text-[15px] font-medium">Sua sacola está vazia</p>
                <p className="mt-1.5 text-sm text-neutral-500 max-w-xs">Explore a loja e adicione peças que combinem com você.</p>
                <Link to="/loja" onClick={close} className="btn-primary mt-6">Ver a loja</Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {lines.map((l) => (
                    <div key={l.variant_id} className="flex gap-4">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {l.image_url ? (
                          <img src={l.image_url} alt={l.product_name} className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-medium leading-tight">{l.product_name}</p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {[l.color, l.size].filter(Boolean).join(' · ') || l.variant_label}
                            </p>
                          </div>
                          <button onClick={() => remove(l.variant_id)} className="text-neutral-400 hover:text-ink p-1"><Trash2 size={15} /></button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="inline-flex items-center rounded-full border border-neutral-200">
                            <button
                              onClick={() => setQuantity(l.variant_id, l.quantity - 1)}
                              disabled={l.quantity <= 1}
                              className="p-2 disabled:opacity-30"
                            ><Minus size={13} /></button>
                            <span className="w-7 text-center text-sm">{l.quantity}</span>
                            <button
                              onClick={() => setQuantity(l.variant_id, l.quantity + 1)}
                              disabled={l.quantity >= l.max_stock}
                              className="p-2 disabled:opacity-30"
                            ><Plus size={13} /></button>
                          </div>
                          <span className="text-[14px] font-semibold tracking-tight">{formatMoney(l.unit_price * l.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <footer className="border-t border-neutral-100 px-6 py-5 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-neutral-500">Subtotal</span>
                    <span className="text-lg font-semibold tracking-tight">{formatMoney(subtotal)}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Frete e descontos calculados no checkout.</p>
                  <button onClick={checkout} className="btn-primary w-full">Finalizar compra</button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

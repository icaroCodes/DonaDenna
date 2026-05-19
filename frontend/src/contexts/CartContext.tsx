import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import { supabase } from '@/services/supabase'
import { mergeCart, saveCart, getSavedCart } from '@/services/api'

export interface CartLine {
  variant_id: string
  product_id: string
  product_name: string
  variant_label: string
  size?: string | null
  color?: string | null
  color_hex?: string | null
  unit_price: number
  image_url?: string | null
  quantity: number
  max_stock: number
  // Snapshot do desconto PIX no momento em que foi adicionado ao carrinho.
  // O servidor reaplicará no fechamento — esses campos são só para a UI.
  pix_active?: boolean
  pix_type?: 'percentage' | 'fixed_price' | null
  pix_percentage?: number | null
  pix_price?: number | null
}

interface CartValue {
  lines: CartLine[]
  subtotal: number
  itemCount: number
  add: (line: CartLine) => void
  remove: (variant_id: string) => void
  setQuantity: (variant_id: string, quantity: number) => void
  clear: () => void
  isOpen: boolean
  open: () => void
  close: () => void
}

const CartContext = createContext<CartValue>(null!)
const STORAGE_KEY = 'donadenna.cart.v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartLine[]) : []
    } catch { return [] }
  })
  const [isOpen, setOpen] = useState(false)
  const isAuthed = useRef(false)
  const hydrating = useRef(false)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)) } catch { /* ignore */ }
    // Persiste no servidor (debounced) quando logada
    if (!isAuthed.current || hydrating.current) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveCart(lines.map((l) => ({
        variant_id: l.variant_id,
        quantity: l.quantity,
        snapshot: { ...l, quantity: undefined },
      }))).catch(() => {})
    }, 600) as unknown as number
  }, [lines])

  // Hidrata o carrinho do servidor após login + faz merge do carrinho de guest.
  // Tudo é best-effort: se a API/tabela não existir, o cart guest continua intacto.
  useEffect(() => {
    async function hydrateFromServer(opts: { mergeGuest: boolean }) {
      hydrating.current = true
      try {
        // Capture guest lines no MOMENTO do login (lê fresco do localStorage)
        const guestRaw = (() => {
          try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CartLine[] }
          catch { return [] as CartLine[] }
        })()
        if (opts.mergeGuest && guestRaw.length > 0) {
          await mergeCart(guestRaw.map((l) => ({
            variant_id: l.variant_id,
            quantity: l.quantity,
            snapshot: { ...l, quantity: undefined },
          }))).catch(() => {})
        }
        const saved = await getSavedCart().catch(() => [] as any[])
        if (!saved || saved.length === 0) return

        setLines((prev) => {
          const map = new Map(prev.map((l) => [l.variant_id, l]))
          for (const row of saved) {
            const snap = (row as any).snapshot as Partial<CartLine> | null
            const local = map.get(row.variant_id)
            if (snap && snap.product_id) {
              map.set(row.variant_id, {
                ...(local || {}),
                ...(snap as CartLine),
                variant_id: row.variant_id,
                quantity: row.quantity,
              } as CartLine)
            } else if (local) {
              map.set(row.variant_id, { ...local, quantity: row.quantity })
            }
          }
          return [...map.values()]
        })
      } catch { /* silencioso — guest local segue intacto */ }
      finally { hydrating.current = false }
    }

    try {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          isAuthed.current = true
          hydrateFromServer({ mergeGuest: true })
        }
      }).catch(() => {})
      const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
        if (event === 'SIGNED_IN' && sess?.user) {
          isAuthed.current = true
          hydrateFromServer({ mergeGuest: true })
        } else if (event === 'SIGNED_OUT') {
          isAuthed.current = false
        }
      })
      return () => { sub.subscription.unsubscribe() }
    } catch { return }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function add(line: CartLine) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.variant_id === line.variant_id)
      if (idx >= 0) {
        const next = [...prev]
        const merged = Math.min(next[idx].quantity + line.quantity, line.max_stock)
        next[idx] = { ...next[idx], quantity: merged, unit_price: line.unit_price, max_stock: line.max_stock, image_url: line.image_url ?? next[idx].image_url }
        return next
      }
      return [...prev, { ...line, quantity: Math.min(line.quantity, line.max_stock) }]
    })
    setOpen(true)
  }
  function remove(variant_id: string) {
    setLines((prev) => prev.filter((l) => l.variant_id !== variant_id))
  }
  function setQuantity(variant_id: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) => l.variant_id === variant_id
        ? { ...l, quantity: Math.max(1, Math.min(quantity, l.max_stock)) }
        : l),
    )
  }
  function clear() { setLines([]) }

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unit_price * l.quantity, 0),
    [lines],
  )
  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  )

  return (
    <CartContext.Provider value={{
      lines, subtotal, itemCount, add, remove, setQuantity, clear,
      isOpen, open: () => setOpen(true), close: () => setOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() { return useContext(CartContext) }

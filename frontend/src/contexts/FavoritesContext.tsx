import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { supabase } from '@/services/supabase'
import { listFavorites, addFavorite, removeFavorite, bulkAddFavorites } from '@/services/api'

interface FavoritesValue {
  ids: Set<string>
  isFavorite: (productId: string) => boolean
  toggle: (productId: string) => void
  count: number
  loading: boolean
}

const FavoritesContext = createContext<FavoritesValue>(null!)
const STORAGE_KEY = 'donadenna.favorites.v1'

function readGuest(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}
function writeAll(ids: Iterable<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])) } catch { /* ignore */ }
}

/**
 * Favoritos com fallback total no localStorage.
 *  - Guest: tudo no localStorage. Heart funciona instantaneamente.
 *  - Logada: o localStorage continua sendo a fonte para a UI; o servidor é
 *    sincronizado em background (sem rollback de UI em caso de erro de rede
 *    ou tabela ausente — assim a usuária nunca vê o coração "voltando atrás").
 *  - Login: mesclamos o conjunto guest + servidor numa só lista.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(readGuest()))
  const [loading, setLoading] = useState(false)
  const authedRef = useRef(false)

  // Persiste localStorage sempre que mudar — funciona logada também,
  // pra usar como cache offline.
  useEffect(() => { writeAll(ids) }, [ids])

  const mergeAndSyncOnLogin = useCallback(async () => {
    setLoading(true)
    try {
      const guest = readGuest()
      if (guest.length > 0) {
        bulkAddFavorites(guest).catch(() => { /* ignora — UI já tem tudo */ })
      }
      try {
        const rows = await listFavorites()
        const fromServer = (rows || []).map((r: any) => r.product_id).filter(Boolean)
        // união
        setIds((prev) => {
          const next = new Set(prev)
          for (const id of fromServer) next.add(id)
          return next
        })
      } catch { /* servidor offline? mantemos o que está local */ }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session?.user) {
        authedRef.current = true
        mergeAndSyncOnLogin()
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'SIGNED_IN' && sess?.user) {
        authedRef.current = true
        mergeAndSyncOnLogin()
      } else if (event === 'SIGNED_OUT') {
        authedRef.current = false
        // mantém os favoritos locais — viram a "lista guest" da próxima sessão
      }
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [mergeAndSyncOnLogin])

  const toggle = useCallback((productId: string) => {
    if (!productId) return
    let willBeFavorite = false
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) { next.delete(productId); willBeFavorite = false }
      else                     { next.add(productId);    willBeFavorite = true }
      return next
    })
    // Fire-and-forget: só sincroniza com servidor se estiver autenticada.
    // Erros não revertem a UI — o estado local é a verdade.
    if (authedRef.current) {
      if (willBeFavorite) addFavorite(productId).catch(() => {})
      else                removeFavorite(productId).catch(() => {})
    }
  }, [])

  const isFavorite = useCallback((id: string) => ids.has(id), [ids])

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite, toggle, count: ids.size, loading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() { return useContext(FavoritesContext) }

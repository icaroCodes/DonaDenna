import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import { getMe } from '@/services/api'
import type { Customer } from '@/types/catalog'

interface AuthValue {
  user: User | null
  session: Session | null
  customer: Customer | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (data: { name: string; email: string; phone?: string; password: string }) => Promise<string | null>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCustomer = useCallback(async () => {
    try {
      const me = await getMe()
      setCustomer(me.customer)
    } catch (err) {
      console.warn('[auth] loadCustomer:', (err as Error).message)
      setCustomer(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) await loadCustomer()
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
      if (event === 'SIGNED_IN' && sess?.user) {
        await loadCustomer()
      } else if (event === 'SIGNED_OUT') {
        setCustomer(null)
      }
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [loadCustomer])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'E-mail ou senha incorretos.'
    return null
  }

  async function signUp({ name, email, phone, password }: { name: string; email: string; phone?: string; password: string }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    })
    if (error) return error.message
    // sessão fica ativa automaticamente quando email confirmation está off.
    return null
  }

  async function signOut() {
    await supabase.auth.signOut()
    setCustomer(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, customer, loading, signIn, signUp, signOut, refresh: loadCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }

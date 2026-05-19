import { createContext, useContext, useRef, useState, ReactNode } from 'react'

interface ShowOptions {
  /** Para onde mandar a usuária após login/cadastro com sucesso. */
  redirectTo?: string
  /** Mensagem curta exibida no topo do modal pra dar contexto. */
  reason?: string
}

interface AuthModalValue {
  open: boolean
  mode: 'signin' | 'signup'
  reason?: string
  show: (mode?: 'signin' | 'signup', opts?: ShowOptions) => void
  hide: () => void
  /** Consumido pelo componente AuthModal logo após login bem-sucedido. */
  consumeRedirect: () => string | null
}

const AuthModalContext = createContext<AuthModalValue>(null!)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [reason, setReason] = useState<string | undefined>(undefined)
  const redirectRef = useRef<string | null>(null)

  return (
    <AuthModalContext.Provider value={{
      open, mode, reason,
      show: (m = 'signin', opts) => {
        setMode(m)
        setReason(opts?.reason)
        redirectRef.current = opts?.redirectTo || null
        setOpen(true)
      },
      hide: () => { setOpen(false); setReason(undefined); redirectRef.current = null },
      consumeRedirect: () => { const v = redirectRef.current; redirectRef.current = null; return v },
    }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() { return useContext(AuthModalContext) }

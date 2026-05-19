import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

/**
 * Login / Cadastro — fluxo enxuto inspirado em Shopee/Mercado Livre.
 * Cadastro pede só e-mail + senha. Nome e telefone são coletados depois,
 * naturalmente, dentro do checkout ou da conta — assim o gate inicial não
 * trava a navegação. Favoritos guest são preservados e mesclados ao logar
 * (ver FavoritesContext).
 */
export function AuthModal() {
  const { open, mode, reason, hide, show, consumeRedirect } = useAuthModal()
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp({ name: email.split('@')[0], email, password })
    setLoading(false)
    if (err) { setError(err); return }
    const to = consumeRedirect()
    hide()
    if (to) setTimeout(() => navigate(to), 60)
  }

  const isSignIn = mode === 'signin'
  const cta = isSignIn ? 'Entrar' : 'Criar conta'
  const title = isSignIn ? 'Acesse sua conta' : 'Bem-vinda à DonaDenna'
  const eyebrow = isSignIn ? 'Continuar de onde parou' : 'É rapidinho — só e-mail e senha'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm"
            onClick={hide}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[61] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full md:max-w-[420px] bg-paper md:rounded-3xl rounded-t-3xl shadow-soft pb-[max(env(safe-area-inset-bottom),0px)]">
              {/* Drag handle no mobile */}
              <div className="md:hidden flex justify-center pt-3">
                <span className="h-1 w-10 rounded-full bg-neutral-200" />
              </div>
              <div className="px-6 pt-5 pb-7 md:p-9 max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0">
                    <p className="label-eyebrow">{eyebrow}</p>
                    <h2 className="mt-1.5 text-2xl font-semibold tracking-tighter">{title}</h2>
                  </div>
                  <button onClick={hide} aria-label="Fechar" className="rounded-full p-2 -mr-2 hover:bg-neutral-100 active:scale-95"><X size={18} /></button>
                </div>

                {reason && (
                  <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">{reason}</div>
                )}
                {error && (
                  <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <form onSubmit={submit} className="space-y-2.5">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email" required autoComplete="email" inputMode="email"
                      autoCapitalize="off" autoCorrect="off"
                      className="input-field !pl-10 text-[16px]"
                      placeholder="seu@email.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password" required minLength={6}
                      autoComplete={isSignIn ? 'current-password' : 'new-password'}
                      className="input-field !pl-10 text-[16px]"
                      placeholder={isSignIn ? 'Senha' : 'Crie uma senha (mín. 6 caracteres)'}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button disabled={loading} className="btn-primary w-full !py-3.5 mt-3 text-[15px] font-semibold">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>{cta} <ArrowRight size={16} /></>}
                  </button>

                  {!isSignIn && (
                    <p className="text-center text-[12px] text-neutral-500 pt-2 leading-relaxed">
                      Ao criar a conta você concorda com os Termos.<br />
                      O resto a gente pergunta quando precisar.
                    </p>
                  )}
                </form>

                <div className="mt-6 flex items-center gap-3 text-xs text-neutral-400">
                  <div className="flex-1 h-px bg-neutral-200" />
                  <span>{isSignIn ? 'Novo por aqui?' : 'Já tem conta?'}</span>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>

                <button
                  type="button"
                  onClick={() => { setError(null); show(isSignIn ? 'signup' : 'signin') }}
                  className="mt-4 w-full rounded-full border border-neutral-200 py-3 text-[14px] font-medium hover:bg-neutral-50 active:scale-[0.99] transition"
                >
                  {isSignIn ? 'Criar uma conta' : 'Entrar com minha conta'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

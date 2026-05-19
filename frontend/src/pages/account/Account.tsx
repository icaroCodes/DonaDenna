import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Package, MapPin, Heart, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useAuthModal } from '@/contexts/AuthModalContext'

const TABS = [
  { to: '/conta',           label: 'Visão geral',  icon: User,    end: true  },
  { to: '/conta/pedidos',   label: 'Pedidos',      icon: Package, end: false },
  { to: '/conta/enderecos', label: 'Endereços',    icon: MapPin,  end: false },
  { to: '/conta/favoritos', label: 'Favoritos',    icon: Heart,   end: false },
]

export default function AccountLayout() {
  const { user, customer, signOut, loading } = useAuth()
  const authModal = useAuthModal()
  const nav = useNavigate()

  useEffect(() => {
    if (!loading && !user) { authModal.show('signin'); nav('/') }
  }, [loading, user, authModal, nav])

  if (!user) return null

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-10">
        <p className="label-eyebrow">Conta</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tighter">
          Olá, {customer?.name?.split(' ')[0] || 'pessoa'}
        </h1>
      </header>
      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside>
          <nav className="space-y-1">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive ? 'bg-ink text-paper' : 'text-neutral-700 hover:bg-neutral-100'
                  }`
                }
              >
                <t.icon size={16} /> {t.label}
              </NavLink>
            ))}
            <button
              onClick={() => { signOut(); nav('/') }}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-500 hover:bg-neutral-100"
            >
              <LogOut size={16} /> Sair
            </button>
          </nav>
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  )
}

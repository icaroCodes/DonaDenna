import { NavLink } from 'react-router-dom'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

const items = [
  { to: '/',         icon: Home,         label: 'Início'   },
  { to: '/loja',     icon: Search,       label: 'Loja'     },
  { to: '/conta',    icon: User,         label: 'Conta'    },
  { to: '/carrinho', icon: ShoppingBag,  label: 'Carrinho', isCart: true },
]

export function MobileNav() {
  const { itemCount } = useCart()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-mocha-100 bg-paper/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {items.map(({ to, icon: Icon, label, isCart }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 py-3 text-[10px] uppercase tracking-wider transition ${isActive ? 'text-mocha-900' : 'text-mocha-400'}`
            }
          >
            <span className="relative">
              <Icon size={20} strokeWidth={1.7} />
              {isCart && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-mocha-900 px-1 text-[10px] font-semibold text-cream">
                  {itemCount}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

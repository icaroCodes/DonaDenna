import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, ShoppingCart, User, Heart, Menu, X, ArrowUpRight, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './ui/Logo'
import { TopBar } from './TopBar'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { searchProducts } from '@/services/api'
import { primaryImage } from '@/lib/product'
import { formatMoney } from '@/lib/format'
import { getHeadlineDiscount } from '@/lib/promotion'
import type { Product } from '@/types/catalog'

const NAV = [
  { to: '/loja', label: 'Roupas' },
  { to: '/loja?category=conjunto', label: 'Conjuntos' },
  { to: '/loja?category=blusa', label: 'Blusas' },
  { to: '/loja?category=short', label: 'Shorts' },
  { to: '/loja?category=short_tlf', label: 'Shorts TLF' },
  { to: '/loja?category=acessorio', label: 'Acessórios' },
  { to: '/loja?sort=recent', label: 'Lançamentos', badge: 'NOVO' },
  { to: '/loja?sale=true', label: 'Promoções', highlight: true },
]

/** Categorias para busca por slug / nome */
const SEARCH_CATEGORIES = [
  { slug: 'conjunto',    name: 'Conjuntos',    display: 'Conjuntos' },
  { slug: 'blusa',       name: 'Blusas',       display: 'Blusas' },
  { slug: 'tshirt',      name: 'Tshirts',      display: 'Tshirts' },
  { slug: 'cropped',     name: 'Croppeds',     display: 'Croppeds' },
  { slug: 'macaquinho',  name: 'Macaquinhos',  display: 'Macaquinhos' },
  { slug: 'short',       name: 'Shorts',       display: 'Shorts' },
  { slug: 'short_tlf',   name: 'Shorts TLF',   display: 'Shorts TLF' },
  { slug: 'calca',       name: 'Calças',       display: 'Calças' },
  { slug: 'body',        name: 'Bodies',       display: 'Bodies' },
  { slug: 'acessorio',   name: 'Acessórios',   display: 'Acessórios' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [q, setQ] = useState('')
  const { itemCount } = useCart()
  const { user } = useAuth()
  const authModal = useAuthModal()
  const nav = useNavigate()

  // Autocomplete state
  const [results, setResults] = useState<Product[]>([])
  const [matchedCats, setMatchedCats] = useState<typeof SEARCH_CATEGORIES>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed || trimmed.length < 2) {
      setResults([])
      setMatchedCats([])
      setShowDropdown(false)
      return
    }

    // Match categories locally
    const lower = trimmed.toLowerCase()
    const cats = SEARCH_CATEGORIES.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.slug.toLowerCase().includes(lower) ||
      c.display.toLowerCase().includes(lower)
    )
    setMatchedCats(cats)

    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { products } = await searchProducts(trimmed)
        setResults(products.slice(0, 6))
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    setShowDropdown(true)
  }, [])

  function handleInputChange(value: string) {
    setQ(value)
    doSearch(value)
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setShowDropdown(false)
    nav(`/loja?search=${encodeURIComponent(q.trim())}`)
    setMobileOpen(false)
  }

  function goToProduct(id: string) {
    setShowDropdown(false)
    setQ('')
    setMobileOpen(false)
    nav(`/produto/${id}`)
  }

  function goToCategory(slug: string) {
    setShowDropdown(false)
    setQ('')
    setMobileOpen(false)
    nav(`/loja?category=${slug}`)
  }

  function goToSearchResults() {
    if (!q.trim()) return
    setShowDropdown(false)
    setMobileOpen(false)
    nav(`/loja?search=${encodeURIComponent(q.trim())}`)
  }

  function onProfileClick() {
    if (user) nav('/conta'); else authModal.show('signin')
  }

  const hasResults = matchedCats.length > 0 || results.length > 0 || loading

  return (
    <>
      <div className="hidden md:block">
        <TopBar />
      </div>

      {/* MOBILE ML STYLE HEADER */}
      <header className="md:hidden sticky top-0 z-40 bg-[#1A0F0A] shadow-sm">
        <div className="flex items-center gap-2.5 px-3 py-2.5 h-[60px]">
          <Link to="/" className="shrink-0 flex items-center">
            {/* brightness-0 invert will make the dark logo pure white */}
            <img src="/Denna.png" alt="DonaDenna" className="h-[28px] w-auto object-contain brightness-0 invert" />
          </Link>

          <div className="flex-1 relative" ref={mobileDropdownRef}>
            <form onSubmit={submitSearch} className="flex items-center bg-white rounded-full px-3 py-[6px] shadow-sm">
              <Search size={16} className="text-[#999999] shrink-0" />
              <input
                value={q}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => q.trim().length >= 2 && setShowDropdown(true)}
                placeholder="Estou buscando..."
                className="flex-1 ml-2 bg-transparent outline-none text-[13px] text-[#333333] placeholder:text-[#999999] w-full min-w-0"
              />
              {q && (
                <button type="button" onClick={() => { setQ(''); setShowDropdown(false); setResults([]); setMatchedCats([]) }} className="p-0.5 text-[#999]">
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Mobile Autocomplete Dropdown */}
            <AnimatePresence>
              {showDropdown && hasResults && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] border border-neutral-100 overflow-hidden z-[60] max-h-[70vh] overflow-y-auto"
                >
                  <SearchDropdownContent
                    categories={matchedCats}
                    products={results}
                    loading={loading}
                    query={q}
                    onProduct={goToProduct}
                    onCategory={goToCategory}
                    onViewAll={goToSearchResults}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setMobileOpen(true)} className="relative shrink-0 p-1 flex items-center">
            <Menu size={22} className="text-white" strokeWidth={1.5} />
          </button>

          <Link to="/carrinho" className="relative shrink-0 p-1 flex items-center">
            <ShoppingCart size={22} className="text-white" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E63B2E] px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* DESKTOP HEADER */}
      <motion.header
        initial={false}
        animate={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,1)',
          borderColor: scrolled ? 'rgba(67,45,28,0.08)' : 'rgba(0,0,0,0)',
          backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:block sticky top-0 z-40 border-b"
      >
        <div className="container-page grid grid-cols-[200px_1fr_auto] items-center gap-8 h-20">
          <div className="flex items-center gap-3">
            <Logo />
          </div>

          <div className="relative max-w-[520px] w-full mx-auto" ref={dropdownRef}>
            <form onSubmit={submitSearch} className="flex items-center gap-3 rounded-full border border-mocha-200 bg-cream/40 px-5 py-2.5 w-full hover:border-mocha-400 transition focus-within:border-mocha-600 focus-within:bg-paper">
              <Search size={16} className="text-mocha-400" />
              <input
                value={q}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => q.trim().length >= 2 && setShowDropdown(true)}
                placeholder="O que você procura hoje?"
                className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-mocha-400"
              />
              {q && (
                <button type="button" onClick={() => { setQ(''); setShowDropdown(false); setResults([]); setMatchedCats([]) }} className="p-0.5 text-mocha-400 hover:text-mocha-700 transition">
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Desktop Autocomplete Dropdown */}
            <AnimatePresence>
              {showDropdown && hasResults && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.14)] border border-mocha-100 overflow-hidden z-50 max-h-[480px] overflow-y-auto"
                >
                  <SearchDropdownContent
                    categories={matchedCats}
                    products={results}
                    loading={loading}
                    query={q}
                    onProduct={goToProduct}
                    onCategory={goToCategory}
                    onViewAll={goToSearchResults}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Favoritos"
              onClick={() => user ? nav('/conta/favoritos') : authModal.show('signin')}
              className="inline-flex flex-col items-center px-3 hover:text-mocha-600 transition"
            >
              <Heart size={18} strokeWidth={1.6} />
              <span className="text-[10px] mt-0.5 text-mocha-500">Favoritos</span>
            </button>
            <button
              onClick={onProfileClick}
              className="inline-flex flex-col items-center px-3 hover:text-mocha-600 transition"
            >
              <User size={18} strokeWidth={1.6} />
              <span className="text-[10px] mt-0.5 text-mocha-500">{user ? 'Conta' : 'Entrar'}</span>
            </button>

            <Link
              to="/carrinho"
              aria-label="Carrinho"
              className="relative inline-flex flex-col items-center px-3 hover:text-mocha-600 transition"
            >
              <ShoppingBag size={18} strokeWidth={1.6} />
              <span className="text-[10px] mt-0.5 text-mocha-500">Carrinho</span>
              {itemCount > 0 && (
                <span className="absolute top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-mocha-600 px-1 text-[10px] font-semibold text-cream">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Nav inferior — categorias */}
        <div className="hidden md:block border-t border-mocha-100/60">
          <nav className="container-page flex items-center justify-center gap-8 h-11">
            {NAV.map((n) => (
              <NavLink
                key={n.label}
                to={n.to}
                end
                className={({ isActive }) =>
                  `relative text-[12px] uppercase tracking-wider font-medium transition-colors ${
                    isActive ? 'text-mocha-900' : n.highlight ? 'text-pix-600 hover:text-pix-600' : 'text-mocha-600 hover:text-mocha-900'
                  }`
                }
              >
                {n.label}
                {n.badge && (
                  <span className="absolute -top-1.5 -right-7 text-[9px] bg-mocha-900 text-cream px-1.5 py-0.5 rounded font-bold">{n.badge}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-mocha-900/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[420px] bg-paper p-6 flex flex-col"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 hover:bg-cream"><X size={20} /></button>
              </div>
              <form onSubmit={submitSearch} className="mt-6 flex items-center gap-2 rounded-full border border-mocha-200 bg-cream/40 px-4 py-2.5">
                <Search size={16} className="text-mocha-400" />
                <input value={q} onChange={(e) => handleInputChange(e.target.value)} placeholder="Buscar..." className="flex-1 bg-transparent outline-none text-[14px]" />
              </form>

              {/* Carrinho em destaque */}
              <Link
                to="/carrinho"
                onClick={() => setMobileOpen(false)}
                className="mt-5 flex items-center justify-between rounded-2xl bg-cream/60 border border-mocha-100 px-4 py-3.5 hover:bg-cream transition"
              >
                <span className="flex items-center gap-3">
                  <span className="relative rounded-full bg-paper border border-mocha-100 p-2">
                    <ShoppingBag size={16} className="text-mocha-900" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-mocha-900 px-1 text-[10px] font-semibold text-cream">
                        {itemCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[15px] font-medium text-mocha-900">Carrinho</span>
                </span>
                <span className="text-xs text-mocha-500">
                  {itemCount === 0 ? 'vazio' : `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
                </span>
              </Link>

              <nav className="mt-6 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.label}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-2xl px-4 py-3.5 text-[16px] font-medium transition ${n.highlight ? 'text-pix-600' : 'text-mocha-900 hover:bg-cream'}`}
                  >{n.label}</Link>
                ))}
              </nav>
              <div className="mt-auto pt-8 border-t border-mocha-100 flex flex-col gap-3">
                <button onClick={() => { setMobileOpen(false); onProfileClick() }} className="btn-ghost w-full">
                  <User size={16} />{user ? 'Minha conta' : 'Entrar / Cadastrar'}
                </button>
                <Link to="/loja" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                  Explorar a loja
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── Search Autocomplete Dropdown Content ───────────────────────── */
function SearchDropdownContent({
  categories, products, loading, query,
  onProduct, onCategory, onViewAll,
}: {
  categories: typeof SEARCH_CATEGORIES
  products: Product[]
  loading: boolean
  query: string
  onProduct: (id: string) => void
  onCategory: (slug: string) => void
  onViewAll: () => void
}) {
  return (
    <div className="py-2">
      {/* Categories match */}
      {categories.length > 0 && (
        <div className="px-4 pt-2 pb-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-mocha-400 mb-2">Categorias</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => onCategory(c.slug)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/80 border border-mocha-100 text-[12px] font-medium text-mocha-700 hover:bg-mocha-900 hover:text-cream hover:border-mocha-900 transition-all active:scale-95"
              >
                <Tag size={11} />
                {c.display}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      {categories.length > 0 && (products.length > 0 || loading) && (
        <div className="mx-4 my-2 border-t border-mocha-50" />
      )}

      {/* Products */}
      {loading && products.length === 0 && (
        <div className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-mocha-400 mb-3">Produtos</p>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-12 w-12 rounded-xl bg-cream animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-3/4 bg-cream rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-cream rounded animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <div className="px-4 pt-1 pb-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-mocha-400 mb-1.5">Produtos</p>
          <ul>
            {products.map((p) => {
              const img = primaryImage(p)
              const headline = getHeadlineDiscount(p)
              const price = headline.paymentMethodPrice
              const hasDiscount = headline.isActive && headline.originalPrice > price

              return (
                <li key={p.id}>
                  <button
                    onClick={() => onProduct(p.id)}
                    className="w-full flex items-center gap-3.5 py-2.5 px-2 -mx-2 rounded-xl hover:bg-cream/70 transition-colors group text-left"
                  >
                    {/* Thumbnail */}
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-cream shrink-0 border border-mocha-50">
                      {img ? (
                        <img src={img} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-mocha-200 text-[9px]">sem foto</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-mocha-900 truncate leading-snug">{p.name}</p>
                      {p.category && (
                        <p className="text-[10px] text-mocha-400 mt-0.5 uppercase tracking-wider">{p.category}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {hasDiscount && (
                          <span className="text-[11px] text-mocha-400 line-through">{formatMoney(headline.originalPrice)}</span>
                        )}
                        <span className={`text-[13px] font-semibold ${hasDiscount ? 'text-red-600' : 'text-mocha-900'}`}>
                          {formatMoney(price)}
                        </span>
                        {headline.pixBoostPercent > 0 && (
                          <span className="chip-pix text-[9px]">{headline.pixBoostPercent}% PIX</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight size={14} className="text-mocha-300 group-hover:text-mocha-600 transition shrink-0" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* "Ver todos" button */}
      {(products.length > 0 || categories.length > 0) && (
        <>
          <div className="mx-4 my-1 border-t border-mocha-50" />
          <div className="px-4 pb-2 pt-1">
            <button
              onClick={onViewAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cream/50 hover:bg-cream text-[12px] font-semibold text-mocha-700 hover:text-mocha-900 transition-colors active:scale-[0.98]"
            >
              <Search size={13} />
              Ver todos os resultados para "{query.trim()}"
            </button>
          </div>
        </>
      )}

      {/* No results */}
      {!loading && products.length === 0 && categories.length === 0 && query.trim().length >= 2 && (
        <div className="px-4 py-6 text-center">
          <p className="text-[13px] text-mocha-500">Nenhum resultado para "<span className="font-medium text-mocha-700">{query.trim()}</span>"</p>
          <p className="text-[11px] text-mocha-400 mt-1">Tente buscar por outro termo ou navegue pelas categorias.</p>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listProducts } from '@/services/api'
import type { Product } from '@/types/catalog'
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard'
import { SlidersHorizontal, X } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'recent',     label: 'Mais recentes' },
  { value: 'price_asc',  label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name',       label: 'Nome (A–Z)' },
]
const CATS = [
  { slug: '', name: 'Tudo' },
  { slug: 'conjunto', name: 'Conjuntos' },
  { slug: 'blusa', name: 'Blusas' },
  { slug: 'tshirt', name: 'Tshirts' },
  { slug: 'cropped', name: 'Croppeds' },
  { slug: 'macaquinho', name: 'Macaquinhos' },
  { slug: 'short', name: 'Shorts' },
  { slug: 'short_tlf', name: 'Shorts TLF' },
  { slug: 'calca', name: 'Calças' },
  { slug: 'body', name: 'Bodies' },
  { slug: 'acessorio', name: 'Acessórios' },
]

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || ''
  const search = params.get('search') || ''
  const sort = params.get('sort') || 'recent'

  const [items, setItems] = useState<Product[] | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    setItems(null)
    listProducts({ category, search, sort, limit: 60 })
      .then((r) => setItems(r.products))
      .catch(() => setItems([]))
  }, [category, search, sort])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div className="container-page py-10 md:py-14">
      <header className="flex items-end justify-between gap-6 mb-8">
        <div>
          <p className="label-eyebrow">Loja</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tighter">
            {search ? `Resultados para "${search}"` : 'Todos os produtos'}
          </h1>
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="md:hidden inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm"
        >
          <SlidersHorizontal size={16} /> Filtros
        </button>
      </header>

      <div className="grid md:grid-cols-[220px_1fr] gap-10">
        <aside className="hidden md:block">
          <FilterBar category={category} sort={sort} onCategory={(v) => updateParam('category', v)} onSort={(v) => updateParam('sort', v)} />
        </aside>

        <div>
          {items === null ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-neutral-100 p-12 text-center text-neutral-500">
              Nenhum produto encontrado. Tente outra busca.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40" onClick={() => setFiltersOpen(false)}>
          <aside
            className="absolute inset-y-0 right-0 w-[88vw] max-w-[380px] bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">Filtros</h2>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2 hover:bg-neutral-100"><X size={18} /></button>
            </div>
            <FilterBar category={category} sort={sort} onCategory={(v) => updateParam('category', v)} onSort={(v) => updateParam('sort', v)} />
          </aside>
        </div>
      )}
    </div>
  )
}

function FilterBar({ category, sort, onCategory, onSort }: {
  category: string; sort: string
  onCategory: (v: string) => void; onSort: (v: string) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-eyebrow mb-4">Categoria</p>
        <ul className="space-y-1">
          {CATS.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => onCategory(c.slug)}
                className={`w-full text-left rounded-xl px-3 py-2 text-[14px] transition ${
                  category === c.slug ? 'bg-ink text-paper' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >{c.name}</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="label-eyebrow mb-4">Ordenar por</p>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="input-field"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  )
}

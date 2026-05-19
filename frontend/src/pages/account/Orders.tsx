import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Loader2 } from 'lucide-react'
import { listOrders } from '@/services/api'
import type { Order } from '@/types/catalog'
import { formatMoney } from '@/lib/format'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando pagamento',
  partial: 'Pago parcialmente',
  paid:    'Pago',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  useEffect(() => { listOrders().then(setOrders).catch(() => setOrders([])) }, [])

  if (orders === null) {
    return <div className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
  }
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-100 p-12 text-center">
        <Package size={28} className="mx-auto text-neutral-300" />
        <p className="mt-4 text-[15px] font-medium">Você ainda não fez nenhum pedido</p>
        <p className="mt-1 text-sm text-neutral-500">Quando comprar, seus pedidos aparecerão aqui.</p>
        <Link to="/loja" className="btn-primary mt-6">Conhecer a loja</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Link key={o.id} to={`/pedido/${o.id}`} className="group flex items-center gap-4 rounded-2xl border border-neutral-100 p-5 hover:border-ink transition">
          <div className="rounded-full bg-neutral-100 p-3"><Package size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-[15px] font-medium">Pedido #{o.id.slice(0,8).toUpperCase()}</p>
              <span className="chip">{STATUS_LABEL[o.status] || o.status}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}
              {o.sale_items.length} {o.sale_items.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-semibold tracking-tight">{formatMoney(o.total_amount + (o.sale_deliveries?.[0]?.amount || 0))}</p>
          </div>
          <ChevronRight size={16} className="text-neutral-300 group-hover:text-ink transition" />
        </Link>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronRight, Loader2, Package, Store, Truck } from 'lucide-react'
import { getOrder } from '@/services/api'
import type { Order } from '@/types/catalog'
import { formatMoney, etaLabel, formatCep } from '@/lib/format'

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getOrder(id).then(setOrder).catch((e) => setError(e.message))
  }, [id])

  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/loja" className="btn-ghost mt-6">Voltar para a loja</Link>
      </div>
    )
  }
  if (!order) {
    return (
      <div className="container-page py-20 flex items-center justify-center gap-3 text-neutral-500">
        <Loader2 size={16} className="animate-spin" /> Carregando seu pedido…
      </div>
    )
  }

  const delivery = order.sale_deliveries?.[0]
  const isPickup = delivery?.mode === 'pickup'

  return (
    <div className="container-page py-12 md:py-20 max-w-3xl mx-auto">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper">
          <Check size={22} />
        </div>
        <p className="label-eyebrow mt-6">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.05]">
          Obrigado pelo seu pedido.
        </h1>
        <p className="mt-4 text-neutral-500 max-w-md mx-auto">
          Recebemos tudo certinho. Vamos preparar suas peças com carinho e te avisar a cada etapa.
        </p>
      </div>

      <div className="mt-10 grid gap-3">
        <div className="rounded-2xl border border-neutral-100 p-6 flex gap-4">
          <div className="rounded-full bg-neutral-100 p-3">
            {isPickup ? <Store size={18} /> : <Truck size={18} />}
          </div>
          <div className="flex-1">
            <p className="label-eyebrow">{isPickup ? 'Retirada na loja' : 'Entrega'}</p>
            {isPickup ? (
              <p className="mt-1 text-[15px] text-neutral-700">
                Rua Martins de Carvalho, 3885 · Bom Jardim · Fortaleza/CE
              </p>
            ) : delivery && (
              <p className="mt-1 text-[15px] text-neutral-700">
                {delivery.recipient}<br/>
                {delivery.street}, {delivery.number}{delivery.complement ? ` · ${delivery.complement}` : ''}<br/>
                {delivery.district} · {delivery.city}/{delivery.state} · {delivery.cep && formatCep(delivery.cep)}
              </p>
            )}
            {delivery && (
              <p className="mt-2 text-xs text-neutral-500">
                {delivery.service} · {etaLabel(delivery.eta_min_days, delivery.eta_max_days)}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-100 p-6">
          <p className="label-eyebrow mb-4">Itens</p>
          <ul className="space-y-4">
            {order.sale_items.map((it) => (
              <li key={it.id} className="flex gap-3">
                <div className="h-16 w-14 rounded-xl bg-neutral-100 overflow-hidden">
                  {it.product_variants?.image_url || it.product_variants?.color_image_url ? (
                    <img src={it.product_variants?.image_url || it.product_variants?.color_image_url || ''} alt="" className="h-full w-full object-cover" />
                  ) : <Package className="m-auto h-full text-neutral-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.product_name}</p>
                  <p className="text-xs text-neutral-500">{it.variant_label} · {it.quantity}x</p>
                </div>
                <p className="text-sm font-medium whitespace-nowrap">{formatMoney(it.subtotal)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-neutral-100 pt-4 flex items-baseline justify-between">
            <span className="text-sm text-neutral-500">Total</span>
            <span className="text-xl font-semibold tracking-tight">{formatMoney(order.total_amount + (delivery?.amount || 0))}</span>
          </div>
          <p className="mt-3 text-xs text-neutral-500">Forma de pagamento: <span className="text-ink capitalize">{order.payment_method}</span> · status <span className="text-ink">{order.status}</span></p>
        </div>
      </div>

      <div className="mt-10 flex flex-col md:flex-row gap-3 md:justify-center">
        <Link to="/conta/pedidos" className="btn-primary">Acompanhar pedidos <ChevronRight size={14} /></Link>
        <Link to="/loja" className="btn-ghost">Continuar comprando</Link>
      </div>
    </div>
  )
}

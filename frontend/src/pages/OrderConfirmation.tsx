import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, Check, ChevronRight, Clock, Loader2, Package, Store, Truck, XCircle } from 'lucide-react'
import { getOrder, startMercadoPagoCheckout } from '@/services/api'
import type { Order } from '@/types/catalog'
import { formatMoney, etaLabel, formatCep } from '@/lib/format'

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const paymentStatus = searchParams.get('payment') // success|pending|failure|error|null
  const [retrying, setRetrying] = useState(false)

  // Se voltou como 'pending' ou 'success' o webhook pode demorar uns segundos
  // pra atualizar o status do pedido — re-busca a cada 3s nos primeiros 30s.
  const pollRef = useRef<number | null>(null)
  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = () => getOrder(id).then((o) => { if (!cancelled) setOrder(o) }).catch((e) => !cancelled && setError(e.message))
    load()
    if (paymentStatus === 'success' || paymentStatus === 'pending') {
      let elapsed = 0
      pollRef.current = window.setInterval(() => {
        elapsed += 3
        load()
        if (elapsed >= 30 && pollRef.current) {
          window.clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, 3000)
    }
    return () => {
      cancelled = true
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [id, paymentStatus])

  async function retryPayment() {
    if (!id) return
    setRetrying(true)
    try {
      const session = await startMercadoPagoCheckout(id)
      window.location.href = session.init_point
    } catch (e) {
      setError((e as Error).message)
      setRetrying(false)
    }
  }

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
  const isPaid = order.status === 'paid'

  // Banner em cima reflete o retorno do MP combinado com o status real da venda.
  const banner = (() => {
    if (isPaid) return { tone: 'success' as const, title: 'Pagamento aprovado.', sub: 'Vamos preparar suas peças com carinho.' }
    if (paymentStatus === 'success') return { tone: 'pending' as const, title: 'Pagamento em processamento.', sub: 'Já recebemos o aviso e em instantes confirmamos por aqui.' }
    if (paymentStatus === 'pending') return { tone: 'pending' as const, title: 'Aguardando confirmação.', sub: 'Boletos e PIX podem levar alguns minutos pra cair.' }
    if (paymentStatus === 'failure') return { tone: 'failure' as const, title: 'O pagamento não foi aprovado.', sub: 'Você pode tentar novamente com outro método.' }
    if (paymentStatus === 'error') return { tone: 'failure' as const, title: 'Pedido criado, mas o checkout não abriu.', sub: 'Tente reabrir o pagamento abaixo.' }
    return { tone: 'pending' as const, title: 'Pedido recebido.', sub: 'Aguardando confirmação do pagamento.' }
  })()

  return (
    <div className="container-page py-12 md:py-20 max-w-3xl mx-auto">
      <div className="text-center">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${
          banner.tone === 'success' ? 'bg-ink text-paper'
          : banner.tone === 'pending' ? 'bg-amber-100 text-amber-700'
          : 'bg-red-100 text-red-700'
        }`}>
          {banner.tone === 'success' ? <Check size={22} /> : banner.tone === 'pending' ? <Clock size={22} /> : <XCircle size={22} />}
        </div>
        <p className="label-eyebrow mt-6">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.05]">
          {banner.title}
        </h1>
        <p className="mt-4 text-neutral-500 max-w-md mx-auto">{banner.sub}</p>

        {(banner.tone === 'failure' || (!isPaid && paymentStatus === 'pending')) && (
          <div className="mt-6">
            <button onClick={retryPayment} disabled={retrying} className="btn-primary">
              {retrying ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
              Reabrir pagamento
            </button>
          </div>
        )}
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

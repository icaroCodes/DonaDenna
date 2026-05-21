import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2, MapPin, Store, Truck, Zap, CreditCard, QrCode, FileText, ChevronRight, AlertCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import {
  createOrder, listAddresses, createAddress, quoteShipping, startMercadoPagoCheckout,
} from '@/services/api'
import type { ShippingOption, ShopperAddress } from '@/types/catalog'
import { cleanCep, etaLabel, formatCep, formatMoney, lookupCep } from '@/lib/format'

type Step = 'address' | 'shipping' | 'payment' | 'review'

const STEPS: { key: Step; label: string }[] = [
  { key: 'address',  label: 'Endereço' },
  { key: 'shipping', label: 'Entrega' },
  { key: 'payment',  label: 'Pagamento' },
  { key: 'review',   label: 'Revisão' },
]

export default function CheckoutPage() {
  const { user, customer, loading: authLoading } = useAuth()
  const { lines, subtotal, clear } = useCart()
  const authModal = useAuthModal()
  const nav = useNavigate()

  const [step, setStep] = useState<Step>('address')
  const [addresses, setAddresses] = useState<ShopperAddress[] | null>(null)
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [newAddress, setNewAddress] = useState<Omit<ShopperAddress, 'id' | 'customer_id' | 'created_at' | 'is_default'>>({
    label: '', recipient: '', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '', phone: '',
  })

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[] | null>(null)
  const [localEligible, setLocalEligible] = useState(false)
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isProfileComplete = Boolean(customer?.cpf && customer?.phone && customer?.name)

  useEffect(() => {
    if (authLoading || !user) return
    if (lines.length === 0) { nav('/loja'); return }
    listAddresses().then((a) => {
      setAddresses(a)
      const def = a.find((x) => x.is_default) || a[0]
      if (def) { setSelectedAddressId(def.id); setAddressMode('saved') }
      else setAddressMode('new')
    }).catch(() => setAddresses([]))
  }, [authLoading, user, lines.length, nav])

  const currentAddress: ShopperAddress | typeof newAddress | null = useMemo(() => {
    if (addressMode === 'saved' && selectedAddressId && addresses) {
      return addresses.find((a) => a.id === selectedAddressId) || null
    }
    if (addressMode === 'new') return newAddress
    return null
  }, [addressMode, selectedAddressId, addresses, newAddress])

  async function fetchShipping(cep: string) {
    if (cleanCep(cep).length !== 8 || lines.length === 0) return
    setShippingLoading(true); setShippingOptions(null)
    try {
      const r = await quoteShipping({
        destination_cep: cep,
        items: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
      })
      setShippingOptions(r.options)
      setLocalEligible(r.local_eligible)
      setSelectedShipping(r.options[0] || null)
    } catch (err) {
      setError((err as Error).message)
    } finally { setShippingLoading(false) }
  }

  function gotoShipping() {
    setError(null)
    if (!isProfileComplete) {
      setError('Por favor, complete seu CPF e telefone no seu perfil antes de prosseguir.')
      return
    }
    if (addressMode === 'saved' && !selectedAddressId) { setError('Selecione um endereço.'); return }
    if (addressMode === 'new') {
      const required: (keyof typeof newAddress)[] = ['recipient', 'cep', 'street', 'number', 'district', 'city', 'state']
      for (const k of required) if (!newAddress[k]) { setError('Preencha todos os campos do endereço.'); return }
    }
    const cep = addressMode === 'saved'
      ? addresses?.find((a) => a.id === selectedAddressId)?.cep || ''
      : newAddress.cep
    setStep('shipping')
    fetchShipping(cep)
  }

  async function placeOrder() {
    if (!selectedShipping) { setError('Selecione uma forma de entrega.'); return }
    if (!isProfileComplete) { setError('Por favor, complete seu CPF e telefone no seu perfil antes de finalizar o pedido.'); return }
    setSubmitting(true); setError(null)
    try {
      let address_id: string | undefined
      let inlineAddress: Record<string, string> = {}
      if (selectedShipping.mode === 'shipping') {
        if (addressMode === 'saved' && selectedAddressId) {
          address_id = selectedAddressId
        } else {
          const created = await createAddress({ ...newAddress, is_default: (addresses || []).length === 0 } as any)
          address_id = created.id
        }
      }
      const order = await createOrder({
        items: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
        payment_method: paymentMethod,
        delivery: {
          mode: selectedShipping.mode,
          provider: selectedShipping.provider as any,
          service: selectedShipping.service,
          amount: selectedShipping.amount,
          eta_min_days: selectedShipping.eta_min_days,
          eta_max_days: selectedShipping.eta_max_days,
          address_id,
          ...inlineAddress,
        },
      })
      clear()

      // Inicia checkout do Mercado Pago e redireciona o navegador.
      // O MP volta pra /pedido/:id?payment=success|pending|failure via back_urls.
      try {
        const session = await startMercadoPagoCheckout(order.id)
        window.location.href = session.init_point
        return
      } catch (mpErr) {
        // Pedido foi criado mas o gateway falhou — leva pra confirmação com aviso.
        console.error('Falha ao iniciar Mercado Pago:', mpErr)
        nav(`/pedido/${order.id}?payment=error`, { replace: true })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const shippingAmount = selectedShipping?.amount ?? 0

  // Desconto PIX — calculado por linha usando o snapshot guardado no carrinho.
  // O servidor recomputa no checkout; aqui é só para exibir o total correto.
  const potentialPixDiscount = useMemo(() => {
    let total = 0
    for (const l of lines) {
      if (!l.pix_active) continue
      const lineSubtotal = l.unit_price * l.quantity
      if (l.pix_type === 'fixed_price') {
        const fp = Number(l.pix_price || 0)
        if (fp > 0 && fp < l.unit_price) total += (l.unit_price - fp) * l.quantity
      } else {
        const pct = Number(l.pix_percentage || 0)
        if (pct > 0) total += lineSubtotal * (pct / 100)
      }
    }
    return Math.max(0, Math.round(total * 100) / 100)
  }, [lines])

  const pixDiscount = paymentMethod === 'pix' ? potentialPixDiscount : 0
  const total = Math.max(0, subtotal + shippingAmount - pixDiscount)

  if (authLoading) {
    return (
      <div className="container-page py-20 flex justify-center">
        <Loader2 size={32} className="animate-spin text-neutral-300" />
      </div>
    )
  }

  // Guest no checkout — não navegamos automaticamente (causava tela travada);
  // mostramos uma página de bloqueio com botão claro pra entrar / cadastrar.
  if (!user) {
    return (
      <div className="container-page py-12 md:py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-mocha-100 flex items-center justify-center">
            <CreditCard size={22} className="text-mocha-700" />
          </div>
          <h1 className="mt-5 text-2xl md:text-3xl font-semibold tracking-tighter text-mocha-900">Pra finalizar, é só entrar</h1>
          <p className="mt-2 text-[15px] text-mocha-500 leading-relaxed">
            Seu carrinho com {lines.length} {lines.length === 1 ? 'item' : 'itens'} está salvo.<br />
            Crie sua conta em 10 segundos e continua daqui.
          </p>
          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={() => authModal.show('signup', {
                redirectTo: '/checkout',
                reason: 'Quase lá! Crie sua conta pra finalizar — seu carrinho continua salvo.',
              })}
              className="btn-primary !py-3.5 w-full"
            >
              Criar conta e continuar
            </button>
            <button
              onClick={() => authModal.show('signin', { redirectTo: '/checkout' })}
              className="rounded-full border border-mocha-200 py-3.5 text-[14px] font-medium hover:bg-mocha-50 active:scale-[0.99] transition w-full"
            >
              Já tenho conta — entrar
            </button>
            <button onClick={() => nav('/carrinho')} className="text-[13px] text-mocha-500 hover:text-mocha-900 mt-1 underline-offset-2 hover:underline">
              Voltar ao carrinho
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-8 md:py-12 grid lg:grid-cols-[1fr_420px] gap-10">
      <div>
        <Stepper current={step} onJump={(s) => {
          if (s === 'address') setStep('address')
          if (s === 'shipping' && currentAddress) setStep('shipping')
        }} />

        {!isProfileComplete && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 flex items-start gap-3">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Falta pouco!</p>
              <p className="text-sm text-red-700 mt-1">
                Para finalizar sua compra e emitirmos a nota fiscal, precisamos que você informe seu CPF e Telefone.
              </p>
              <button onClick={() => nav('/conta')} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition">
                Completar Cadastro
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className={`mt-8 ${!isProfileComplete ? 'opacity-50 pointer-events-none' : ''}`}>
          {step === 'address' && (
            <AddressStep
              customerName={customer?.name || ''}
              addresses={addresses}
              mode={addressMode}
              setMode={setAddressMode}
              selectedId={selectedAddressId}
              setSelectedId={setSelectedAddressId}
              newAddress={newAddress}
              setNewAddress={setNewAddress}
              onContinue={gotoShipping}
            />
          )}
          {step === 'shipping' && (
            <ShippingStep
              loading={shippingLoading}
              options={shippingOptions}
              localEligible={localEligible}
              selected={selectedShipping}
              onSelect={setSelectedShipping}
              onBack={() => setStep('address')}
              onContinue={() => { if (selectedShipping) setStep('payment') }}
            />
          )}
          {step === 'payment' && (
            <PaymentStep
              method={paymentMethod}
              setMethod={setPaymentMethod}
              onBack={() => setStep('shipping')}
              onContinue={() => setStep('review')}
              pixDiscount={potentialPixDiscount}
            />
          )}
          {step === 'review' && (
            <ReviewStep
              submitting={submitting}
              address={currentAddress}
              shipping={selectedShipping}
              method={paymentMethod}
              onBack={() => setStep('payment')}
              onConfirm={placeOrder}
            />
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <OrderSummary lines={lines} subtotal={subtotal} shipping={shippingAmount} total={total} shippingLabel={selectedShipping?.service} pixDiscount={pixDiscount} />
      </aside>
    </div>
  )
}

function Stepper({ current, onJump }: { current: Step; onJump: (s: Step) => void }) {
  const idx = STEPS.findIndex((s) => s.key === current)
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {STEPS.map((s, i) => {
        const active = i === idx
        const done = i < idx
        return (
          <li key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => done && onJump(s.key)}
              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2.5 text-[11px] font-medium transition ${
                active ? 'bg-ink text-paper'
                : done ? 'bg-neutral-200 text-ink' : 'bg-neutral-100 text-neutral-500'
              }`}
            >{done ? <Check size={12} /> : i + 1}</button>
            <span className={active ? 'text-ink font-medium' : 'text-neutral-500'}>{s.label}</span>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-neutral-300" />}
          </li>
        )
      })}
    </ol>
  )
}

function AddressStep(props: {
  customerName: string
  addresses: ShopperAddress[] | null
  mode: 'saved' | 'new'; setMode: (m: 'saved' | 'new') => void
  selectedId: string | null; setSelectedId: (id: string | null) => void
  newAddress: any; setNewAddress: (a: any) => void
  onContinue: () => void
}) {
  const { addresses, mode, setMode, selectedId, setSelectedId, newAddress, setNewAddress, onContinue, customerName } = props
  const hasSaved = addresses && addresses.length > 0
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tighter">Para onde enviamos?</h2>
      <p className="mt-1 text-sm text-neutral-500">Olá, {customerName.split(' ')[0]}. Selecione um endereço ou cadastre um novo.</p>

      {hasSaved && (
        <div className="mt-6 inline-flex rounded-full border border-neutral-200 p-1">
          <button onClick={() => setMode('saved')} className={`px-4 py-1.5 text-sm rounded-full transition ${mode === 'saved' ? 'bg-ink text-paper' : 'text-neutral-600'}`}>Salvos</button>
          <button onClick={() => setMode('new')} className={`px-4 py-1.5 text-sm rounded-full transition ${mode === 'new' ? 'bg-ink text-paper' : 'text-neutral-600'}`}>Novo</button>
        </div>
      )}

      {mode === 'saved' && hasSaved && (
        <div className="mt-6 grid gap-3">
          {addresses!.map((a) => {
            const active = a.id === selectedId
            return (
              <button key={a.id} onClick={() => setSelectedId(a.id)}
                className={`text-left rounded-2xl border p-5 transition ${active ? 'border-ink shadow-soft' : 'border-neutral-200 hover:border-neutral-400'}`}>
                <div className="flex items-start justify-between">
                  <p className="text-[15px] font-medium">{a.label || a.recipient}</p>
                  {a.is_default && <span className="chip">Padrão</span>}
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {a.street}, {a.number}{a.complement ? ` · ${a.complement}` : ''}<br />
                  {a.district} · {a.city}/{a.state} · {formatCep(a.cep)}
                </p>
              </button>
            )
          })}
        </div>
      )}

      {(mode === 'new' || !hasSaved) && (
        <NewAddressForm newAddress={newAddress} setNewAddress={setNewAddress} />
      )}

      <div className="mt-8 flex justify-end">
        <button onClick={onContinue} className="btn-primary">Continuar para entrega</button>
      </div>
    </section>
  )
}

function ShippingStep({ loading, options, localEligible, selected, onSelect, onBack, onContinue }: {
  loading: boolean; options: ShippingOption[] | null; localEligible: boolean
  selected: ShippingOption | null; onSelect: (o: ShippingOption) => void
  onBack: () => void; onContinue: () => void
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tighter">Como você quer receber?</h2>
      <p className="mt-1 text-sm text-neutral-500">
        {localEligible
          ? 'Detectamos que você está na nossa área de entrega rápida em Fortaleza.'
          : 'Confira as opções de envio para o seu endereço.'}
      </p>

      <div className="mt-6 space-y-3">
        {loading && (
          <div className="rounded-2xl border border-neutral-100 p-6 flex items-center gap-3 text-neutral-500">
            <Loader2 size={16} className="animate-spin" /> Calculando entrega…
          </div>
        )}
        {!loading && (options || []).map((o, i) => {
          const Icon = o.mode === 'pickup' ? Store : o.provider === 'local' ? Zap : Truck
          const active = selected && selected.provider === o.provider && selected.service === o.service
          return (
            <button key={i} onClick={() => onSelect(o)}
              className={`w-full text-left rounded-2xl border p-5 transition flex gap-4 items-start ${active ? 'border-ink shadow-soft' : 'border-neutral-200 hover:border-neutral-400'}`}>
              <div className={`mt-0.5 rounded-full p-2.5 ${active ? 'bg-ink text-paper' : 'bg-neutral-100 text-ink'}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-medium">{o.service}</p>
                  <p className="text-[15px] font-semibold">{o.amount === 0 ? 'Grátis' : formatMoney(o.amount)}</p>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {etaLabel(o.eta_min_days, o.eta_max_days)}{o.notes ? ` · ${o.notes}` : ''}
                </p>
              </div>
            </button>
          )
        })}
        {!loading && options && options.length === 0 && (
          <div className="rounded-2xl border border-neutral-100 p-6 text-neutral-500 text-sm">
            Não encontramos opções de entrega para esse CEP. Tente outro endereço.
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="btn-ghost">Voltar</button>
        <button onClick={onContinue} disabled={!selected} className="btn-primary">Continuar para pagamento</button>
      </div>
    </section>
  )
}

function PaymentStep({ method, setMethod, onBack, onContinue, pixDiscount = 0 }: {
  method: 'pix' | 'card' | 'boleto'; setMethod: (m: any) => void
  onBack: () => void; onContinue: () => void; pixDiscount?: number
}) {
  const pixSub = pixDiscount > 0
    ? `Aprovação imediata · você economiza ${formatMoney(pixDiscount)}`
    : 'Aprovação imediata · 5% off em produtos selecionados'
  const methods = [
    { value: 'pix',    label: 'PIX',       sub: pixSub, icon: QrCode },
    { value: 'card',   label: 'Cartão',    sub: 'Crédito ou débito · em até 6x',         icon: CreditCard },
    { value: 'boleto', label: 'Boleto',    sub: 'Compensa em até 2 dias úteis',          icon: FileText },
  ] as const
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tighter">Como você quer pagar?</h2>
      <p className="mt-1 text-sm text-neutral-500">A integração com gateway será conectada em breve — seu pedido será registrado e nossa equipe entra em contato para a cobrança.</p>
      <div className="mt-6 grid gap-3">
        {methods.map(({ value, label, sub, icon: Icon }) => {
          const active = method === value
          return (
            <button key={value} onClick={() => setMethod(value)}
              className={`w-full text-left rounded-2xl border p-5 transition flex items-center gap-4 ${active ? 'border-ink shadow-soft' : 'border-neutral-200 hover:border-neutral-400'}`}>
              <div className={`rounded-full p-2.5 ${active ? 'bg-ink text-paper' : 'bg-neutral-100 text-ink'}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium">{label}</p>
                <p className="text-xs text-neutral-500 mt-1">{sub}</p>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="btn-ghost">Voltar</button>
        <button onClick={onContinue} className="btn-primary">Revisar pedido</button>
      </div>
    </section>
  )
}

function ReviewStep({ submitting, address, shipping, method, onBack, onConfirm }: any) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tighter">Tudo certo?</h2>
      <p className="mt-1 text-sm text-neutral-500">Revise os detalhes antes de finalizar.</p>
      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl border border-neutral-100 p-5">
          <p className="label-eyebrow">Entrega</p>
          {shipping?.mode === 'pickup' ? (
            <p className="mt-2 text-sm text-neutral-700">
              <strong>Retirada na loja</strong> · Rua Martins de Carvalho, 3885 · Bom Jardim · Fortaleza/CE
            </p>
          ) : (
            address && (
              <p className="mt-2 text-sm text-neutral-700">
                <strong>{address.recipient}</strong><br />
                {address.street}, {address.number}{address.complement ? ` · ${address.complement}` : ''}<br />
                {address.district} · {address.city}/{address.state} · {formatCep(address.cep)}
              </p>
            )
          )}
          {shipping && (
            <p className="mt-3 text-sm text-neutral-500">
              {shipping.service} · {etaLabel(shipping.eta_min_days, shipping.eta_max_days)}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-neutral-100 p-5">
          <p className="label-eyebrow">Pagamento</p>
          <p className="mt-2 text-sm text-neutral-700 capitalize">{method}</p>
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="btn-ghost" disabled={submitting}>Voltar</button>
        <button onClick={onConfirm} disabled={submitting} className="btn-primary">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Confirmar pedido
        </button>
      </div>
    </section>
  )
}

function OrderSummary({ lines, subtotal, shipping, total, shippingLabel, pixDiscount = 0 }: {
  lines: any[]; subtotal: number; shipping: number; total: number; shippingLabel?: string; pixDiscount?: number
}) {
  return (
    <div className="rounded-3xl border border-neutral-100 p-6">
      <p className="label-eyebrow">Resumo</p>
      <ul className="mt-4 space-y-4 max-h-[40vh] overflow-y-auto pr-1">
        {lines.map((l) => (
          <li key={l.variant_id} className="flex gap-3">
            <div className="h-16 w-14 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
              {l.image_url ? <img src={l.image_url} alt={l.product_name} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{l.product_name}</p>
              <p className="text-xs text-neutral-500">{[l.color, l.size].filter(Boolean).join(' · ')} · {l.quantity}x</p>
            </div>
            <p className="text-sm font-medium whitespace-nowrap">{formatMoney(l.unit_price * l.quantity)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(subtotal)} />
        <Row label={shippingLabel ? `Frete · ${shippingLabel}` : 'Frete'} value={shipping === 0 ? 'Grátis' : formatMoney(shipping)} />
        {pixDiscount > 0 && (
          <div className="flex items-baseline justify-between">
            <span className="text-emerald-600">Desconto PIX</span>
            <span className="text-emerald-600 font-medium">− {formatMoney(pixDiscount)}</span>
          </div>
        )}
      </div>
      <div className="mt-4 border-t border-neutral-100 pt-4 flex items-baseline justify-between">
        <span className="text-sm text-neutral-500">Total</span>
        <span className="text-xl font-semibold tracking-tight">{formatMoney(total)}</span>
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
        <MapPin size={12} /> Atelier em Bom Jardim · Fortaleza/CE
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}

/** Form de novo endereço — CEP primeiro, auto-completa via ViaCEP.
 *  Padrão Shopee/Mercado Livre: você digita o CEP e os campos vêm prontos;
 *  só precisa preencher número, complemento e nome de quem recebe. */
function NewAddressForm({ newAddress, setNewAddress }: {
  newAddress: any; setNewAddress: (a: any) => void
}) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepFilled, setCepFilled] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  async function onCepBlurOrTyped(raw: string) {
    const clean = cleanCep(raw)
    setNewAddress({ ...newAddress, cep: clean })
    setCepFilled(false); setCepError(null)
    if (clean.length !== 8) return
    setCepLoading(true)
    const result = await lookupCep(clean)
    setCepLoading(false)
    if (!result) { setCepError('CEP não encontrado. Você pode preencher manualmente.'); return }
    setNewAddress({
      ...newAddress,
      cep: clean,
      street: result.street || newAddress.street,
      district: result.district || newAddress.district,
      city: result.city || newAddress.city,
      state: result.state || newAddress.state,
    })
    setCepFilled(true)
  }

  return (
    <div className="mt-6 space-y-3">
      {/* Bloco do CEP — em destaque, é o gatilho do fluxo */}
      <div className="rounded-2xl border border-neutral-200 p-4 bg-neutral-50/50">
        <label className="text-[11px] uppercase tracking-wider text-neutral-500">CEP do destino</label>
        <div className="mt-1.5 relative">
          <input
            inputMode="numeric" autoComplete="postal-code"
            className="input-field !pl-3 !pr-10 text-[16px] tracking-wide font-medium"
            placeholder="00000-000"
            value={formatCep(newAddress.cep)}
            onChange={(e) => onCepBlurOrTyped(e.target.value)}
            maxLength={9}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {cepLoading && <Loader2 size={16} className="animate-spin text-neutral-400" />}
            {!cepLoading && cepFilled && <Check size={16} className="text-emerald-600" />}
          </div>
        </div>
        {cepError && <p className="mt-2 text-xs text-amber-700">{cepError}</p>}
        {!cepError && !newAddress.cep && (
          <p className="mt-2 text-xs text-neutral-500">A gente preenche o resto pra você.</p>
        )}
        <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-neutral-500 underline-offset-2 hover:underline">Não sei meu CEP</a>
      </div>

      {/* Campos restantes — só aparecem com o CEP preenchido (ou erro/manual) */}
      {(cepFilled || cepError || (newAddress.street && newAddress.city)) && (
        <>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <input className="input-field" placeholder="Rua / Avenida" autoComplete="address-line1"
              value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} />
            <input className="input-field" inputMode="numeric" placeholder="Número" autoFocus={cepFilled} autoComplete="address-line2"
              value={newAddress.number} onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })} />
          </div>
          <input className="input-field" placeholder="Complemento (apto, bloco) — opcional"
            value={newAddress.complement || ''} onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })} />
          <div className="grid grid-cols-[1fr_1fr_72px] gap-3">
            <input className="input-field" placeholder="Bairro" autoComplete="address-level2"
              value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })} />
            <input className="input-field" placeholder="Cidade" autoComplete="address-level2"
              value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
            <input className="input-field text-center" placeholder="UF" maxLength={2} autoComplete="address-level1"
              value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" placeholder="Quem recebe" autoComplete="name"
              value={newAddress.recipient} onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })} />
            <input className="input-field" inputMode="tel" autoComplete="tel" placeholder="Telefone"
              value={newAddress.phone || ''} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
          </div>
          <input className="input-field" placeholder='Apelido — "Casa", "Trabalho" (opcional)'
            value={newAddress.label || ''} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
        </>
      )}
    </div>
  )
}

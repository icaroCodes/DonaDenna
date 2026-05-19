import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2, Star, Loader2, Check } from 'lucide-react'
import { createAddress, deleteAddress, listAddresses, updateAddress } from '@/services/api'
import type { ShopperAddress } from '@/types/catalog'
import { cleanCep, formatCep, lookupCep } from '@/lib/format'

const EMPTY = {
  label: '', recipient: '', cep: '', street: '', number: '',
  complement: '', district: '', city: '', state: '', phone: '',
}

export default function AddressesPage() {
  const [list, setList] = useState<ShopperAddress[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepFilled, setCepFilled] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  async function onCep(raw: string) {
    const clean = cleanCep(raw)
    setForm((f) => ({ ...f, cep: clean }))
    setCepFilled(false); setCepError(null)
    if (clean.length !== 8) return
    setCepLoading(true)
    const r = await lookupCep(clean)
    setCepLoading(false)
    if (!r) { setCepError('CEP não encontrado — preencha manualmente.'); return }
    setForm((f) => ({
      ...f, cep: clean,
      street: r.street || f.street, district: r.district || f.district,
      city: r.city || f.city, state: r.state || f.state,
    }))
    setCepFilled(true)
  }

  async function reload() {
    setList(null)
    const a = await listAddresses(); setList(a)
  }
  useEffect(() => { reload() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      await createAddress({ ...form, is_default: (list || []).length === 0 } as any)
      setForm({ ...EMPTY }); setAdding(false); await reload()
    } finally { setSaving(false) }
  }

  async function setDefault(id: string) {
    await updateAddress(id, { is_default: true } as any); await reload()
  }
  async function remove(id: string) {
    if (!confirm('Remover este endereço?')) return
    await deleteAddress(id); await reload()
  }

  if (list === null) return <div className="text-sm text-neutral-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando…</div>

  return (
    <div className="space-y-4">
      {list.length === 0 && !adding && (
        <div className="rounded-3xl border border-neutral-100 p-12 text-center">
          <MapPin size={28} className="mx-auto text-neutral-300" />
          <p className="mt-4 text-[15px] font-medium">Você ainda não tem endereços salvos</p>
          <button onClick={() => setAdding(true)} className="btn-primary mt-6">Adicionar endereço</button>
        </div>
      )}

      {list.map((a) => (
        <div key={a.id} className="rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-medium">{a.label || a.recipient}</p>
                {a.is_default && <span className="chip"><Star size={11} /> Padrão</span>}
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {a.street}, {a.number}{a.complement ? ` · ${a.complement}` : ''}<br />
                {a.district} · {a.city}/{a.state} · {formatCep(a.cep)}
              </p>
            </div>
            <div className="flex gap-1">
              {!a.is_default && (
                <button onClick={() => setDefault(a.id)} className="rounded-full p-2 hover:bg-neutral-100" title="Tornar padrão"><Star size={14} /></button>
              )}
              <button onClick={() => remove(a.id)} className="rounded-full p-2 hover:bg-neutral-100" title="Remover"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}

      {(adding || list.length > 0) && !adding && (
        <button onClick={() => setAdding(true)} className="btn-ghost"><Plus size={14} /> Adicionar endereço</button>
      )}

      {adding && (
        <form onSubmit={save} className="rounded-3xl border border-neutral-100 p-6 space-y-3">
          {/* Bloco CEP em destaque */}
          <div className="rounded-2xl border border-neutral-200 p-4 bg-neutral-50/50">
            <label className="text-[11px] uppercase tracking-wider text-neutral-500">CEP</label>
            <div className="mt-1.5 relative">
              <input required inputMode="numeric" autoComplete="postal-code" maxLength={9}
                className="input-field !pl-3 !pr-10 text-[16px] tracking-wide font-medium"
                placeholder="00000-000"
                value={formatCep(form.cep)} onChange={(e) => onCep(e.target.value)} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {cepLoading && <Loader2 size={16} className="animate-spin text-neutral-400" />}
                {!cepLoading && cepFilled && <Check size={16} className="text-emerald-600" />}
              </div>
            </div>
            {cepError && <p className="mt-2 text-xs text-amber-700">{cepError}</p>}
            {!form.cep && <p className="mt-2 text-xs text-neutral-500">A gente preenche o resto pra você.</p>}
          </div>

          {(cepFilled || cepError || form.street) && (
            <>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <input required className="input-field" placeholder="Rua / Avenida" autoComplete="address-line1"
                  value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                <input required inputMode="numeric" className="input-field" placeholder="Número" autoFocus={cepFilled}
                  value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </div>
              <input className="input-field" placeholder="Complemento (apto, bloco) — opcional"
                value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
              <div className="grid grid-cols-[1fr_1fr_72px] gap-3">
                <input required className="input-field" placeholder="Bairro"
                  value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                <input required className="input-field" placeholder="Cidade"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <input required className="input-field text-center" placeholder="UF" maxLength={2}
                  value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required className="input-field" placeholder="Quem recebe" autoComplete="name"
                  value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
                <input className="input-field" inputMode="tel" autoComplete="tel" placeholder="Telefone"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <input className="input-field" placeholder='Apelido — "Casa", "Trabalho" (opcional)'
                value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost">Cancelar</button>
            <button disabled={saving} className="btn-primary">{saving && <Loader2 size={14} className="animate-spin" />} Salvar</button>
          </div>
        </form>
      )}
    </div>
  )
}

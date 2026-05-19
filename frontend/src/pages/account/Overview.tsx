import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, MapPin, Heart, ArrowUpRight, Loader2, Edit2, Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { updateMe } from '@/services/api'

export default function AccountOverview() {
  const { customer, user, refresh } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    cpf: customer?.cpf || '',
  })
  const [error, setError] = useState<string | null>(null)

  const isComplete = Boolean(customer?.cpf && customer?.phone && customer?.name)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.cpf) {
      setError('Todos os campos são obrigatórios.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await updateMe(form)
      await refresh()
      setEditing(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!isComplete && !editing && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex justify-between items-start">
          <div>
            <p className="font-semibold">Cadastro Incompleto</p>
            <p className="mt-1">Para realizar compras, você precisa completar seu CPF e Telefone.</p>
          </div>
          <button onClick={() => setEditing(true)} className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-medium hover:bg-red-700 transition">
            Completar agora
          </button>
        </div>
      )}

      <section className="rounded-3xl border border-neutral-100 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <p className="label-eyebrow">Seus dados</p>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-neutral-500 hover:text-ink flex items-center gap-1 transition">
              <Edit2 size={12} /> Editar
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-neutral-500 mb-1">Nome completo</label>
              <input 
                className="input-field" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-neutral-500 mb-1">E-mail (Login)</label>
              <input className="input-field bg-neutral-50 text-neutral-500 cursor-not-allowed" value={user?.email || ''} readOnly />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-neutral-500 mb-1">Telefone / WhatsApp</label>
              <input 
                className="input-field" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-neutral-500 mb-1">CPF</label>
              <input 
                className="input-field" 
                value={form.cpf} 
                onChange={e => setForm({...form, cpf: e.target.value})} 
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2 mt-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost py-2">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary py-2 px-6">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Salvar
              </button>
            </div>
          </form>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Row label="Nome"     value={customer?.name || '—'} />
            <Row label="E-mail"   value={user?.email || '—'} />
            <Row label="Telefone" value={customer?.phone || '—'} />
            <Row label="CPF"      value={customer?.cpf || '—'} />
          </div>
        )}
      </section>
      <div className="grid sm:grid-cols-3 gap-3">
        <ShortcutCard to="/conta/pedidos"   icon={Package} title="Pedidos"  desc="Acompanhe e veja o histórico" />
        <ShortcutCard to="/conta/enderecos" icon={MapPin}  title="Endereços" desc="Gerencie locais de entrega" />
        <ShortcutCard to="/conta/favoritos" icon={Heart}   title="Favoritos" desc="Suas peças salvas" />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-0.5 text-ink">{value}</p>
    </div>
  )
}

function ShortcutCard({ to, icon: Icon, title, desc }: any) {
  return (
    <Link to={to} className="group rounded-3xl border border-neutral-100 p-6 hover:border-ink transition">
      <div className="flex items-center justify-between">
        <Icon size={18} />
        <ArrowUpRight size={16} className="text-neutral-300 group-hover:text-ink group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
      </div>
      <p className="mt-6 text-[15px] font-medium">{title}</p>
      <p className="mt-1 text-xs text-neutral-500">{desc}</p>
    </Link>
  )
}

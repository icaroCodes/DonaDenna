export function formatMoney(value: number | null | undefined) {
  const n = Number(value) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatCep(cep: string) {
  const n = String(cep || '').replace(/\D/g, '').slice(0, 8)
  if (n.length <= 5) return n
  return `${n.slice(0, 5)}-${n.slice(5)}`
}

export function cleanCep(cep: string) {
  return String(cep || '').replace(/\D/g, '')
}

export function etaLabel(min?: number | null, max?: number | null) {
  if (min == null && max == null) return ''
  if (min === 0 && (max == null || max <= 1)) return 'Hoje ou amanhã'
  if (min === max) return `${min} ${min === 1 ? 'dia útil' : 'dias úteis'}`
  return `${min}–${max} dias úteis`
}

// Consulta o ViaCEP (https://viacep.com.br) e devolve o endereço — null se inválido.
// Não bloqueia: timeout curto e silencioso pra não atrapalhar a digitação.
export async function lookupCep(cep: string, signal?: AbortSignal): Promise<{
  street: string; district: string; city: string; state: string; cep: string
} | null> {
  const clean = cleanCep(cep)
  if (clean.length !== 8) return null
  try {
    const ctl = signal || new AbortController().signal
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { signal: ctl })
    if (!r.ok) return null
    const d = await r.json()
    if (d?.erro) return null
    return {
      street: d.logradouro || '',
      district: d.bairro || '',
      city: d.localidade || '',
      state: (d.uf || '').toUpperCase(),
      cep: clean,
    }
  } catch { return null }
}

export function formatPhone(p?: string | null) {
  if (!p) return ''
  const n = p.replace(/\D/g, '')
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return p
}

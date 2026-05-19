import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error(
    '[Supabase] VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY ausentes. ' +
    'Configure no painel do Vercel (Settings → Environment Variables).',
  )
}

// Fallback para placeholders evita que createClient lance no module-load
// e derrube o app inteiro com tela branca quando as env vars não estão setadas.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)

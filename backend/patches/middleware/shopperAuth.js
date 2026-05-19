// ============================================================================
// shopperAuth.js — middleware de autenticação para o e-commerce.
//
// Diferente de middleware/auth.js (admin), este aceita QUALQUER usuário
// autenticado no Supabase. NÃO aplica allowlist de admin.
//
// Garante:
//   - req.user            (objeto user do Supabase Auth)
//   - req.customer        (row da tabela customers, criando se for o 1º login)
//
// Em rotas que não exigem login (catálogo público) NÃO use este middleware.
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function shopperAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'É necessário estar logado.' });
  }
  const token = header.slice(7);

  let userData;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }
    userData = data.user;
  } catch (err) {
    console.error('[shopperAuth] getUser falhou:', err?.message);
    return res.status(503).json({ error: 'Servidor de autenticação indisponível.' });
  }

  // Garante row em customers vinculada ao auth_user_id (sem tocar nos
  // clientes antigos do ERP que continuam com auth_user_id NULL).
  let customer;
  {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', userData.id)
      .maybeSingle();
    if (error) {
      console.error('[shopperAuth] lookup customer:', error.message);
      return res.status(500).json({ error: 'Erro ao carregar seus dados.' });
    }
    customer = data;
  }

  if (!customer) {
    const meta = userData.user_metadata || {};
    const fallbackName = meta.full_name || meta.name || (userData.email || '').split('@')[0] || 'Cliente';
    const { data: created, error: createErr } = await supabase
      .from('customers')
      .insert({
        auth_user_id: userData.id,
        name: fallbackName,
        email: userData.email || null,
        phone: meta.phone || null,
      })
      .select()
      .single();
    if (createErr) {
      console.error('[shopperAuth] criar customer:', createErr.message);
      return res.status(500).json({ error: 'Erro ao registrar sua conta.' });
    }
    customer = created;
  }

  req.user = userData;
  req.customer = customer;
  next();
}

module.exports = shopperAuth;

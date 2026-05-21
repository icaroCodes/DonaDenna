# SERVER_PATCH — como aplicar os patches no `sistema_donadenna/backend/`

Os arquivos em `backend/patches/` espelham o que vai pro backend do ERP.
Copie-os pros caminhos correspondentes em `../sistema_donadenna/backend/`.

## Arquivos a copiar

```
backend/patches/lib/saleEngine.js              → backend/lib/saleEngine.js
backend/patches/lib/categories.js              → backend/lib/categories.js
backend/patches/lib/mercadoPago.js             → backend/lib/mercadoPago.js  (NOVO)
backend/patches/lib/shipping/**                → backend/lib/shipping/**
backend/patches/middleware/shopperAuth.js      → backend/middleware/shopperAuth.js
backend/patches/routes/storefront.js           → backend/routes/storefront.js
backend/patches/routes/shopper.js              → backend/routes/shopper.js
backend/patches/routes/orders.js               → backend/routes/orders.js
backend/patches/routes/paymentsWebhook.js      → backend/routes/paymentsWebhook.js  (NOVO)
```

## Edição em `backend/server.js`

Antes de `app.use(requireAuth)` (e DEPOIS do `app.use(cors(...))` /
`app.use(express.json(...))`), adicione:

```js
// E-commerce — rotas públicas
app.use('/storefront', require('./routes/storefront'));

// Mercado Pago — webhook público (HMAC interno valida origem)
app.use('/webhooks', require('./routes/paymentsWebhook'));

// E-commerce — rotas autenticadas via shopperAuth (JWT do Supabase Auth)
const shopperAuth = require('./middleware/shopperAuth');
app.use('/shopper', shopperAuth, require('./routes/shopper'));
app.use('/orders',  shopperAuth, require('./routes/orders'));
```

## Env vars necessárias (`backend/.env`)

```env
# Supabase (já existentes)
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
FRONTEND_URL=*

# Mercado Pago — Checkout Pro
MP_ACCESS_TOKEN=APP_USR-...          # token PRIVADO da aplicação (backend only)
MP_PUBLIC_KEY=APP_USR-...            # informativo (Checkout Pro não usa no back)
MP_WEBHOOK_SECRET=                   # opcional: configure no painel MP → Webhooks
PUBLIC_BACKEND_URL=https://api.donadenna.com   # URL pública do back (pro webhook)
PUBLIC_FRONTEND_URL=https://loja.donadenna.com # URL pública do front (back_urls)
```

> ⚠️ **Chaves `APP_USR-` são de PRODUÇÃO** — movimentam dinheiro real. Pra
> desenvolvimento, gere chaves `TEST-...` em
> [Mercado Pago → Suas integrações](https://www.mercadopago.com.br/developers/panel/app)
> e use cartões de teste (ex: `5031 7557 3453 0604`).

## Webhook em DEV local

O Mercado Pago precisa **acessar publicamente** sua URL pra mandar a
notificação. Em dev:

```powershell
# Em outro terminal:
npx ngrok http 3001

# Pega a URL HTTPS gerada (ex: https://abc123.ngrok-free.app) e coloca em:
PUBLIC_BACKEND_URL=https://abc123.ngrok-free.app
```

Depois cadastre essa URL no painel do MP:
**Suas integrações → sua app → Webhooks → URL de produção (ou de testes)**
- URL: `https://abc123.ngrok-free.app/webhooks/mercadopago`
- Eventos: marque **"Pagamentos"**
- Copie o **Segredo** gerado e cole em `MP_WEBHOOK_SECRET`

## Dependências

Nenhuma nova! O helper usa `fetch` global (Node 18+) e `crypto` built-in.

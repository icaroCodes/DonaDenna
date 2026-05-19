# DonaDenna — E-commerce

E-commerce premium da DonaDenna. **Não é um sistema separado** — reutiliza
o mesmo banco, mesmas tabelas e mesma lógica de negócio do ERP
(`sistema_donadenna`).

Documentos importantes:
- [`context.md`](./context.md) — regras de negócio da DonaDenna.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — auditoria do ERP + arquitetura do e-commerce.
- [`backend/patches/SERVER_PATCH.md`](./backend/patches/SERVER_PATCH.md) — instruções para aplicar os patches no backend do ERP.

## Estrutura

```
ecommerce_donadenna/
├─ context.md                       (regras de negócio)
├─ ARCHITECTURE.md                  (auditoria + design)
├─ backend/patches/                 (patches a aplicar em sistema_donadenna)
│  ├─ migrations/001_ecommerce_schema.sql
│  ├─ middleware/shopperAuth.js
│  ├─ lib/saleEngine.js
│  ├─ lib/categories.js
│  ├─ lib/shipping/
│  ├─ routes/storefront.js
│  ├─ routes/orders.js
│  ├─ routes/shopper.js
│  └─ SERVER_PATCH.md
└─ frontend/                        (Vite + React + TS + Tailwind + Framer Motion)
   ├─ src/
   │  ├─ pages/                    (Home, Catalog, Product, Checkout, …)
   │  ├─ pages/account/            (Overview, Orders, Addresses, Favorites)
   │  ├─ components/                (Header, Footer, CartDrawer, AuthModal, MobileNav, product/)
   │  ├─ contexts/                  (Auth, Cart, AuthModal)
   │  ├─ services/                  (supabase, api)
   │  ├─ lib/                       (format, product helpers)
   │  ├─ layouts/PublicLayout.tsx
   │  └─ routes/router.tsx
   └─ ...
```

## Setup inicial (uma vez)

1. Rodar `backend/patches/migrations/001_ecommerce_schema.sql` no Supabase.
2. Copiar arquivos de `backend/patches/` para `sistema_donadenna/backend/`
   (veja [SERVER_PATCH.md](backend/patches/SERVER_PATCH.md)).
3. Editar `sistema_donadenna/backend/server.js` adicionando 3 linhas antes
   de `app.use(requireAuth)`:
   ```js
   app.use('/storefront', require('./routes/storefront'));
   const shopperAuth = require('./middleware/shopperAuth');
   app.use('/shopper', shopperAuth, require('./routes/shopper'));
   app.use('/orders',  shopperAuth, require('./routes/orders'));
   ```

## Como rodar — comandos na RAIZ do projeto

Da raiz `c:\Users\User\Downloads\ecommerce_donadenna`:

```powershell
npm run install:all   # instala deps da raiz + backend (ERP) + frontend
npm run dev           # roda backend (porta 3001) + frontend (porta 5174) em paralelo
```

`install:all` instala em três lugares:
- `./` (orquestrador, usa `concurrently`)
- `../sistema_donadenna/backend` (backend do ERP — mesmo processo serve o e-commerce)
- `./frontend` (loja online)

`npm run dev` levanta:
- Backend ERP em `http://localhost:3001`
- E-commerce em `http://localhost:5174`

Os logs ficam coloridos por serviço (`backend` em azul, `frontend` em magenta).

## Atelier / base logística

```
DonaDenna
Rua Martins de Carvalho, 3885 — Granja Lisboa
Fortaleza · CE · Brasil
CEP 60540-184
```

## Garantias arquiteturais

- ✅ Allowlist admin do ERP **intacta**.
- ✅ Vendas online passam pelo mesmo `saleEngine` que o POS — estoque,
  movimentos e financeiro idênticos.
- ✅ Clientes ERP antigos (sem `auth_user_id`) **não são tocados**.
- ✅ Frete híbrido (local rápido + nacional + retirada) via providers
  desacoplados — pronto para Uber Flash / Correios / Melhor Envio.
- ✅ Pagamento, analytics e notificações preparados como interfaces —
  integração real fica para depois sem refatorar.

## Próximos passos (após aprovação)

1. Aplicar patches no ERP e rodar a migration.
2. Rodar o frontend e testar fluxo: catálogo → produto → carrinho → auth →
   checkout → pedido criado no ERP.
3. Conectar gateway PIX real, GA4/Pixel, notificações WhatsApp e tracking
   real de fretes.
4. Substituir banners/imagens placeholder da Home por arte da coleção.

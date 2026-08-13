# Área de Membros

Área de membros para infoprodutos (manuais em PDF + ferramentas de assistência técnica), com login por e-mail (sem senha) e liberação de acesso via compra na Wiapy.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** (Postgres + Storage) — dados de clientes, produtos, compras, entitlements e as ferramentas (OS, financeiro, orçamento/garantia)
- **Vercel Blob** (store privado) — hospedagem do PDF do manual
- Sessão própria por cookie httpOnly (não usa Supabase Auth)

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Onde conseguir |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (segredo, nunca expor ao client) |
| `SESSION_SECRET` | Gerar com `openssl rand -hex 32` (ou equivalente) |
| `WIAPY_WEBHOOK_SECRET` | Painel da Wiapy (webhook do produto) |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob store (privado) |

Essas mesmas variáveis precisam ser configuradas no projeto da Vercel (Settings → Environment Variables) para o deploy funcionar — nenhuma delas é commitada no repositório.

## Deploy

Importe o repositório na [Vercel](https://vercel.com/new), configure as variáveis de ambiente acima e faça o deploy. O framework é detectado automaticamente (Next.js).

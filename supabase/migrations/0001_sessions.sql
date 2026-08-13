-- O schema de comércio (customers, products, purchases, entitlements,
-- purchase_items) já existe no projeto Supabase e é gerenciado fora deste
-- repositório (integração Wiapy). Esta migration só acrescenta a peça que
-- falta para o login por e-mail (sem senha) da área de membros.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_customer_id_idx on sessions(customer_id);

alter table sessions enable row level security;

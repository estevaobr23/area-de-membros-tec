-- Banco de peças da calculadora: custos de peças salvos por cliente para reuso.
-- Aplicada no projeto remoto via MCP em 2026-08-13 (migration "create_saved_parts").
create table if not exists public.saved_parts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  cost numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, name)
);

comment on table public.saved_parts is 'Banco de peças da calculadora: custos de peças salvos por cliente para reuso';

create index if not exists saved_parts_customer_idx on public.saved_parts(customer_id);

alter table public.saved_parts enable row level security;

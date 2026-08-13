-- Progresso de leitura do manual em PDF (leitor embutido na área de membros).
-- Aplicada no projeto remoto via MCP em 2026-08-12 (migration "add_reading_progress").
create table reading_progress (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  last_page int not null default 1,
  num_pages int,
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);
create index reading_progress_customer_idx on reading_progress(customer_id);
alter table reading_progress enable row level security;

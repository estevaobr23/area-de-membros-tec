-- Ferramentas da área de membros (OS, calculadora, financeiro, orçamento/garantia).
-- Aplicada no projeto remoto via MCP em 2026-08-12 (migration "tools_schema").
-- Todas as tabelas pertencem ao técnico logado (customer_id) — isolamento por dono.
-- Acesso sempre via service role no servidor; RLS ligado sem policies (defesa em profundidade).

-- Clientes da assistência (NÃO são os customers compradores da plataforma)
create table service_clients (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index service_clients_customer_idx on service_clients(customer_id);

-- Aparelhos dos clientes da assistência
create table devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  service_client_id uuid not null references service_clients(id) on delete cascade,
  brand text not null,
  model text not null,
  color text,
  imei text,
  accessories text,
  condition text,
  notes text,
  created_at timestamptz not null default now()
);
create index devices_customer_idx on devices(customer_id);
create index devices_client_idx on devices(service_client_id);

-- Ordens de serviço
create table service_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  os_number int not null,
  service_client_id uuid not null references service_clients(id) on delete restrict,
  device_id uuid not null references devices(id) on delete restrict,
  reported_defect text not null,
  diagnosis text,
  service_performed text,
  parts jsonb not null default '[]'::jsonb, -- [{description, qty, unit_price}]
  labor_cost numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'recebido'
    check (status in ('recebido','em_diagnostico','aguardando_aprovacao','aguardando_peca','em_reparo','pronto','entregue','cancelado')),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (customer_id, os_number)
);
create index service_orders_customer_idx on service_orders(customer_id);
create index service_orders_status_idx on service_orders(customer_id, status);

-- Histórico de cálculos da calculadora de preço/lucro
create table pricing_calculations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text not null default 'Cálculo',
  inputs jsonb not null,
  results jsonb not null,
  created_at timestamptz not null default now()
);
create index pricing_calculations_customer_idx on pricing_calculations(customer_id);

-- Movimentações financeiras
create table finance_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type text not null check (type in ('receita','despesa')),
  category text not null default 'outros',
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  entry_date date not null default current_date,
  notes text,
  source text not null default 'manual' check (source in ('manual','os')),
  service_order_id uuid references service_orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index finance_transactions_customer_idx on finance_transactions(customer_id, entry_date);
-- Uma OS só pode gerar UMA receita (anti-duplicidade)
create unique index finance_os_unique on finance_transactions(service_order_id)
  where service_order_id is not null;

-- Perfil da assistência (dados exibidos em orçamentos e garantias)
create table business_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references customers(id) on delete cascade,
  business_name text not null default '',
  owner_name text,
  phone text,
  email text,
  address text,
  logo_url text,
  warranty_terms text,
  updated_at timestamptz not null default now()
);

-- Orçamentos
create table quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  quote_number int not null,
  service_client_id uuid references service_clients(id) on delete set null,
  device_id uuid references devices(id) on delete set null,
  service_order_id uuid references service_orders(id) on delete set null,
  client_name text not null,
  device_label text not null default '',
  service_description text not null default '',
  items jsonb not null default '[]'::jsonb, -- [{description, qty, unit_price}]
  labor_cost numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  deadline text,
  valid_until date,
  notes text,
  status text not null default 'rascunho'
    check (status in ('rascunho','enviado','aprovado','recusado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, quote_number)
);
create index quotes_customer_idx on quotes(customer_id);

-- Termos de garantia (emitidos a partir de OS concluída)
create table warranties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  warranty_number int not null,
  service_order_id uuid not null references service_orders(id) on delete cascade,
  period_days int not null default 90,
  conditions text,
  notes text,
  created_at timestamptz not null default now(),
  unique (customer_id, warranty_number)
);
create index warranties_customer_idx on warranties(customer_id);

-- Acesso às ferramentas (trial/assinatura) — camada central, duração configurável
create table tool_access (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references customers(id) on delete cascade,
  trial_days int not null default 7,
  trial_started_at timestamptz not null default now(),
  status text not null default 'trial'
    check (status in ('trial','active','locked')),
  paid_until timestamptz,
  created_at timestamptz not null default now()
);

alter table service_clients enable row level security;
alter table devices enable row level security;
alter table service_orders enable row level security;
alter table pricing_calculations enable row level security;
alter table finance_transactions enable row level security;
alter table business_profiles enable row level security;
alter table quotes enable row level security;
alter table warranties enable row level security;
alter table tool_access enable row level security;

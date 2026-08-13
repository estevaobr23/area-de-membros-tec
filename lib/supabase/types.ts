export interface Customer {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  wiapy_product_id: string | null;
  created_at: string;
}

export type PurchaseStatus = "paid" | "pending" | "refunded" | "chargeback";

export interface Purchase {
  id: string;
  customer_id: string;
  transaction_id: string;
  status: PurchaseStatus;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  created_at: string;
}

export type EntitlementStatus = "active" | "revoked";

/** Controla o acesso liberado de um cliente a um produto. */
export interface Entitlement {
  id: string;
  customer_id: string;
  product_id: string;
  status: EntitlementStatus;
  created_at: string;
}

/** Sessão de login por e-mail (sem senha) da área de membros. */
export interface Session {
  id: string;
  customer_id: string;
  token_hash: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  expires_at: string;
}

// ── Ferramentas (dados do técnico logado, isolados por customer_id) ──

/** Item de peça usado em OS e orçamentos (armazenado em jsonb). */
export interface PartItem {
  description: string;
  qty: number;
  unit_price: number;
}

export interface ServiceClient {
  id: string;
  customer_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  customer_id: string;
  service_client_id: string;
  brand: string;
  model: string;
  color: string | null;
  imei: string | null;
  accessories: string | null;
  condition: string | null;
  notes: string | null;
  created_at: string;
}

export interface ServiceOrder {
  id: string;
  customer_id: string;
  os_number: number;
  service_client_id: string;
  device_id: string;
  reported_defect: string;
  diagnosis: string | null;
  service_performed: string | null;
  parts: PartItem[];
  labor_cost: number;
  discount: number;
  total: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

export interface FinanceTransaction {
  id: string;
  customer_id: string;
  type: "receita" | "despesa";
  category: string;
  description: string;
  amount: number;
  entry_date: string;
  notes: string | null;
  source: "manual" | "os";
  service_order_id: string | null;
  created_at: string;
}

export interface BusinessProfile {
  id: string;
  customer_id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  warranty_terms: string | null;
  updated_at: string;
}

export interface Quote {
  id: string;
  customer_id: string;
  quote_number: number;
  service_client_id: string | null;
  device_id: string | null;
  service_order_id: string | null;
  client_name: string;
  device_label: string;
  service_description: string;
  items: PartItem[];
  labor_cost: number;
  discount: number;
  total: number;
  deadline: string | null;
  valid_until: string | null;
  notes: string | null;
  status: "rascunho" | "enviado" | "aprovado" | "recusado";
  created_at: string;
  updated_at: string;
}

/** Progresso de leitura do manual em PDF por cliente/produto. */
export interface ReadingProgress {
  id: string;
  customer_id: string;
  product_id: string;
  last_page: number;
  num_pages: number | null;
  updated_at: string;
}

export interface Warranty {
  id: string;
  customer_id: string;
  warranty_number: number;
  service_order_id: string;
  period_days: number;
  conditions: string | null;
  notes: string | null;
  created_at: string;
}

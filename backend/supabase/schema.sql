-- CompraBTC — tablas del AGENTE (fase 1, hackathon). Prefijo agent_* para
-- convivir con el esquema fiat existente (users/plans/purchases/batches/
-- bank_accounts/pricing_configs), que queda intacto para la fase 2.
-- Ejecutar en el SQL editor de Supabase.

create table if not exists agent_users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists agent_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references agent_users(id),
  wallet_address text unique not null,
  amount_per_run numeric not null,          -- unidades USDT (6 dec)
  frequency_seconds integer not null,
  stop_loss_pct numeric,                    -- % de caída vs costo promedio que pausa el plan
  status text not null default 'active',    -- active | paused | stopped | no_funds | stop_loss
  next_run_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_executions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references agent_plans(id),
  run_at timestamptz not null default now(),
  execute_tx text,
  usdt_in numeric,                          -- unidades USDT (6 dec)
  fee_usdt numeric,
  wbtc_out numeric,                         -- sats (8 dec)
  status text not null,                     -- success | failed | skipped_no_funds | skipped_stop_loss
  error text
);

create index if not exists idx_agent_plans_due on agent_plans (status, next_run_at);
create index if not exists idx_agent_executions_plan on agent_executions (plan_id, run_at desc);

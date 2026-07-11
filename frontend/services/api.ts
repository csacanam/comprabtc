/**
 * CLIENTE DEL BACKEND REAL
 * =========================
 * Reemplaza a mockApi para el flujo cripto: el backend expone el estado
 * del plan, historial de ejecuciones y precio de BTC.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ExecutionRow {
  id: string;
  run_at: string;
  execute_tx: string | null;
  usdt_in: number | null;
  fee_usdt: number | null;
  wbtc_out: number | null;
  status: string;
  error: string | null;
}

export interface PlanResponse {
  plan: {
    id: string;
    wallet_address: string;
    amount_per_run: number; // unidades USDT (6 dec)
    frequency_seconds: number;
    stop_loss_pct: number | null;
    status: string;
    next_run_at: string;
  };
  onchain: {
    amountPerRun: string;
    minInterval: string;
    lastRun: string;
    active: boolean;
    tokenOut: string;
    poolFee: number;
  };
  executions: ExecutionRow[];
  costBasis: { totalUsdt: number; totalSats: number; avgPriceUsdtPerBtc: number } | null;
  btcPriceUsdt: number | null;
}

export async function fetchPlan(address: string): Promise<PlanResponse | null> {
  const res = await fetch(`${API_URL}/api/plans/${address}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchExecutions(
  address: string,
  offset: number,
  limit = 20,
): Promise<{ executions: ExecutionRow[]; total: number }> {
  const res = await fetch(`${API_URL}/api/executions/${address}?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchTelegramStatus(address: string): Promise<{ linked: boolean }> {
  const res = await fetch(`${API_URL}/api/telegram/status/${address}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function sendTelegramTest(walletAddress: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/telegram/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
}

export async function registerPlan(input: {
  walletAddress: string;
  frequencySeconds: number;
  stopLossPct?: number;
  email?: string;
}): Promise<void> {
  const res = await fetch(`${API_URL}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
  }
}

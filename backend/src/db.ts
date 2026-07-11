import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

export interface PlanRow {
  id: string;
  user_id: string;
  wallet_address: string;
  amount_per_run: number;
  frequency_seconds: number;
  stop_loss_pct: number | null;
  status: string;
  next_run_at: string;
}

export async function upsertUserAndPlan(input: {
  walletAddress: string;
  amountPerRun: number;
  frequencySeconds: number;
  stopLossPct?: number;
  email?: string;
}) {
  const wallet = input.walletAddress.toLowerCase();

  const { data: user, error: userErr } = await supabase
    .from("agent_users")
    .upsert({ wallet_address: wallet, email: input.email ?? null }, { onConflict: "wallet_address" })
    .select()
    .single();
  if (userErr) throw userErr;

  const { data: plan, error: planErr } = await supabase
    .from("agent_plans")
    .upsert(
      {
        user_id: user.id,
        wallet_address: wallet,
        amount_per_run: input.amountPerRun,
        frequency_seconds: input.frequencySeconds,
        stop_loss_pct: input.stopLossPct ?? null,
        status: "active",
        next_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address" },
    )
    .select()
    .single();
  if (planErr) throw planErr;
  return plan as PlanRow;
}

export async function getDuePlans(): Promise<PlanRow[]> {
  const { data, error } = await supabase
    .from("agent_plans")
    .select("*")
    .in("status", ["active", "no_funds"]) // no_funds se reintenta en cada ciclo
    .lte("next_run_at", new Date().toISOString());
  if (error) throw error;
  return (data ?? []) as PlanRow[];
}

export async function getPlanByWallet(walletAddress: string): Promise<PlanRow | null> {
  const { data, error } = await supabase
    .from("agent_plans")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data as PlanRow | null;
}

export async function setPlanStatus(planId: string, status: string, nextRunAt?: Date) {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (nextRunAt) patch.next_run_at = nextRunAt.toISOString();
  const { error } = await supabase.from("agent_plans").update(patch).eq("id", planId);
  if (error) throw error;
}

export async function recordExecution(input: {
  planId: string;
  status: string;
  executeTx?: string;
  usdtIn?: number;
  feeUsdt?: number;
  wbtcOut?: number;
  error?: string;
}) {
  const { error } = await supabase.from("agent_executions").insert({
    plan_id: input.planId,
    status: input.status,
    execute_tx: input.executeTx ?? null,
    usdt_in: input.usdtIn ?? null,
    fee_usdt: input.feeUsdt ?? null,
    wbtc_out: input.wbtcOut ?? null,
    error: input.error ?? null,
  });
  if (error) throw error;
}

export async function getExecutions(planId: string, limit = 50) {
  const { data, error } = await supabase
    .from("agent_executions")
    .select("*")
    .eq("plan_id", planId)
    .order("run_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function linkTelegram(walletAddress: string, chatId: string) {
  // upsert: permite vincular Telegram aunque el usuario aún no haya creado plan
  const { error } = await supabase
    .from("agent_users")
    .upsert(
      { wallet_address: walletAddress.toLowerCase(), telegram_chat_id: chatId },
      { onConflict: "wallet_address" },
    );
  if (error) throw error;
}

export async function getTelegramChatByWallet(walletAddress: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("agent_users")
    .select("telegram_chat_id")
    .eq("wallet_address", walletAddress.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return (data?.telegram_chat_id as string | null) ?? null;
}

export async function getTelegramChatByUserId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("agent_users")
    .select("telegram_chat_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.telegram_chat_id as string | null) ?? null;
}

export interface GlobalStats {
  totalPurchases: number;
  totalVolumeUsdt: number; // unidades (6 dec)
  totalSats: number;
  activePlans: number;
  totalUsers: number;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const [{ data: execs }, { count: activePlans }, { count: totalUsers }] = await Promise.all([
    supabase.from("agent_executions").select("usdt_in, wbtc_out").eq("status", "success"),
    supabase.from("agent_plans").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("agent_users").select("*", { count: "exact", head: true }),
  ]);
  let volume = 0;
  let sats = 0;
  for (const row of execs ?? []) {
    volume += Number(row.usdt_in ?? 0);
    sats += Number(row.wbtc_out ?? 0);
  }
  return {
    totalPurchases: (execs ?? []).length,
    totalVolumeUsdt: volume,
    totalSats: sats,
    activePlans: activePlans ?? 0,
    totalUsers: totalUsers ?? 0,
  };
}

/**
 * Desglose de fees cobrados: los de planes de wallets internas (keeper) son
 * circulares (nos cobramos a nosotros mismos); los externos son ingreso real.
 */
export async function getFeeBreakdown(internalWallets: string[]) {
  const { data, error } = await supabase
    .from("agent_executions")
    .select("fee_usdt, plan:agent_plans!inner(wallet_address)")
    .eq("status", "success");
  if (error) throw error;
  const internal = new Set(internalWallets.map((w) => w.toLowerCase()));
  let external = 0;
  let circular = 0;
  let executions = 0;
  for (const row of (data ?? []) as unknown as { fee_usdt: number | null; plan: { wallet_address: string } }[]) {
    executions += 1;
    const fee = Number(row.fee_usdt ?? 0);
    if (internal.has(row.plan.wallet_address)) circular += fee;
    else external += fee;
  }
  return { externalFees: external, circularFees: circular, executions };
}

/** Costo promedio: total USDT gastado / total sats comprados (solo ejecuciones exitosas). */
export async function getCostBasis(planId: string) {
  const { data, error } = await supabase
    .from("agent_executions")
    .select("usdt_in, wbtc_out")
    .eq("plan_id", planId)
    .eq("status", "success");
  if (error) throw error;
  let usdt = 0;
  let sats = 0;
  for (const row of data ?? []) {
    usdt += Number(row.usdt_in ?? 0);
    sats += Number(row.wbtc_out ?? 0);
  }
  if (sats === 0) return null;
  // precio promedio en USDT humanos por BTC
  return { totalUsdt: usdt, totalSats: sats, avgPriceUsdtPerBtc: (usdt / 1e6) / (sats / 1e8) };
}

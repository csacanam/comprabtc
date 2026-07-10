import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { config, CELO_NETWORK, USDT } from "./config.js";
import { keeperAccount, btcSpotPriceUsdt, publicClient, discoverPlans } from "./chain.js";
import { erc20Abi } from "./abi.js";
import { sendOps } from "./telegram.js";
import * as db from "./db.js";

// El agente: paga x402 con la wallet del keeper y llama la API de ejecución.
const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: CELO_NETWORK, client: new ExactEvmScheme(keeperAccount) }],
});

let running = false;
let lastScannedBlock = 0n;

export function startKeeper() {
  console.log(`[keeper] agente iniciado — cada ${config.keeperIntervalMs / 1000}s, wallet ${keeperAccount.address}`);
  setInterval(tick, config.keeperIntervalMs);
  void tick();
}

/** Adopta planes creados directo en el contrato (sin pasar por nuestro API). */
async function adoptOnchainPlans() {
  const latest = await publicClient.getBlockNumber();
  if (lastScannedBlock === 0n) lastScannedBlock = latest - 5000n; // ~80 min hacia atrás en el arranque
  if (latest <= lastScannedBlock) return;

  const created = await discoverPlans(lastScannedBlock + 1n, latest);
  lastScannedBlock = latest;

  for (const plan of created) {
    const existing = await db.getPlanByWallet(plan.user);
    if (existing) {
      // recreación de plan: reactivar si estaba detenido, sin pisar su config off-chain
      if (existing.status === "stopped") await db.setPlanStatus(existing.id, "active", new Date());
      continue;
    }
    await db.upsertUserAndPlan({
      walletAddress: plan.user,
      amountPerRun: plan.amountPerRun,
      frequencySeconds: plan.minInterval,
    });
    console.log(`[keeper] plan on-chain adoptado: ${plan.user} ($${plan.amountPerRun / 1e6} cada ${plan.minInterval}s)`);
  }
}

// ===== BOT DE CONTROL (ops) =====
// Alarmas de saldos con cooldown + digest periódico de métricas.
const ALARM_COOLDOWN_MS = 6 * 3600_000;
const DIGEST_INTERVAL_MS = 6 * 3600_000;
const lastAlarmAt: Record<string, number> = {};
let lastDigestAt = 0;

async function alarm(key: string, message: string) {
  const now = Date.now();
  if (now - (lastAlarmAt[key] ?? 0) < ALARM_COOLDOWN_MS) return;
  lastAlarmAt[key] = now;
  await sendOps(`🚨 <b>CompraBTC ops</b>\n${message}`);
}

async function opsMonitor() {
  const [celoWei, usdtUnits, creditsRes] = await Promise.all([
    publicClient.getBalance({ address: keeperAccount.address }),
    publicClient.readContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [keeperAccount.address] }),
    fetch(`https://x402.celo.org/api/account?address=${config.payTo}`).then((r) => r.json()).catch(() => null),
  ]);
  const celo = Number(celoWei) / 1e18;
  const usdt = Number(usdtUnits) / 1e6;
  const credits = (creditsRes as { balances?: { mainnet?: number } } | null)?.balances?.mainnet ?? null;

  if (usdt < 2) await alarm("keeper-usdt", `Keeper con poco USDT: $${usdt.toFixed(2)} — fondear ${keeperAccount.address} (paga fees x402).`);
  if (celo < 0.2) await alarm("keeper-celo", `Keeper con poco CELO para gas: ${celo.toFixed(3)} — fondear ${keeperAccount.address}.`);
  if (credits != null && credits < 100) await alarm("x402-credits", `Créditos x402 bajos: ${credits} — recargar en x402.celo.org (depositar USDC y postear tx en /api/topup).`);

  if (Date.now() - lastDigestAt >= DIGEST_INTERVAL_MS) {
    lastDigestAt = Date.now();
    const stats = await db.getGlobalStats().catch(() => null);
    if (stats) {
      await sendOps(
        `📊 <b>CompraBTC digest</b>\n` +
          `Compras: <b>${stats.totalPurchases}</b> · Volumen: <b>$${(stats.totalVolumeUsdt / 1e6).toFixed(2)}</b> · Sats: <b>${stats.totalSats.toLocaleString("es-CO")}</b>\n` +
          `Planes activos: <b>${stats.activePlans}</b> · Usuarios: <b>${stats.totalUsers}</b>\n` +
          `x402 liquidados: <b>${stats ? (credits != null ? 500 - credits : "?") : "?"}</b> · Créditos: <b>${credits ?? "?"}</b>\n` +
          `Keeper: <b>$${usdt.toFixed(2)} USDT</b> · <b>${celo.toFixed(3)} CELO</b>`,
      );
    }
  }
}

async function tick() {
  if (running) return; // no solapar ciclos
  running = true;
  try {
    await adoptOnchainPlans().catch((err) => console.warn("[keeper] discovery falló:", err?.message ?? err));
    await opsMonitor().catch((err) => console.warn("[keeper] ops monitor falló:", err?.message ?? err));
    const due = await db.getDuePlans();
    if (due.length > 0) console.log(`[keeper] ${due.length} plan(es) por ejecutar`);

    for (const plan of due) {
      try {
        // stop-loss: si el precio cayó X% vs costo promedio → pausar, no comprar
        if (plan.stop_loss_pct != null) {
          const basis = await db.getCostBasis(plan.id);
          if (basis) {
            const spot = await btcSpotPriceUsdt();
            const dropPct = ((basis.avgPriceUsdtPerBtc - spot) / basis.avgPriceUsdtPerBtc) * 100;
            if (dropPct >= plan.stop_loss_pct) {
              console.log(`[keeper] stop-loss ${plan.wallet_address}: caída ${dropPct.toFixed(1)}%`);
              await db.recordExecution({ planId: plan.id, status: "skipped_stop_loss" });
              await db.setPlanStatus(plan.id, "stop_loss");
              continue;
            }
          }
        }

        const res = await fetchWithPayment(config.executeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: plan.wallet_address }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          console.log(`[keeper] ✓ ${plan.wallet_address} tx=${(body as { tx?: string }).tx}`);
        } else {
          console.warn(`[keeper] ✗ ${plan.wallet_address} (${res.status})`, body);
        }
        // el endpoint /api/execute actualiza DB (status + next_run_at) en todos los casos
      } catch (err) {
        console.error(`[keeper] error con ${plan.wallet_address}:`, err);
      }
    }
  } catch (err) {
    console.error("[keeper] tick failed:", err);
  } finally {
    running = false;
  }
}

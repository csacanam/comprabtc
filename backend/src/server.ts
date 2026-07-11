import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { isAddress, formatUnits } from "viem";
import { config, USDT, CELO_NETWORK, USDT_EIP712 } from "./config.js";
import { readPlan, readUserFunds, readFees, quoteUsdtToWbtc, sendExecute, btcSpotPriceUsdt } from "./chain.js";
import { sendTelegram, telegramEnabled } from "./telegram.js";
import * as db from "./db.js";

export function buildServer() {
  const app = express();
  app.use(express.json());

  // CORS: el frontend corre en otro origen (localhost:3000 / Vercel)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT, PAYMENT-SIGNATURE");
    res.setHeader("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // ------------------------------------------------------------- x402
  // El facilitator de Celo exige X-API-Key en /settle (se crea firmando en x402.celo.org)
  const authHeaders = async () => ({
    verify: { "X-API-Key": config.x402ApiKey },
    settle: { "X-API-Key": config.x402ApiKey },
    supported: { "X-API-Key": config.x402ApiKey },
  });
  const facilitatorClient = new HTTPFacilitatorClient({
    url: config.facilitatorUrl,
    createAuthHeaders: authHeaders,
  });
  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register(CELO_NETWORK, new ExactEvmScheme())
    .onSettleFailure(async (ctx) => {
      console.error("[x402] settle FAILED:", ctx.error?.message ?? ctx.error);
    });

  app.use(
    paymentMiddleware(
      {
        "POST /api/execute": {
          accepts: {
            scheme: "exact",
            network: CELO_NETWORK,
            payTo: config.payTo,
            price: {
              asset: USDT,
              amount: config.executeFeeUsdt,
              extra: { ...USDT_EIP712 },
            },
          },
          description: "CompraBTC — ejecución de una cuota DCA (USDT→BTC en Celo)",
        },
      },
      resourceServer,
    ),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "comprabtc-backend" });
  });

  // Descriptor del servicio para agentes: cómo usar CompraBTC sin permiso de nadie
  app.get("/", (_req, res) => {
    res.json({
      name: "CompraBTC",
      description:
        "Autonomous Bitcoin DCA agent on Celo. Create a plan on-chain and the agent executes every installment for you: pulls USDT from your wallet within the limits you authorized, swaps to WBTC on Uniswap v3, and sends the Bitcoin straight back to your wallet.",
      agentRegistry: "https://www.8004scan.io/agents/celo/9665",
      howToUse: {
        "1_create_plan_onchain": {
          contract: config.executorAddress,
          network: "eip155:42220",
          steps: [
            "USDT.approve(executor, totalBudget) — USDT: 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
            "executor.createPlan(amountPerRun, minIntervalSeconds, tokenOut, poolFee) — MVP: tokenOut WBTC 0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D, poolFee 3000",
          ],
          note: "That's it — the keeper discovers PlanCreated events and runs your plan automatically. Cancel anytime with executor.cancelPlan() or USDT.approve(executor, 0).",
        },
        "2_optional_trigger_execution": {
          endpoint: "POST /api/execute { user } — x402 payment required",
          note: "Permissionless fallback: anyone can pay to trigger a due installment (covers gas + settlement). The on-chain contract enforces amount and interval limits regardless of who pays.",
        },
        "3_read_state": { endpoint: "GET /api/plans/:address — free" },
      },
      fees: "On-chain, hard-capped in the verified contract: $0.005 + 1% per installment.",
    });
  });

  // ---------------------------------------------------- ejecución (pagada)
  // El agente/keeper paga x402 para llamar esto. Cualquiera que pague puede
  // invocarlo: el contrato igual hace cumplir active/intervalo/monto on-chain.
  app.post("/api/execute", async (req, res) => {
    try {
      const user = String(req.body?.user ?? "").toLowerCase();
      if (!isAddress(user)) return res.status(400).json({ error: "invalid user address" });

      // La verdad vive on-chain: si el plan existe en el contrato, este endpoint
      // lo sirve — cualquier agente que pague el x402 puede invocarlo, sin
      // registro previo (el plan se auto-registra en DB para el keeper).
      const onchain = await readPlan(user as `0x${string}`);
      if (!onchain.active) {
        // cancelado on-chain (cancelPlan / approve(0) + inactivo): detener en DB
        const stale = await db.getPlanByWallet(user);
        if (stale && stale.status !== "stopped") await db.setPlanStatus(stale.id, "stopped");
        return res.status(409).json({ error: "plan not active on-chain" });
      }

      let planRow = await db.getPlanByWallet(user);
      if (!planRow) {
        planRow = await db.upsertUserAndPlan({
          walletAddress: user,
          amountPerRun: Number(onchain.amountPerRun),
          frequencySeconds: Number(onchain.minInterval),
        });
      }

      const now = BigInt(Math.floor(Date.now() / 1000));
      if (onchain.lastRun !== 0n && now < onchain.lastRun + onchain.minInterval) {
        return res.status(409).json({ error: "interval not elapsed" });
      }

      // saldo/allowance → skip amable en vez de tx revertida
      const { balance, allowance } = await readUserFunds(user as `0x${string}`);
      if (balance < onchain.amountPerRun || allowance < onchain.amountPerRun) {
        await db.recordExecution({ planId: planRow.id, status: "skipped_no_funds" });
        await db.setPlanStatus(planRow.id, "no_funds", nextRun(planRow));
        return res.status(402).json({ error: "insufficient balance or allowance", skipped: true });
      }

      // minOut: quote real del pool − slippage (fees leídos del contrato, no hardcodeados)
      const fees = await readFees();
      const feeTotal = (onchain.amountPerRun * fees.bps) / 10_000n + fees.flat;
      const swapIn = onchain.amountPerRun - feeTotal;
      const quoted = await quoteUsdtToWbtc(swapIn);
      const minOut = quoted - (quoted * config.slippageBps) / 10_000n;

      const { hash, receipt, executed } = await sendExecute(user as `0x${string}`, minOut);
      if (receipt.status !== "success") {
        await db.recordExecution({ planId: planRow.id, status: "failed", executeTx: hash, error: "tx reverted" });
        return res.status(500).json({ error: "execution reverted", tx: hash });
      }

      await db.recordExecution({
        planId: planRow.id,
        status: "success",
        executeTx: hash,
        usdtIn: Number(executed?.amountIn ?? onchain.amountPerRun),
        feeUsdt: Number(executed?.feeAmount ?? feeTotal),
        wbtcOut: Number(executed?.amountOut ?? quoted),
      });
      await db.setPlanStatus(planRow.id, "active", nextRun(planRow));

      // Alerta Telegram al usuario (si vinculó su chat)
      if (telegramEnabled()) {
        db.getTelegramChatByUserId(planRow.user_id)
          .then((chatId) => {
            if (!chatId) return;
            const sats = Number(executed?.amountOut ?? quoted).toLocaleString("es-CO");
            const usd = (Number(onchain.amountPerRun) / 1e6).toFixed(2);
            return sendTelegram(
              chatId,
              `🟠 <b>CompraBTC</b>\nTu agente compró <b>${sats} sats</b> por $${usd} USDT.\n<a href="https://celoscan.io/tx/${hash}">Ver compra en Celoscan</a>`,
            );
          })
          .catch((err) => console.warn("[telegram] notify failed:", err));
      }

      return res.json({
        ok: true,
        tx: hash,
        usdtIn: formatUnits(onchain.amountPerRun, 6),
        sats: (executed?.amountOut ?? quoted).toString(),
      });
    } catch (err) {
      console.error("[execute]", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // ---------------------------------------------------- planes (no pagados)
  app.post("/api/plans", async (req, res) => {
    try {
      const { walletAddress, frequencySeconds, stopLossPct, email } = req.body ?? {};
      if (!isAddress(String(walletAddress ?? ""))) {
        return res.status(400).json({ error: "invalid walletAddress" });
      }
      // la verdad vive on-chain: el plan debe existir y estar activo
      const onchain = await readPlan(walletAddress as `0x${string}`);
      if (!onchain.active) return res.status(409).json({ error: "no active on-chain plan for this wallet" });

      const plan = await db.upsertUserAndPlan({
        walletAddress,
        amountPerRun: Number(onchain.amountPerRun),
        frequencySeconds: Number(frequencySeconds ?? onchain.minInterval),
        stopLossPct: stopLossPct != null ? Number(stopLossPct) : undefined,
        email: email ? String(email) : undefined,
      });
      return res.json({ ok: true, plan });
    } catch (err) {
      console.error("[plans:post]", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // ---------------------------------------------------- stats públicas
  app.get("/api/stats", async (_req, res) => {
    try {
      const [stats, price, credits] = await Promise.all([
        db.getGlobalStats(),
        btcSpotPriceUsdt().catch(() => null),
        fetch(`https://x402.celo.org/api/account?address=${config.payTo}`)
          .then((r) => r.json())
          .then((d: { balances?: { mainnet?: number } }) => d.balances?.mainnet ?? null)
          .catch(() => null),
      ]);
      res.json({
        ...stats,
        btcPriceUsdt: price,
        x402PaymentsSettled: credits != null ? 500 - credits : null,
        x402CreditsRemaining: credits,
      });
    } catch (err) {
      console.error("[stats]", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // ---------------------------------------------------- telegram webhook
  app.post("/api/telegram/webhook", async (req, res) => {
    res.json({ ok: true }); // responder rápido; Telegram reintenta si no
    try {
      if (req.headers["x-telegram-bot-api-secret-token"] !== config.telegramWebhookSecret) return;
      const msg = req.body?.message;
      const chatId = String(msg?.chat?.id ?? "");
      const text = String(msg?.text ?? "");
      if (!chatId || !text) return;

      if (text === "/id") {
        await sendTelegram(chatId, `Tu chat id es <code>${chatId}</code>`);
        return;
      }
      // /start 0x... → vincular wallet a este chat
      const wallet = text.startsWith("/start ") ? text.slice(7).trim().toLowerCase() : "";
      if (isAddress(wallet)) {
        await db.linkTelegram(wallet, chatId);
        await sendTelegram(
          chatId,
          `✅ Listo. Te avisaré aquí cada vez que tu agente compre Bitcoin para <code>${wallet.slice(0, 8)}…</code>`,
        );
      } else if (text.startsWith("/start")) {
        await sendTelegram(
          chatId,
          "Para vincular tus alertas, entra a comprabtc.vercel.app → Ajustes → Conectar Telegram.",
        );
      }
    } catch (err) {
      console.warn("[telegram] webhook error:", err);
    }
  });

  // ¿Esta wallet ya tiene Telegram vinculado? (para mostrar estado en la app)
  app.get("/api/telegram/status/:address", async (req, res) => {
    const address = String(req.params.address ?? "");
    if (!isAddress(address)) return res.status(400).json({ error: "invalid address" });
    const chat = await db.getTelegramChatByWallet(address).catch(() => null);
    return res.json({ linked: Boolean(chat) });
  });

  // Mensaje de prueba al chat vinculado (cooldown 60s por wallet)
  const lastTelegramTestAt = new Map<string, number>();
  app.post("/api/telegram/test", async (req, res) => {
    const address = String(req.body?.walletAddress ?? "").toLowerCase();
    if (!isAddress(address)) return res.status(400).json({ error: "invalid walletAddress" });
    const chat = await db.getTelegramChatByWallet(address).catch(() => null);
    if (!chat) return res.status(404).json({ linked: false, error: "telegram not linked" });
    const now = Date.now();
    if (now - (lastTelegramTestAt.get(address) ?? 0) < 60_000) {
      return res.status(429).json({ error: "wait a minute between tests" });
    }
    lastTelegramTestAt.set(address, now);
    await sendTelegram(chat, "👋 Prueba de CompraBTC: por aquí te avisaré cada vez que tu agente compre Bitcoin.");
    return res.json({ sent: true });
  });

  app.get("/api/plans/:address", async (req, res) => {
    try {
      const address = req.params.address;
      if (!isAddress(address)) return res.status(400).json({ error: "invalid address" });

      const planRow = await db.getPlanByWallet(address);
      if (!planRow) return res.status(404).json({ error: "not found" });

      const [onchain, executions, costBasis, spot] = await Promise.all([
        readPlan(address as `0x${string}`),
        db.getExecutions(planRow.id),
        db.getCostBasis(planRow.id),
        btcSpotPriceUsdt().catch(() => null),
      ]);

      return res.json({ plan: planRow, onchain: serialize({ ...onchain }), executions, costBasis, btcPriceUsdt: spot });
    } catch (err) {
      console.error("[plans:get]", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  return app;
}

function nextRun(plan: db.PlanRow): Date {
  return new Date(Date.now() + plan.frequency_seconds * 1000);
}

function serialize(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]),
  );
}

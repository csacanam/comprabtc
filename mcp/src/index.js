#!/usr/bin/env node
/**
 * CompraBTC MCP server — non-custodial Bitcoin DCA for treasuries and agents.
 *
 * The configured wallet is the plan OWNER (e.g. a project's operational
 * treasury). Security model, enforced on-chain by the verified contract:
 *   - Funds never leave the wallet between purchases (allowance = budget cap).
 *   - The keeper can only pull amountPerRun, at most every minInterval.
 *   - Purchased WBTC is sent straight back to the SAME wallet.
 *   - This server can never withdraw funds — worst case, BTC gets bought
 *     on schedule. Cancel anytime (cancel_plan) revokes everything.
 *
 * Tools:
 *   - get_wallet_status  (free)  → balances, allowance, active plan
 *   - get_portfolio      (free)  → sats accumulated, cost basis, history
 *   - create_plan        (signs) → approve budget + createPlan (2 txs)
 *   - renew_budget       (signs) → new approve (REPLACES the allowance)
 *   - cancel_plan        (signs) → cancelPlan + optional allowance revoke
 *
 * Config (env):
 *   COMPRABTC_WALLET_PRIVATE_KEY  key of the treasury wallet (never logged)
 *   COMPRABTC_MAX_PER_RUN_USDT    safety cap per installment (default 50)
 *   COMPRABTC_RPC_URL             default https://forno.celo.org
 *   COMPRABTC_API_BASE            default https://comprabtc-production.up.railway.app
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, parseAbi } from "viem";
import { celo } from "viem/chains";

const RPC_URL = process.env.COMPRABTC_RPC_URL || "https://forno.celo.org";
const API_BASE = process.env.COMPRABTC_API_BASE || "https://comprabtc-production.up.railway.app";
const MAX_PER_RUN = Number(process.env.COMPRABTC_MAX_PER_RUN_USDT) || 50;

const EXECUTOR = "0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189";
const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const WBTC = "0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D";
const POOL_FEE = 3000;
const MIN_INTERVAL = 3600; // seconds — hourly is the fastest the product offers

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
]);
const executorAbi = parseAbi([
  "function createPlan(uint128 amountPerRun, uint64 minInterval, address tokenOut, uint24 poolFee)",
  "function cancelPlan()",
  "function plans(address) view returns (uint128 amountPerRun, uint64 minInterval, uint64 lastRun, bool active, address tokenOut, uint24 poolFee)",
]);

const publicClient = createPublicClient({ chain: celo, transport: http(RPC_URL) });

let walletClient = null;
let account = null;

async function getWallet() {
  if (walletClient) return { walletClient, account };
  const pk = process.env.COMPRABTC_WALLET_PRIVATE_KEY;
  if (!pk) {
    throw new Error(
      "COMPRABTC_WALLET_PRIVATE_KEY not set. Use the treasury/agent wallet that will OWN the plan — it holds the USDT, signs the 2 setup transactions, and receives the purchased WBTC. It needs a little CELO for gas.",
    );
  }
  const { privateKeyToAccount } = await import("viem/accounts");
  account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
  walletClient = createWalletClient({ account, chain: celo, transport: http(RPC_URL) });
  return { walletClient, account };
}

function text(t) {
  return { content: [{ type: "text", text: typeof t === "string" ? t : JSON.stringify(t, null, 2) }] };
}

function errorText(message) {
  return { content: [{ type: "text", text: message }], isError: true };
}

async function readStatus(address) {
  const [usdt, celoWei, allowance, wbtc, plan] = await Promise.all([
    publicClient.readContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    publicClient.getBalance({ address }),
    publicClient.readContract({ address: USDT, abi: erc20Abi, functionName: "allowance", args: [address, EXECUTOR] }),
    publicClient.readContract({ address: WBTC, abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    publicClient.readContract({ address: EXECUTOR, abi: executorAbi, functionName: "plans", args: [address] }),
  ]);
  const [amountPerRun, minInterval, lastRun, active] = plan;
  return {
    address,
    usdt_balance: formatUnits(usdt, 6),
    celo_balance_for_gas: formatUnits(celoWei, 18),
    authorized_budget_remaining_usdt: formatUnits(allowance, 6),
    wbtc_sats: wbtc.toString(),
    plan: active
      ? {
          active: true,
          amount_per_run_usdt: formatUnits(amountPerRun, 6),
          interval_seconds: Number(minInterval),
          last_run_unix: Number(lastRun),
          installments_left: amountPerRun > 0n ? Number(allowance / amountPerRun) : 0,
        }
      : { active: false },
  };
}

const server = new McpServer({ name: "comprabtc", version: "0.1.0" });

server.tool(
  "get_wallet_status",
  "Balances (USDT, CELO for gas, WBTC sats), remaining authorized budget (allowance) and the current DCA plan of a wallet. Free, read-only. ALWAYS call this before create_plan, renew_budget or cancel_plan.",
  { address: z.string().optional().describe("Wallet to inspect (defaults to the configured treasury wallet)") },
  async ({ address }) => {
    try {
      let addr = address;
      if (!addr) {
        const { account: acc } = await getWallet();
        addr = acc.address;
      }
      return text(await readStatus(addr));
    } catch (e) {
      return errorText(e.shortMessage || e.message);
    }
  },
);

server.tool(
  "get_portfolio",
  "Bitcoin accumulated by a wallet's plan: execution history (each purchase with tx hash and sats), cost basis, live BTC price. Free, read-only, via the CompraBTC API.",
  { address: z.string().optional().describe("Wallet (defaults to the configured treasury wallet)") },
  async ({ address }) => {
    try {
      let addr = address;
      if (!addr) {
        const { account: acc } = await getWallet();
        addr = acc.address;
      }
      const res = await fetch(`${API_BASE}/api/plans/${addr}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return errorText(`HTTP ${res.status}: ${body.error || "no plan found for this wallet"}`);
      return text(body);
    } catch (e) {
      return errorText(e.message);
    }
  },
);

server.tool(
  "create_plan",
  "Create (or OVERWRITE) the treasury's Bitcoin DCA plan — signs 2 on-chain transactions: approve(total budget) + createPlan. Get explicit operator/human approval on the exact numbers first. Non-custodial: funds stay in the wallet; the verified contract enforces amount and interval; purchased WBTC arrives at this same wallet; fees ($0.005 + 1%) come OUT of each installment. First purchase executes within ~1 minute. amount_per_run: $0.10-$" +
    String(MAX_PER_RUN) +
    " USDT (pool-depth safety cap). interval_seconds >= 3600 (hourly). budget = amount × installments, must be <= USDT balance.",
  {
    amount_per_run_usdt: z.number().min(0.1).describe("USDT per purchase (e.g. 1)"),
    interval_seconds: z.number().int().min(MIN_INTERVAL).describe("Seconds between purchases (3600=hourly, 86400=daily)"),
    total_budget_usdt: z.number().positive().describe("Total USDT to authorize (allowance cap = installments × amount)"),
  },
  async ({ amount_per_run_usdt, interval_seconds, total_budget_usdt }) => {
    try {
      if (amount_per_run_usdt > MAX_PER_RUN) {
        return errorText(
          `amount_per_run_usdt ${amount_per_run_usdt} exceeds the safety cap of $${MAX_PER_RUN} (WBTC pool depth on Celo is ~$150K; larger trades risk slippage rejection). Prefer smaller, more frequent installments — or raise COMPRABTC_MAX_PER_RUN_USDT deliberately.`,
        );
      }
      if (total_budget_usdt < amount_per_run_usdt) {
        return errorText("total_budget_usdt must cover at least one installment.");
      }
      const { walletClient: wc, account: acc } = await getWallet();
      const status = await readStatus(acc.address);
      if (Number(status.usdt_balance) < total_budget_usdt) {
        return errorText(
          `Insufficient USDT: balance ${status.usdt_balance}, requested budget ${total_budget_usdt}. Fund the wallet first (purchases would be skipped, not failed, but authorize what you actually hold).`,
        );
      }
      if (Number(status.celo_balance_for_gas) < 0.001) {
        return errorText(`No CELO for gas (balance: ${status.celo_balance_for_gas}). The 2 setup transactions need a little CELO.`);
      }

      const amount = parseUnits(String(amount_per_run_usdt), 6);
      const budget = parseUnits(String(total_budget_usdt), 6);

      const approveTx = await wc.writeContract({
        address: USDT, abi: erc20Abi, functionName: "approve", args: [EXECUTOR, budget],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      const createTx = await wc.writeContract({
        address: EXECUTOR, abi: executorAbi, functionName: "createPlan",
        args: [amount, BigInt(interval_seconds), WBTC, POOL_FEE],
      });
      await publicClient.waitForTransactionReceipt({ hash: createTx });

      return text({
        ok: true,
        plan: {
          amount_per_run_usdt,
          interval_seconds,
          total_budget_usdt,
          installments: Math.floor(total_budget_usdt / amount_per_run_usdt),
        },
        approve_tx: approveTx,
        create_plan_tx: createTx,
        note: "The keeper discovers the plan automatically — first purchase executes within ~1 minute. Track it with get_portfolio. When the budget runs out, purchases pause harmlessly; renew_budget resumes them.",
      });
    } catch (e) {
      return errorText(e.shortMessage || e.message);
    }
  },
);

server.tool(
  "renew_budget",
  "Authorize a new total budget for the existing plan — signs one approve transaction. IMPORTANT: approve REPLACES the previous allowance (it does not add). Use when installments_left is low or purchases paused for exhausted budget.",
  { total_budget_usdt: z.number().positive().describe("New total USDT to authorize") },
  async ({ total_budget_usdt }) => {
    try {
      const { walletClient: wc } = await getWallet();
      const tx = await wc.writeContract({
        address: USDT, abi: erc20Abi, functionName: "approve",
        args: [EXECUTOR, parseUnits(String(total_budget_usdt), 6)],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      return text({ ok: true, approve_tx: tx, new_budget_usdt: total_budget_usdt });
    } catch (e) {
      return errorText(e.shortMessage || e.message);
    }
  },
);

server.tool(
  "cancel_plan",
  "Stop the DCA plan immediately — signs cancelPlan() and, by default, also revokes the USDT allowance (approve 0) for a clean, double-locked exit. The WBTC already purchased stays in the wallet untouched.",
  { revoke_allowance: z.boolean().optional().describe("Also set the allowance to 0 (default true)") },
  async ({ revoke_allowance }) => {
    try {
      const { walletClient: wc } = await getWallet();
      const cancelTx = await wc.writeContract({
        address: EXECUTOR, abi: executorAbi, functionName: "cancelPlan", args: [],
      });
      await publicClient.waitForTransactionReceipt({ hash: cancelTx });
      let revokeTx = null;
      if (revoke_allowance !== false) {
        revokeTx = await wc.writeContract({
          address: USDT, abi: erc20Abi, functionName: "approve", args: [EXECUTOR, 0n],
        });
        await publicClient.waitForTransactionReceipt({ hash: revokeTx });
      }
      return text({ ok: true, cancel_tx: cancelTx, revoke_allowance_tx: revokeTx });
    } catch (e) {
      return errorText(e.shortMessage || e.message);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

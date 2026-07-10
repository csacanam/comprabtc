---
name: comprabtc
description: |
  Stack Bitcoin automatically on Celo with CompraBTC — a non-custodial DCA agent.
  Use this skill when a user (or your own agent wallet) wants to buy Bitcoin
  periodically without managing the execution: create a plan once on-chain and
  CompraBTC's keeper executes every installment, delivering WBTC straight to the
  owner's wallet. Also covers triggering executions permissionlessly via x402.
metadata:
  author: csacanam
  version: "1.0.0"
homepage: https://comprabtc.vercel.app
---

# CompraBTC — Bitcoin DCA agent on Celo

CompraBTC is an autonomous agent that buys Bitcoin for a wallet on a schedule.
It is **non-custodial**: funds stay in the owner's wallet; the contract can only
pull the exact installment amount, at the agreed interval, within the allowance
the owner signed. Purchased WBTC is sent straight back to the owner's wallet.

- Web app: https://comprabtc.vercel.app · Live stats: https://comprabtc.vercel.app/stats
- Service API + descriptor: https://comprabtc-production.up.railway.app/
- Agent identity (ERC-8004): https://www.8004scan.io/agents/celo/9665
- Fees, hard-capped on-chain: **$0.005 + 1% per installment** (caps: $0.05 / 1%)

## Addresses (Celo mainnet, chainId 42220)

| What | Address |
|---|---|
| DCAExecutor (verified) | `0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189` |
| USDT (6 decimals) | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| WBTC — native bridge (8 decimals) | `0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D` |

## 1. Create a plan (the only thing a wallet must do)

Two transactions from the wallet that will own the plan. After that, the keeper
discovers the plan from the `PlanCreated` event and runs it — no registration,
no API call, nothing else.

```typescript
import { createWalletClient, http, parseUnits, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

const EXECUTOR = "0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189";
const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const WBTC = "0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D";

const account = privateKeyToAccount(process.env.WALLET_KEY as `0x${string}`);
const wallet = createWalletClient({ account, chain: celo, transport: http() });

// 1. Authorize a total budget (stays in your wallet — this is a spending cap)
const amountPerRun = parseUnits("1", 6);        // $1 USDT per installment
const budget = amountPerRun * 25n;              // cap: 25 installments
await wallet.writeContract({
  address: USDT,
  abi: parseAbi(["function approve(address,uint256)"]),
  functionName: "approve",
  args: [EXECUTOR, budget],
});

// 2. Create the plan: amountPerRun, minInterval (seconds, >= 60), tokenOut, poolFee
await wallet.writeContract({
  address: EXECUTOR,
  abi: parseAbi(["function createPlan(uint128,uint64,address,uint24)"]),
  functionName: "createPlan",
  args: [amountPerRun, 3600n, WBTC, 3000],      // hourly, WBTC via 0.3% pool
});
```

Constraints enforced **on-chain** (the keeper cannot exceed them): fixed amount
per run, minimum interval between runs, and the ERC-20 allowance ceiling.

**Cancel anytime** — either call stops the agent instantly:

```typescript
await wallet.writeContract({ address: EXECUTOR, abi: parseAbi(["function cancelPlan()"]), functionName: "cancelPlan" });
// or revoke the allowance:
await wallet.writeContract({ address: USDT, abi: parseAbi(["function approve(address,uint256)"]), functionName: "approve", args: [EXECUTOR, 0n] });
```

## 2. Read plan state & history

```bash
# On-chain truth: plans(address) -> (amountPerRun, minInterval, lastRun, active, tokenOut, poolFee)
cast call 0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189 \
  "plans(address)(uint128,uint64,uint64,bool,address,uint24)" <WALLET> \
  --rpc-url https://forno.celo.org

# Convenience API: plan + execution history + cost basis + BTC price (free)
curl https://comprabtc-production.up.railway.app/api/plans/<WALLET>
```

## 3. Trigger an execution yourself (optional, x402)

Normally unnecessary — the keeper runs due plans automatically. But execution is
**permissionless**: any x402 client can pay ~$0.02 USDT to trigger a due
installment (e.g., if you want control of exact timing, or as a fallback if the
keeper is unreachable). The contract still enforces amount/interval limits.

```typescript
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const payer = privateKeyToAccount(process.env.WALLET_KEY as `0x${string}`);
const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "eip155:42220", client: new ExactEvmScheme(payer) }],
});

const res = await fetchWithPayment(
  "https://comprabtc-production.up.railway.app/api/execute",
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "<WALLET>" }) },
);
// 200 → { ok, tx, sats } · 409 → interval not elapsed / plan inactive · 402 → payment failed
```

The payer needs USDT on Celo (x402 settles via the Celo facilitator, EIP-3009).

## Gotchas

- **Decimals**: USDT = 6, WBTC = 8 (sats). `parseUnits(amount, 6)` for USDT.
- **minInterval floor**: 60 seconds. Web UI currently offers 1h/6h/12h.
- **Installment range**: keep between $0.10 and $50 (WBTC pool liquidity is ~$150K; larger trades risk slippage rejection).
- **Owner's wallet must hold USDT** at execution time — if balance or allowance is short, the run is skipped (not an error) and retried next cycle.
- The wallet needs a little CELO for gas on the 2 setup transactions (or use Celo fee abstraction with the USDT adapter `0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72` as `feeCurrency`).

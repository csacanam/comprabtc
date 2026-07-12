# comprabtc-mcp

MCP server for [CompraBTC](https://comprabtc.vercel.app) — give your project's treasury an **automatic Bitcoin savings habit**. Non-custodial DCA on Celo: approve USDT once, create an on-chain plan, and the CompraBTC agent buys WBTC on schedule straight back to your wallet.

**Why it's safe for a treasury** (enforced by the [verified contract](https://celoscan.io/address/0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189), not by promises):

- Funds never leave your wallet between purchases — the allowance is a hard budget cap.
- The keeper can only pull the exact installment, at most once per interval.
- Purchased WBTC lands in the **same wallet**. This server has no withdraw capability — worst case, Bitcoin gets bought on schedule.
- `cancel_plan` stops everything unilaterally and revokes the allowance.
- Fees ($0.005 + 1% per installment) are hard-capped on-chain and come out of each installment.

## Install

```bash
claude mcp add comprabtc -- npx -y comprabtc-mcp
```

Or in `.mcp.json` / `mcp.json`:

```json
{
  "mcpServers": {
    "comprabtc": {
      "command": "npx",
      "args": ["-y", "comprabtc-mcp"],
      "env": { "COMPRABTC_WALLET_PRIVATE_KEY": "0x..." }
    }
  }
}
```

## Configuration

| Env var | Required | Description |
|---|---|---|
| `COMPRABTC_WALLET_PRIVATE_KEY` | for writes | The treasury/agent wallet that owns the plan: holds the USDT, signs the setup txs, receives the WBTC. Needs a little CELO for gas. |
| `COMPRABTC_MAX_PER_RUN_USDT` | no | Safety cap per installment (default `50` — WBTC pool depth on Celo). |
| `COMPRABTC_RPC_URL` | no | Default `https://forno.celo.org`. |

The read-only tools (`get_wallet_status`, `get_portfolio`) work for any address without a key.

## Tools

| Tool | Signs? | What it does |
|---|---|---|
| `get_wallet_status` | no | USDT/CELO/WBTC balances, remaining authorized budget, current plan |
| `get_portfolio` | no | Sats accumulated, cost basis, purchase history with tx hashes, live BTC price |
| `create_plan` | 2 txs | `approve(budget)` + `createPlan(amount, interval)` — first purchase within ~1 minute |
| `renew_budget` | 1 tx | New allowance (REPLACES, never adds) when the budget runs out |
| `cancel_plan` | 1-2 txs | `cancelPlan()` + allowance revoke — clean, double-locked exit |

## Typical flow (agent treasury)

1. Operator: "our agent earns USDT on Celo — put 20% into Bitcoin, $2 a day".
2. `get_wallet_status` → confirm balance, gas and numbers with the operator.
3. `create_plan { amount_per_run_usdt: 2, interval_seconds: 86400, total_budget_usdt: 60 }` — one month authorized.
4. `get_portfolio` any time — sats stacking, cost basis, every purchase verifiable on Celoscan.
5. Budget runs out → purchases pause harmlessly → `renew_budget` resumes.

Full guide: [skill](https://github.com/csacanam/comprabtc/blob/main/skills/comprabtc/SKILL.md) (`npx skills add csacanam/comprabtc`) · LLM index: [comprabtc.vercel.app/llms.txt](https://comprabtc.vercel.app/llms.txt)

import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  rpcUrl: process.env.RPC_URL ?? "https://forno.celo.org",
  executorAddress: required("EXECUTOR_ADDRESS") as `0x${string}`,
  keeperPrivateKey: required("KEEPER_PRIVATE_KEY") as `0x${string}`,

  payTo: required("PAY_TO_ADDRESS") as `0x${string}`,
  facilitatorUrl: process.env.X402_FACILITATOR_URL ?? "https://api.x402.celo.org",
  x402ApiKey: required("X402_API_KEY"),
  executeFeeUsdt: process.env.EXECUTE_FEE_USDT ?? "20000", // 0.02 USDT
  executeUrl: process.env.EXECUTE_URL ?? "http://localhost:8080/api/execute",

  attributionCode: process.env.ATTRIBUTION_CODE ?? "comprabtc",

  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceKey: required("SUPABASE_SERVICE_KEY"),

  port: Number(process.env.PORT ?? 8080),
  keeperIntervalMs: Number(process.env.KEEPER_INTERVAL_MS ?? 60_000),
  slippageBps: BigInt(process.env.SLIPPAGE_BPS ?? 100),
} as const;

// Direcciones canónicas en Celo mainnet (ver PLAN.md §2 — verificadas)
export const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;
export const WBTC = "0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D" as const; // bridge nativo, 8 dec
export const QUOTER_V2 = "0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8" as const;
export const POOL_FEE = 3000; // USDT/WBTC 0.3%
export const CELO_NETWORK = "eip155:42220" as const;
// Dominio EIP-712 del USDT de Celo para EIP-3009 (docs.celo.org/build-on-celo/build-with-ai/x402)
export const USDT_EIP712 = { name: "Tether USD", version: "1" } as const;

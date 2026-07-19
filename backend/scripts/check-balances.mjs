// check-balances.mjs — chequeo de salud de las wallets de ops (solo lectura).
//
// Imprime CELO/USDT/WBTC del keeper y del treasury (payTo), y los créditos
// x402 del facilitator. NO mueve fondos ni imprime secretos: deriva la
// dirección del keeper desde KEEPER_PRIVATE_KEY pero nunca la muestra.
//
// Uso:   node backend/scripts/check-balances.mjs
// Lee:   backend/.env  (KEEPER_PRIVATE_KEY, PAY_TO_ADDRESS, RPC_URL)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createPublicClient, http, erc20Abi, formatUnits, formatEther } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const HERE = dirname(fileURLToPath(import.meta.url));

// --- Direcciones canónicas en Celo mainnet (públicas, ver backend/src/config.ts) ---
const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const WBTC = "0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D";

// --- Cargar variables desde backend/.env sin depender del cwd ---
function loadEnv(path) {
  const out = {};
  for (const l of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = loadEnv(resolve(HERE, "../.env"));

const rpc = env.RPC_URL || "https://forno.celo.org";
const payTo = env.PAY_TO_ADDRESS;
if (!payTo) throw new Error("Falta PAY_TO_ADDRESS en backend/.env");
if (!env.KEEPER_PRIVATE_KEY) throw new Error("Falta KEEPER_PRIVATE_KEY en backend/.env");

const client = createPublicClient({ chain: celo, transport: http(rpc) });
const keeper = privateKeyToAccount(
  env.KEEPER_PRIVATE_KEY.startsWith("0x") ? env.KEEPER_PRIVATE_KEY : "0x" + env.KEEPER_PRIVATE_KEY,
);

const [celoWei, usdtKeeper, wbtcKeeper, usdtTreasury] = await Promise.all([
  client.getBalance({ address: keeper.address }),
  client.readContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [keeper.address] }),
  client.readContract({ address: WBTC, abi: erc20Abi, functionName: "balanceOf", args: [keeper.address] }),
  client.readContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [payTo] }),
]);

let credits = null;
try {
  credits = await fetch(`https://x402.celo.org/api/account?address=${payTo}`).then((r) => r.json());
} catch (e) {
  credits = { error: String(e) };
}

const flag = (v, min) => (v < min ? "🚨" : v < min * 2 ? "⚠️ " : "✅");

console.log("=== Direcciones ===");
console.log("Keeper (paga gas + x402):", keeper.address);
console.log("payTo / Treasury:        ", payTo);
console.log();
console.log("=== Saldos on-chain (Celo mainnet) ===");
console.log(`${flag(Number(formatEther(celoWei)), 0.2)} CELO (gas) keeper:  ${formatEther(celoWei)}   · mín 0.2`);
console.log(`${flag(Number(formatUnits(usdtKeeper, 6)), 2)} USDT keeper:        $${formatUnits(usdtKeeper, 6)}   · mín 2`);
console.log(`   WBTC (sats) keeper: ${Number(wbtcKeeper)} sats`);
console.log(`   USDT Treasury:      $${formatUnits(usdtTreasury, 6)}`);
console.log();
const mainnet = credits?.balances?.mainnet;
console.log("=== Créditos x402 (facilitator) ===");
console.log(`${mainnet != null ? flag(mainnet, 100) : "❔"} mainnet: ${mainnet ?? "?"}   · mín 100  (1 crédito = 1 settlement)`);
console.log(`   testnet: ${credits?.balances?.testnet ?? "?"}`);

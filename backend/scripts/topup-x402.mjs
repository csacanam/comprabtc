// topup-x402.mjs — recarga créditos x402 del facilitator de Celo.
//
// Deposita USDT desde la wallet payTo/treasury al treasury del facilitator y
// registra el topup. El facilitator acredita la cuenta SEGÚN EL `from` del
// depósito, por eso el signer DEBE ser exactamente PAY_TO_ADDRESS; el script
// aborta si no coincide. 1 crédito = $0.001 = 1 settlement.
//
// Uso:   node backend/scripts/topup-x402.mjs [montoUSD]     (default 2)
//        node backend/scripts/topup-x402.mjs 5              → 5,000 créditos
//
// Claves (nunca se imprimen; se leen de archivos .env gitignoreados):
//   - DEPLOYER_PRIVATE_KEY  → firma el depósito (== payTo). Se toma de
//     process.env.DEPLOYER_PRIVATE_KEY o, si no está, de contracts/.env.
//   - PAY_TO_ADDRESS, RPC_URL → de backend/.env.
//
// SEGURIDAD: este archivo no contiene secretos y es seguro en un repo público.
// Requiere que contracts/.env y backend/.env estén gitignoreados (lo están).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  createPublicClient, createWalletClient, http,
  erc20Abi, formatUnits, formatEther, parseUnits,
} from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const HERE = dirname(fileURLToPath(import.meta.url));

// --- Constantes verificadas contra https://x402.celo.org/api/config ---
const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const FACILITATOR_TREASURY = "0x0d74D5Cefd2e7F24E623330ebE3d8D4cB45fFB48"; // /supported → signers
const FACILITATOR = "https://x402.celo.org";

const AMOUNT_USD = process.argv[2] || "2"; // $1 → 1,000 créditos

function loadEnv(path) {
  const out = {};
  try {
    for (const l of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* archivo ausente: ok, puede venir de process.env */ }
  return out;
}

const backendEnv = loadEnv(resolve(HERE, "../.env"));
const contractsEnv = loadEnv(resolve(HERE, "../../contracts/.env"));

const RPC = process.env.RPC_URL || backendEnv.RPC_URL || "https://forno.celo.org";
const PAYTO = (process.env.PAY_TO_ADDRESS || backendEnv.PAY_TO_ADDRESS || "").toLowerCase();
if (!PAYTO) throw new Error("Falta PAY_TO_ADDRESS (backend/.env)");

const rawKey = process.env.DEPLOYER_PRIVATE_KEY || contractsEnv.DEPLOYER_PRIVATE_KEY;
if (!rawKey) throw new Error("Falta DEPLOYER_PRIVATE_KEY (contracts/.env o env var)");
const account = privateKeyToAccount(rawKey.startsWith("0x") ? rawKey : "0x" + rawKey);

const pub = createPublicClient({ chain: celo, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: celo, transport: http(RPC) });
const amount = parseUnits(AMOUNT_USD, 6);
const credits = Number(AMOUNT_USD) * 1000;

// ---- PREFLIGHT ----
console.log("=== PREFLIGHT ===");
console.log("Signer:", account.address);
if (account.address.toLowerCase() !== PAYTO) {
  throw new Error(`ABORT: el signer NO es payTo (${PAYTO}). El facilitator acreditaría OTRA cuenta.`);
}
console.log("  ✅ signer === payTo");

const [celoWei, usdt, before] = await Promise.all([
  pub.getBalance({ address: account.address }),
  pub.readContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [account.address] }),
  fetch(`${FACILITATOR}/api/account?address=${account.address}`).then((r) => r.json()).catch(() => null),
]);
console.log("  CELO (gas):", formatEther(celoWei));
console.log("  USDT:      $" + formatUnits(usdt, 6));
console.log("  Créditos mainnet ANTES:", before?.balances?.mainnet);
console.log(`  Depósito:  $${AMOUNT_USD} USDT → ${FACILITATOR_TREASURY}  (≈ ${credits} créditos)`);

if (usdt < amount) throw new Error(`ABORT: USDT insuficiente ($${formatUnits(usdt, 6)} < $${AMOUNT_USD})`);
if (celoWei < parseUnits("0.01", 18)) throw new Error("ABORT: CELO insuficiente para gas");

// ---- 1) transfer ----
console.log("\n=== 1) Enviando transfer de USDT al treasury del facilitator ===");
const txHash = await wallet.writeContract({
  address: USDT, abi: erc20Abi, functionName: "transfer", args: [FACILITATOR_TREASURY, amount],
});
console.log("  tx:", txHash);
console.log("  https://celoscan.io/tx/" + txHash);

// ---- 2) confirmación ----
console.log("\n=== 2) Esperando confirmación on-chain ===");
const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
console.log("  status:", receipt.status, "· bloque:", receipt.blockNumber);
if (receipt.status !== "success") throw new Error("ABORT: la tx no fue exitosa");

// ---- 3) topup ----
console.log("\n=== 3) Registrando topup en el facilitator ===");
const topup = await fetch(`${FACILITATOR}/api/topup/${txHash}`).then((r) => r.json()).catch((e) => ({ error: String(e) }));
console.log("  respuesta:", JSON.stringify(topup));

// ---- 4) poll ----
console.log("\n=== 4) Verificando créditos acreditados ===");
let mainnet = before?.balances?.mainnet ?? 0;
for (let i = 0; i < 15; i++) {
  const acct = await fetch(`${FACILITATOR}/api/account?address=${account.address}`).then((r) => r.json()).catch(() => null);
  const m = acct?.balances?.mainnet;
  if (m != null && m > mainnet) { console.log("  ✅ Créditos mainnet AHORA:", m); break; }
  console.log(`  intento ${i + 1}/15 — mainnet: ${m} (esperando…)`);
  await new Promise((r) => setTimeout(r, 4000));
}
console.log("\n=== LISTO ===");

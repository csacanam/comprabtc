import { createPublicClient, createWalletClient, http, parseEventLogs, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { toDataSuffix } from "@celo/attribution-tags";
import { config, USDT, WBTC, QUOTER_V2, POOL_FEE } from "./config.js";
import { dcaExecutorAbi, quoterV2Abi, erc20Abi } from "./abi.js";

export const keeperAccount = privateKeyToAccount(config.keeperPrivateKey);

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(config.rpcUrl),
});

export const walletClient = createWalletClient({
  account: keeperAccount,
  chain: celo,
  transport: http(config.rpcUrl),
});

// Sufijo ERC-8021: se anexa al calldata de cada tx del keeper (Track 1).
// Soporta varios códigos separados por coma (ej. "comprabtc,celo_asignado") —
// los programas solo acreditan SU código asignado; el nuestro mantiene analytics.
const attributionCodes = config.attributionCode.split(",").map((c) => c.trim()).filter(Boolean);
export const attributionSuffix = toDataSuffix(
  attributionCodes.length === 1 ? attributionCodes[0] : attributionCodes,
) as Hex;

export interface OnChainPlan {
  amountPerRun: bigint;
  minInterval: bigint;
  lastRun: bigint;
  active: boolean;
  tokenOut: `0x${string}`;
  poolFee: number;
}

export async function readPlan(user: `0x${string}`): Promise<OnChainPlan> {
  const [amountPerRun, minInterval, lastRun, active, tokenOut, poolFee] =
    await publicClient.readContract({
      address: config.executorAddress,
      abi: dcaExecutorAbi,
      functionName: "plans",
      args: [user],
    });
  return {
    amountPerRun,
    minInterval: BigInt(minInterval),
    lastRun: BigInt(lastRun),
    active,
    tokenOut,
    poolFee,
  };
}

let cachedFees: { bps: bigint; flat: bigint; at: number } | null = null;

/** Fees del contrato (bps + flat), cacheados 5 min (cambian rara vez, vía setters del owner). */
export async function readFees(): Promise<{ bps: bigint; flat: bigint }> {
  if (cachedFees && Date.now() - cachedFees.at < 300_000) return cachedFees;
  const [bps, flat] = await Promise.all([
    publicClient.readContract({ address: config.executorAddress, abi: dcaExecutorAbi, functionName: "feeBps" }),
    publicClient.readContract({ address: config.executorAddress, abi: dcaExecutorAbi, functionName: "feeFlat" }),
  ]);
  cachedFees = { bps: BigInt(bps), flat: BigInt(flat), at: Date.now() };
  return cachedFees;
}

export async function readUserFunds(user: `0x${string}`) {
  const [balance, allowance] = await Promise.all([
    publicClient.readContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [user] }),
    publicClient.readContract({
      address: USDT,
      abi: erc20Abi,
      functionName: "allowance",
      args: [user, config.executorAddress],
    }),
  ]);
  return { balance, allowance };
}

/** Quote real del pool USDT→WBTC vía QuoterV2 (eth_call a función nonpayable). */
export async function quoteUsdtToWbtc(amountIn: bigint): Promise<bigint> {
  const { result } = await publicClient.simulateContract({
    address: QUOTER_V2,
    abi: quoterV2Abi,
    functionName: "quoteExactInputSingle",
    args: [{ tokenIn: USDT, tokenOut: WBTC, amountIn, fee: POOL_FEE, sqrtPriceLimitX96: 0n }],
  });
  return result[0];
}

/** Precio spot aproximado en USDT (6 dec) por 1 BTC, derivado del quote de $100. */
export async function btcSpotPriceUsdt(): Promise<number> {
  const probe = 100_000_000n; // $100
  const sats = await quoteUsdtToWbtc(probe);
  if (sats === 0n) throw new Error("quote returned 0");
  // USDT por BTC = (100 / sats) * 1e8, en unidades humanas
  return (100 * 1e8) / Number(sats);
}

/**
 * Descubre planes creados on-chain (evento PlanCreated) desde `fromBlock`.
 * Permite que cualquier wallet/agente cree su plan directo en el contrato
 * sin tocar nuestro API: el keeper lo adopta solo.
 */
export async function discoverPlans(fromBlock: bigint, toBlock: bigint) {
  const logs = await publicClient.getContractEvents({
    address: config.executorAddress,
    abi: dcaExecutorAbi,
    eventName: "PlanCreated",
    fromBlock,
    toBlock,
  });
  return logs.map((log) => ({
    user: (log.args.user as string).toLowerCase(),
    minInterval: Number(log.args.minInterval),
    amountPerRun: Number(log.args.amountPerRun),
  }));
}

/** Envía execute(user, minOut) con el attribution tag anexado al calldata. */
export async function sendExecute(user: `0x${string}`, minAmountOut: bigint) {
  const { request } = await publicClient.simulateContract({
    account: keeperAccount,
    address: config.executorAddress,
    abi: dcaExecutorAbi,
    functionName: "execute",
    args: [user, minAmountOut],
    dataSuffix: attributionSuffix,
  });
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  let executed: { amountIn: bigint; feeAmount: bigint; amountOut: bigint } | null = null;
  const logs = parseEventLogs({ abi: dcaExecutorAbi, eventName: "Executed", logs: receipt.logs });
  if (logs.length > 0) {
    const { amountIn, feeAmount, amountOut } = logs[0].args;
    executed = { amountIn, feeAmount, amountOut };
  }
  return { hash, receipt, executed };
}

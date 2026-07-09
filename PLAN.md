# CompraBTC — Plan: Agente DCA en Celo

> Redactado: 9 de julio de 2026 (**v4** — solo BTC en el MVP). Contexto inmediato: **Agentic Payments & DeFAI Hackathon de Celo** (transacciones cuentan Jul 7–20, submission 20 de julio 9am GMT, $5K en premios).

---

## 1. Visión de largo plazo

CompraBTC es un agente que acumula **Bitcoin** por el usuario de forma automática:

> "Defino mi plan una vez — *$X cada semana en BTC* — y el agente lo ejecuta para siempre, con mi plata entrando desde mi cuenta bancaria."

```
[Fase 2] Fiat → USDT      (débito recurrente COP/fiat → onramp → wallet del usuario)
[Fase 1] Motor DCA        (executor con allowance + keeper que ejecuta compras programadas)  ← HACKATHON
[Fase 1] Custodia         (la wallet del propio usuario: MiniPay, MetaMask, Valora)
```

**Principio rector:** el motor de ejecución no sabe ni le importa cómo llegó el USDT a la wallet del usuario. Hoy el usuario ya tiene USDT (cripto-nativo); mañana un proveedor fiat deposita a esa misma wallet. Nada del motor cambia entre fases.

| Fase | Qué | Cuándo |
|------|-----|--------|
| **1 — Hackathon (MVP wallet-native)** | Usuario llega con wallet, aprueba allowance de USDT, keeper ejecuta el plan DCA cobrando por cuotas | Ahora → 20 jul |
| **2 — Fiat in + usuarios sin wallet** | Privy (email → embedded wallet) + débito recurrente fiat → USDT (interfaz `DepositProvider`) | Post-hackathon |
| **3 — Distribución** | Listado oficial en MiniPay, retiros a fiat, más activos (ETH/CELO)/chains | Después |

---

## 2. Viabilidad técnica — verificación pieza por pieza

Cada afirmación de este plan fue verificada contra evidencia real el 9 de julio. Leyenda: ✅ verificado · ⚠️ verificado con salvedad.

| # | Pieza | Estado | Evidencia |
|---|-------|--------|-----------|
| 1 | **Usuario aprueba una vez y se le cobra por cuotas, sin depositar el total** | ✅ | `approve` estándar ERC-20 + `transferFrom` por ejecución. El `approve` es una transacción normal (no una firma de mensaje) → funciona en MiniPay. No se necesita Permit2. |
| 2 | **Permit2 como alternativa** | ⚠️ Descartado en fase 1 | Existe en Celo (`0x000000000022D473030F116dDEE9F6B43aC78BA3`, lo usa Uniswap) pero sus permisos requieren firma typed-data (`eth_signTypedData`) y **MiniPay no soporta firma de mensajes** (constraint oficial #4 de docs.minipay.xyz). |
| 3 | **Mismo frontend en MiniPay y browser (MetaMask/Valora)** | ✅ | MiniPay inyecta `window.ethereum` con `isMiniPay === true`; auto-connect con wagmi `injected({ target: "metaMask" })` (patrón oficial). En browser, connector injected normal. |
| 4 | **Transacciones desde MiniPay** | ⚠️ Con 2 reglas | (a) **Solo transacciones legacy** — no enviar campos EIP-1559 (`maxFeePerGas`/`maxPriorityFeePerGas`) cuando `isMiniPay`; (b) gas se paga solo vía fee abstraction (USDm por defecto). El usuario solo firma 2 txs: `approve` + `createPlan`. |
| 5 | **Pool de Uniswap V3 con liquidez para BTC** | ✅ Verificado on-chain (RPC, 9 jul) | USDT/WBTC fee 0.3%: ~3 BTC + $150K USDT (`0x57332c21...`), WBTC = bridge nativo de Celo `0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D` (8 dec). Swap directo single-hop USDT→WBTC. Es el único pool relevante de BTC en Celo → la profundidad ($150K) define el cap por trade. (También verificados por si se amplía el basket después: USDT/WETH 0.01% con $109K y USDT/CELO 0.01%.) |
| 6 | **Facilitator x402 en Celo + pago desde el keeper** | ✅ Verificado contra el facilitator real (9 jul) | API del facilitator en **`https://api.x402.celo.org`** (la raíz x402.celo.org es la web). `/supported` confirma: **x402 v2, scheme `exact`, network `eip155:42220`** (y v1 legacy). Los paquetes v1 (`x402-express`) están deprecados → usamos **`@x402/express` + `@x402/core` + `@x402/evm` + `@x402/fetch` v2.17**. USDT vía EIP-3009 con `extra: { name: "Tether USD", version: "1" }`. Smoke test local pasado: nuestro endpoint devuelve 402 con requirements correctos en el header `PAYMENT-REQUIRED` y el middleware sincroniza contra el facilitator sin errores. El facilitator nunca custodia: el pago llega directo al `payTo`. |
| 7 | **Usuarios de MiniPay NO pueden pagar x402** | ⚠️ Confirmado — por diseño de MiniPay | x402 requiere firma EIP-3009 (typed-data) y MiniPay no la soporta. Por eso los pagos x402 del MVP salen del keeper (agente paga su API de ejecución). Consecuencia aceptada: Track 2 cuenta pero con narrativa de auto-pago. |
| 8 | **Attribution tags (Track 1)** | ✅ | SDK `@celo/attribution-tags` (ERC-8021): sufijo en calldata que la EVM ignora. Keeper (viem): `concat([calldata, tag])`. Frontend (wagmi): parámetro `dataSuffix`. Verificable post-tx con `verifyTx`. El código de atribución lo entregan al registrarse en el hackathon. |
| 9 | **Contrato `DCAExecutor` + SwapRouter02** | ✅ Estándar | SwapRouter02 verificado en `0x5615CDAb10dc425a742d643d949a7F474C01abc4` (docs.celo.org). `exactInputSingle` con `recipient = user`. CELO es ERC-20 nativo (`0x471E...`) — no hay wrapping. Foundry deploya en Celo como cualquier EVM; verificación en Celoscan. |
| 10 | **Gas del keeper y del usuario** | ✅ | Keeper: mantiene CELO para gas (~$0.0005/tx). Usuario browser sin CELO: CIP-64 `feeCurrency` con adapter USDT `0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72` (viem soporta los formatters de Celo). Usuario MiniPay: fee abstraction automática. |
| 11 | **Registro ERC-8004 del agente** | ✅ | Identity Registry en mainnet `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, `register(agentURI)` con metadata compliant en `ipfs://` (type = URI del spec, `services` con `name`+`endpoint`). Costo ~centavos. |
| 12 | **Registro payTo + endpoint para el dashboard del Track 2** | ⚠️ Pendiente de detalle | Técnicamente x402 no requiere registro (protocolo stateless). El registro del hackathon es un paso administrativo de ellos ("register your payTo wallet + endpoint") — se resuelve al registrarnos; preguntar en el Telegram si no es obvio. |
| 13 | **BTC comprado visible para el usuario** | ⚠️ Salvedad MiniPay | MiniPay solo muestra USDT/USDC/USDm en su UI — el WBTC comprado **no aparece en el wallet de MiniPay** (sí está en su dirección, verificable en Celoscan). Nuestro dashboard es la vista del portafolio ("tu bóveda de BTC"). En browser con MetaMask sí puede agregar el token. Para el listado oficial futuro (fase 3) esto requiere conversación con MiniPay; para el hackathon no es problema. |
| 14 | **Decimales** | ✅ | USDT/USDC = 6 · WBTC = 8 (verificado por RPC contra el contrato). |

**Conclusión: no hay ningún bloqueante técnico.** Las tres salvedades operativas (tx legacy en MiniPay, x402 solo desde keeper, portafolio visible solo en nuestro dashboard) están absorbidas por el diseño.

---

## 3. Arquitectura

```
┌─────────────────────────────  Usuario (MiniPay o browser)  ─────────────────────────────┐
│  Frontend Next.js (PWA existente + wagmi)                                               │
│  · auto-connect MiniPay / connect browser     · crear plan: approve + createPlan        │
│  · dashboard portafolio + historial           · pausar/cancelar (approve(0) / cancel)   │
└──────────────────────────────────────┬──────────────────────────────────────────────────┘
                                       │ on-chain (2 txs, una vez)
                     ┌─────────────────▼──────────────────┐
                     │  DCAExecutor.sol (sin custodia)     │◄────────────┐
                     │  · planes con límites on-chain      │             │ execute(user) + attribution tag
                     │  · transferFrom → swap → al usuario │             │
                     └─────────────────┬──────────────────┘   ┌──────────┴──────────┐
                                       │ swap                 │  Keeper (cron)       │
                     ┌─────────────────▼──────────────────┐   │  · lee planes due    │
                     │  Uniswap V3 SwapRouter02            │   │  · paga x402 ────────┼──► /api/execute (x402,
                     └────────────────────────────────────┘   │  · envía execute()   │     facilitator x402.celo.org)
                                                              └─────────────────────┘
                     Supabase: users · plans · executions · deposits
```

### Decisiones (resumen — el detalle de viabilidad está en §2)

- **D1 — Wallet-native, sin Privy en fase 1.** El usuario llega con su wallet. Un solo `approve` con cap = presupuesto del plan; fondos quedan en su wallet; el contrato cobra por cuotas. Cancelar = `approve(0)`. Privy va en fase 2 (usuarios sin wallet).
- **D2 — `DCAExecutor` mínimo + keeper + x402.** Por ejecución: keeper paga x402 a `/api/execute` (Track 2) y llama `execute(user)` → swap USDT→WBTC con attribution tag (Track 1). Límites on-chain (monto por cuota, intervalo) impiden que un keeper comprometido cobre de más.
- **D3 — Solo BTC en el MVP.** Un activo, un pool (USDT/WBTC 0.3%), un swap. Cap por trade ≤$200 por la profundidad del pool (~$150K). El contrato guarda `tokenOut`/`poolFee` por plan (generalizar después es gratis), pero la UI solo ofrece BTC. Bonus: desaparece el problema de mostrar CELO en MiniPay y la marca "CompraBTC" queda 1:1 con el producto.
- **D4 — Gas:** usuario solo firma 2 txs (MiniPay lo abstrae / browser con CIP-64 si no tiene CELO); keeper paga el gas de todas las ejecuciones.
- **D5 — Revenue:** fee del protocolo cobrado **dentro de `execute`**: `feeBps` (ej. 50 = 0.5%) de cada cuota va a la treasury antes del swap. Esto es ingreso real por usuario, independiente del x402 (que es el "costo de API" del agente y el contador del Track 2).

### Stack

| Capa | Elección |
|------|----------|
| Frontend | Next.js PWA existente (`frontend/`) + wagmi/viem, connector injected, auto-connect MiniPay, `dataSuffix` para tags |
| Contrato | Foundry en `contracts/` — `DCAExecutor.sol`, verificado en Celoscan |
| Backend | Next.js route handlers en `backend/` (o mismo deploy del frontend) + Vercel Cron / Railway |
| Keeper | Script Node + viem, EOA con CELO (gas) + USDT (fees x402) |
| x402 | `x402-express`/`settlePayment` (server) + `wrapFetchWithPayment` (keeper), facilitator `https://x402.celo.org` |
| DB | Supabase (Postgres) |
| Precios | `slot0` de los pools (spot) para stop-loss y quotes del MVP |

---

## 4. Alcance del MVP (esto es lo que se construye — ni más ni menos)

### 4.1 Historias de usuario

1. *Como usuario con USDT en mi wallet (MiniPay o MetaMask)*, entro a la web, conecto (o se conecta sola en MiniPay) y veo mi saldo USDT.
2. *Como usuario*, creo un plan: monto por cuota ($5–$200), frecuencia (1h / 6h / 12h / diaria / semanal) y stop-loss opcional (%). Firmo 2 transacciones y quedo listo — el agente compra BTC por mí desde ahí.
3. *Como usuario*, veo mi dashboard: BTC acumulado (sats + valor USD + precio promedio de compra), historial de compras con links a Celoscan, y próxima ejecución.
4. *Como usuario*, pauso o cancelo mi plan en un click, y mis fondos nunca estuvieron fuera de mi wallet.
5. *Como agente (keeper)*, cada 5 minutos reviso planes vencidos, pago la API de ejecución vía x402 y ejecuto las compras on-chain con attribution tag.
6. *Como operador*, si el usuario no tiene saldo/allowance, salto la cuota, marco `no_funds` y sigo — nunca es error fatal.

### 4.2 Contrato `DCAExecutor.sol` (spec)

```solidity
struct Plan {
    uint128 amountPerRun;     // en USDT (6 dec), fijado por el usuario
    uint64  minInterval;      // segundos; el keeper NO puede ejecutar antes
    uint64  lastRun;
    bool    active;
    address tokenOut;         // MVP: siempre WBTC 0x8aC2901D... (la UI no ofrece otro)
    uint24  poolFee;          // MVP: siempre 3000 (pool USDT/WBTC 0.3%)
}

// Usuario (junto con el approve de USDT):
function createPlan(uint128 amountPerRun, uint64 minInterval, address tokenOut, uint24 poolFee) external;
function cancelPlan() external;              // además el usuario puede approve(0)

// Keeper (address fijada en el constructor, cambiable por owner):
function execute(address user, uint256 minAmountOut) external onlyKeeper;
// - require(plan.active && block.timestamp >= lastRun + minInterval)
// - transferFrom(user → contrato) de amountPerRun
// - fee: amountPerRun * feeBps / 10000 → treasury
// - swap exactInputSingle USDT→tokenOut en SwapRouter02, recipient = user, con minAmountOut
// - actualiza lastRun; emite evento Executed(user, amountIn, amountOut)
```

Un solo activo = un solo swap por ejecución: el contrato queda aún más chico (~70 líneas). `tokenOut`/`poolFee` viven en el plan solo para no tener que redeployar cuando se amplíe el basket (fase 3) — la UI del MVP los fija en WBTC.

**Propiedades de seguridad:** el contrato nunca retiene fondos entre ejecuciones; los límites de monto/intervalo son on-chain (un keeper comprometido no puede cobrar más ni más seguido); el WBTC comprado va directo al usuario. **Límite conocido y aceptado:** `minAmountOut` lo calcula el keeper off-chain (quote del pool − slippage máx. 1%) — protección de slippage es de confianza en el keeper en el MVP, no on-chain.

**Pruebas Foundry mínimas:** happy path USDT→WBTC · revert si `minInterval` no venció · revert si no es keeper · skip-behavior con allowance/saldo insuficiente · fee correcto · cancel.

### 4.3 Backend (endpoints)

| Endpoint | Auth | Función |
|----------|------|---------|
| `POST /api/execute` | **x402** ($0.02 USDT, facilitator Celo) | La API de ejecución que el agente paga. Recibe `{ user }`, valida plan due en DB, calcula quotes/minOuts, envía `execute(user)` on-chain con attribution tag, registra en `executions`. |
| `POST /api/plans` | firma de wallet (SIWE simple o verificación de tx) | Registra el plan en DB tras `createPlan` on-chain (frecuencia legible, stop-loss, email opcional). |
| `GET /api/plans/:address` | pública | Plan + historial + portafolio (para el dashboard). |
| Cron cada 5 min | interno | El **agente**: busca planes con `next_run_at <= now` → chequea stop-loss (spot vs. costo promedio) → `fetchWithPayment('/api/execute')` → actualiza `next_run_at`. |

### 4.4 Frontend (pantallas)

1. **Landing/Connect** — pitch de una línea ("tu agente que compra Bitcoin por ti, cada semana, sin que pienses en ello") + botón conectar (oculto en MiniPay: auto-connect). Mobile-first 360×640.
2. **Fondeo** — saldo USDT; si es 0: dirección + QR (en MiniPay: instrucción de depósito nativo).
3. **Crear plan** — monto por cuota, frecuencia, stop-loss opcional → botón que encadena `approve(cap)` + `createPlan` (txs legacy si MiniPay, `dataSuffix` con tag en ambas). Sin selector de activos: es BTC.
4. **Dashboard** — BTC acumulado (sats + valor USD + precio promedio), próxima cuota, historial con links a Celoscan, botones pausar/cancelar.

Se reutiliza la PWA existente en `frontend/` (UI de DCA ya diseñada) adaptando data layer a wagmi + API.

### 4.5 Fuera de alcance del MVP (explícito — no se construye)

- ❌ Fiat (onramp/offramp) — fase 2
- ❌ Privy / login con email — fase 2
- ❌ Permit2, session keys, account abstraction
- ❌ Venta / liquidación automática (el stop-loss **pausa**, no vende)
- ❌ Notificaciones push/email (stretch goal si sobra tiempo: email vía Resend)
- ❌ Listado oficial en MiniPay (solo modo desarrollador + demo)
- ❌ ETH y CELO como activos — **solo BTC** (el contrato ya lo soporta vía `tokenOut`; se activa en fase 3 sin redeploy)
- ❌ Multichain, rebalanceo, límites de precio (limit orders)
- ❌ Panel de administración (se monitorea por DB + Celoscan)

### 4.6 Definición de "hecho" (criterios de aceptación del MVP)

- [ ] Un usuario real en MiniPay (modo dev) y otro en MetaMask crean planes y reciben sus compras automáticamente sin intervención
- [ ] `verifyTx` confirma el attribution tag en las txs de ejecución
- [ ] Los pagos x402 aparecen liquidados on-chain hacia nuestro payTo
- [ ] Contrato verificado en Celoscan; agente visible en 8004scan.io
- [ ] El flujo completo (conectar → plan → 2+ ejecuciones → cancelar) grabado en el demo video

---

## 5. Cronograma (9 → 20 de julio)

> Regla: **mainnet lo antes posible** — solo cuentan transacciones etiquetadas dentro del periodo.

| Día(s) | Entregable |
|--------|-----------|
| **Jul 9 (hoy)** | Plan aprobado. Registro en el hackathon → **attribution code**. Scaffold Foundry + draft `DCAExecutor`. |
| **Jul 10** | Contrato: tests + deploy mainnet + verificación Celoscan. **ERC-8004** (metadata ipfs + register) + **tweet** @CeloDevs/@Celo. |
| **Jul 11–12** | Motor en mainnet: keeper + `/api/execute` con x402 + registro payTo/endpoint. Primeras ejecuciones reales (nuestros planes). |
| **Jul 13** | DB + planes + stop-loss + skip `no_funds`. El agente corre solo. |
| **Jul 14–15** | Frontend completo (4 pantallas), prueba en MiniPay modo dev (ngrok + dispositivo físico), deploy público. |
| **Jul 16** | Usuarios reales (amigos, planes de alta frecuencia con montos reales). |
| **Jul 17–19** | Pulir UX, landing, demo video. Tracks 3–4 (askbots + aigora). Buffer. |
| **Jul 20 (antes 9am GMT)** | **Submit** vía Celo Builders skill. |

---

## 6. Checklist operativo del hackathon

- [ ] Registro (tweet @CeloDevs + @Celo con link ERC-8004) → attribution code
- [ ] Agente en ERC-8004 con metadata `ipfs://` compliant (8004scan.io)
- [ ] Attribution tags en **todas** las txs (verificar con `verifyTx`)
- [ ] payTo + endpoint registrados para el dashboard x402 (preguntar mecanismo en el Telegram)
- [ ] Contrato verificado en Celoscan · Telegram del hackathon
- [ ] Track 3 (askbots.ai) · Track 4 (aigora.org)
- [ ] Opcional: Self Agent ID + Agent Visa
- [ ] Submit final antes del 20 jul 9am GMT

---

## 7. Riesgos y mitigaciones

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Bug en `DCAExecutor` | Media | Contrato mínimo sin custodia + límites on-chain + tests Foundry. Peor caso con keeper comprometido: compra con mal precio (slippage), no robo |
| **Liquidez WBTC ($150K, único pool de BTC en Celo)** — ahora dependencia central | Media-Alta | Cap ≤$200/trade + `minAmountOut` estricto (quote − 1%); micro-cuotas frecuentes en vez de cuotas grandes (además favorece el conteo de txs); monitorear el pool — si la liquidez cae, pausar planes y notificar |
| Slippage/sandwich en ejecuciones (minOut lo fija el keeper) | Media | Quote del pool − 1% máx.; trades pequeños |
| Track 2 débil (x402 = auto-pago del keeper) | — | Aceptado; foco en Track 1. Stretch: setup-fee x402 pagado por usuarios de browser (MetaMask sí firma typed-data) |
| Usuario gasta su USDT | Alta (natural) | Skip + `no_funds` + reintento en la siguiente cuota |
| Mecanismo de registro x402 del hackathon poco claro | Media | Resolver día 1–2 en el Telegram |
| Revisión anti-sybil | — | Solo actividad genuina; usuarios reales; sin wash-trading |
| Tiempo | Alta | Mainnet primero (contrato+keeper sin UI), frontend después; alcance §4.5 congelado |

---

## Changelog

- **v4 (9 jul):** **solo BTC en el MVP** — se eliminan ETH y CELO del basket (quedan para fase 3; el contrato conserva `tokenOut`/`poolFee` por plan para ampliarlo sin redeploy). Contrato más simple (un swap por ejecución, sin allocations), UI sin selector de activos, y desaparece el problema de mostrar CELO en MiniPay. La liquidez del pool USDT/WBTC ($150K, único pool de BTC en Celo) pasa a ser el riesgo central: cap ≤$200/trade y micro-cuotas frecuentes.
- **v3 (9 jul):** verificación técnica completa pieza por pieza (§2) con evidencia: facilitator x402 de Celo documentado (USDT vía EIP-3009, keeper como pagador — confirmado que MiniPay no puede pagar x402), pools Uniswap verificados por RPC (WBTC/WETH/CELO vs USDT), constraints oficiales de MiniPay (tx legacy, sin firma de mensajes, sin CELO en UI, tokens comprados no visibles en su wallet). Alcance MVP detallado (§4): spec del contrato, endpoints, pantallas, fuera-de-alcance y criterios de aceptación. Se agrega fee del protocolo (`feeBps` → treasury) como revenue real.
- **v2 (9 jul):** se elimina Privy de fase 1. Custodia = wallet propia del usuario + allowance al `DCAExecutor` (approve clásico, sin depósito total, MiniPay-compatible; Permit2 descartado por requerir typed-data).
- **v1 (9 jul):** arquitectura original con Privy session signers.

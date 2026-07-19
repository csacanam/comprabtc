# Scripts de operación (ops)

Utilidades de línea de comandos para monitorear y recargar la infraestructura de
pagos. Corren con Node (usan `viem` de `backend/node_modules`).

> **Seguridad — repo público:** estos scripts **no contienen secretos**. Leen las
> claves privadas desde archivos `.env` que están **gitignoreados** (`.env*`):
> `backend/.env` y `contracts/.env`. Nunca imprimen claves, solo direcciones
> públicas. No agregues valores de claves a estos archivos ni los pases por CLI.

## `check-balances.mjs` — chequeo de salud (solo lectura)

```bash
node backend/scripts/check-balances.mjs
```

Muestra, con semáforo de nivel mínimo:

- **CELO** del keeper (gas de `execute()`) · mín 0.2
- **USDT** del keeper (paga los pagos x402) · mín 2
- **WBTC** (sats sueltos) del keeper
- **USDT** del Treasury (payTo)
- **Créditos x402** del facilitator (mainnet/testnet) · mín 100

No mueve fondos. Úsalo antes/después de recargar o cuando llegue una alerta.

## `topup-x402.mjs` — recargar créditos x402

```bash
node backend/scripts/topup-x402.mjs [montoUSD]   # default 2
node backend/scripts/topup-x402.mjs 5            # → 5,000 créditos
```

Deposita USDT desde la wallet **payTo/treasury** al treasury del facilitator
(`0x0d74D5Cefd2e7F24E623330ebE3d8D4cB45fFB48`) y registra el topup. Pasos:

1. **Preflight** — aborta si el signer ≠ `PAY_TO_ADDRESS`, o si falta USDT/CELO.
2. `transfer` de USDT al treasury del facilitator.
3. Espera confirmación on-chain.
4. `GET /api/topup/{txHash}` para acreditar.
5. Poll de `/api/account` hasta ver los créditos nuevos.

### Por qué el signer debe ser payTo

El facilitator acredita la cuenta **según el `from` del depósito on-chain**. La
cuenta x402 está identificada por `PAY_TO_ADDRESS`, así que el depósito tiene que
salir de esa misma dirección. Su clave es `DEPLOYER_PRIVATE_KEY` (en
`contracts/.env`) — la misma wallet que deployó los contratos. Si depositas desde
otra wallet (p. ej. el keeper), el facilitator acredita **otra cuenta** y pierdes
los fondos como créditos. Por eso el script hace el check y aborta.

### Economía

- **1 crédito = $0.001 = 1 settlement** (`pricePerTxMicro: 1000`).
- $1 = 1,000 créditos. A ~240 settles/día (10 usuarios horarios), $2 ≈ 8 días.
- Tokens aceptados por el facilitator: USDC o USDT (Celo mainnet). El script usa USDT.

### Datos de referencia (verificados contra el facilitator, jul 2026)

| Dato | Valor |
|------|-------|
| API cuenta | `GET https://x402.celo.org/api/account?address=<payTo>` |
| API topup | `GET https://x402.celo.org/api/topup/<txHash>` *(el front usa GET, no POST)* |
| API config | `GET https://x402.celo.org/api/config` |
| Treasury facilitator | `0x0d74D5Cefd2e7F24E623330ebE3d8D4cB45fFB48` |
| Créditos gratis iniciales | 500 (mainnet) |

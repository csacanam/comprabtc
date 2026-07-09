# CompraBTC — Unit economics (v3, 9 jul 2026)

> **v3 — pricing definitivo: $0.005 + 1% por ejecución (estilo Stripe).** Contrato **v2 redeployado**: `0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189` (caps on-chain: flat ≤ $0.05, bps ≤ 1%). Razón: nuestros costos son **fijos por ejecución** (~$0.0037 de gas + crédito), no proporcionales — un % solo nunca cubre tickets micro (a $0.10 necesitaría 3.7%) y sería caro en tickets grandes. Con fijo+%: **todo ticket es rentable desde el mínimo de $0.10** (ingreso $0.006 vs costo $0.0037 = +62% margen; take efectivo: 6% a $0.10 → 1.5% a $1 → 1.01% a $50 — la curva clásica de pagos). El contrato revierte si el fee ≥ cuota. Backend lee ambos fees del contrato. Breakeven: **cualquier cuota ≥ $0.10 es rentable**.
>
> **v2 (obsoleto):** fee 1% solo (`setFeeBps(100)` en el contrato v1 `0x3CFAf5...`). Breakeven $0.37 — no cubría el mínimo de $0.10.

> Números medidos en producción el 9 jul 2026. Actualizar si cambia el gas de Celo (hoy 202.5 gwei) o el precio de CELO ($0.066).

## 1. El flujo de dinero por ejecución

Cada cuota ejecutada mueve dinero así:

```
Usuario ──cuota (USDT)──► DCAExecutor ──0.5% fee──► Treasury (nosotros)   ← INGRESO REAL
                              └──99.5%──► Uniswap ──WBTC──► Usuario

Keeper ──$0.02 x402──► payTo (nosotros)                                   ← CIRCULAR (neto $0)
Keeper ──gas──► red Celo                                                  ← COSTO REAL
Facilitator ──1 crédito ($0.001)──► settle on-chain                       ← COSTO REAL
```

**Punto crítico:** en la arquitectura actual el pago x402 **no es ingreso** — el keeper (nuestra wallet) le paga a nuestro payTo. Es un traslado interno cuyo propósito es el conteo del Track 2. El único ingreso real es el **fee de protocolo (0.5%)** cobrado dentro del contrato.

## 2. P&L por ejecución (números de hoy)

| Concepto | Valor | Nota |
|----------|-------|------|
| Ingreso: fee protocolo | 0.5% × cuota | `feeBps=50`, cambiable por owner hasta 1% (cap del contrato) |
| Costo: gas de `execute()` | **$0.00274** | 204,360 gas × 202.5 gwei × CELO $0.066 — lo paga el keeper en CELO |
| Costo: crédito de settlement x402 | **$0.001** | `pricePerTxMicro: 1000`; 500 gratis (quedan 495); recarga: depositar USDC/USDT al treasury del facilitator `0x0d74D5Ce...` + POST `/api/topup/{txHash}` |
| Costo total por ejecución | **≈ $0.0037** | |

### Por tamaño de cuota

| Cuota | Ingreso (0.5%) | Costo | Neto/ejecución | Neto/día (plan horario) |
|-------|---------------|-------|----------------|------------------------|
| $0.10 | $0.0005 | $0.0037 | **−$0.0032** | −$0.077 |
| $0.75 | $0.00375 | $0.0037 | ≈ $0 (**breakeven**) | ≈ $0 |
| $1 | $0.005 | $0.0037 | +$0.0013 | +$0.031 |
| $5 | $0.025 | $0.0037 | +$0.021 | +$0.51 |
| $20 | $0.10 | $0.0037 | +$0.096 | +$2.31 |
| $50 | $0.25 | $0.0037 | +$0.246 | +$5.91 |

**Breakeven actual: cuota ≈ $0.75.** Con fee al 1% (una llamada a `setFeeBps(100)`): breakeven ≈ $0.37.

## 3. Postura para el hackathon (deliberada)

Las cuotas de $0.10 **pierden ~$0.08/día por usuario horario — y está bien**. Es gasto de marketing con retorno directo:

- Un usuario de $0.10/hora genera **$2.40/día de volumen** (Track 1: $3,000) y **24 pagos x402/día** (Track 2: $1,000)
- El "costo por punto de leaderboard" es ridículamente barato comparado con el premio
- Los usuarios de cuota ≥$1 ya son rentables incluso ahora

Presupuesto del subsidio: 10 usuarios horarios de $0.10 durante los 10 días restantes ≈ **$8 de pérdida total** a cambio de $24 × 10 días = $240 de volumen y 2,400 pagos x402. Trivial.

**Vigilar:** los créditos del facilitator (495 restantes). 10 usuarios horarios = 240 settles/día → recargar cada ~2 días. Recarga de 10,000 créditos = $10 en USDC. Agregar chequeo de balance al keeper (endpoint `/api/account?address=`).

## 4. El negocio real (post-hackathon)

Para que esto sea un negocio y no un experimento, las palancas en orden:

1. **Fase 2 con Privy convierte el x402 en ingreso real.** Cuando el usuario tiene embedded wallet (que sí firma typed-data), **el usuario paga el fee x402 por ejecución** — ej. $0.02/cuota — además del fee %. Con eso, incluso la cuota de $0.10 es rentable: ingreso $0.0205 vs costo $0.0037 = **+$0.017/ejecución (82% margen)**. Este es el modelo objetivo: *fee fijo por ejecución + % del monto*, como cualquier exchange.
2. **`setFeeBps(100)`** (1%): duplica el ingreso variable sin tocar el contrato. Referencia de mercado: los DCA de exchanges cobran 1–2% (Binance Auto-Invest ~0.5–1%, Strike ~1.3%, Bitso más). 1% sigue siendo competitivo.
3. **Mínimo rentable en producto normal:** cuando pase el hackathon, volver el mínimo a $1 (o dejar $0.10 solo en el plan horario como gancho, sabiendo su costo).
4. **Optimización de costos:** el gas de Celo hoy está caro en gwei (202.5) pero CELO barato — $0.0027 puede bajar; batching de ejecuciones (un `executeMany`) dividiría el gas fijo entre N usuarios (mejora obvia de contrato v2).

## 5. Reglas de decisión rápidas

- ¿Subir fee a 1% ya? **No durante el hackathon** — la fricción de pricing no aporta al leaderboard y 0.5% suena mejor en el pitch. Sí inmediatamente después.
- ¿Cobrarle el x402 al keeper más caro/barato? Irrelevante — es circular. Dejarlo en $0.02 (se ve bien en el dashboard del track).
- ¿Aceptar usuarios de $0.10? Sí ahora (subsidio de hackathon); post-hackathon solo si pagan fee fijo (fase 2).
- ¿Cuándo recargar créditos? Cuando el balance < 100: depositar $10+ USDC al treasury del facilitator y postear el tx hash.

# CompraBTC — Propuesta de copies: narrativa de ahorro de largo plazo ("la pensión no va a llegar")

> **Para la IA o humano que revise este documento:** aquí está el inventario COMPLETO de los copies actuales de la UI (ES/EN), pantalla por pantalla, con contexto de dónde aparece cada uno, y la propuesta de cambio para adoptar la nueva narrativa. Los copies viven en `frontend/lib/prefs.tsx` (diccionario único ES/EN). Ajusta las propuestas manteniendo las reglas de la sección 2. Los que dicen "sin cambio" se conservan tal cual — solo proponles algo si violan la nueva narrativa o las reglas.

---

## 1. La nueva narrativa (el porqué de este cambio)

**Problema que atacamos:** la gente joven lee todo el tiempo que las pensiones van a colapsar — los sistemas de reparto dependen de que haya muchos jóvenes cotizando por cada pensionado, y la demografía va en la dirección contraria. La conclusión emocional ya está instalada: *"el gobierno no te va a salvar; te toca a ti"*.

**El posicionamiento nuevo:** CompraBTC deja de venderse como "un agente que compra Bitcoin" (un activo) y pasa a venderse como **"el agente que construye tu ahorro de largo plazo, porque la pensión no va a alcanzar"** (un resultado). El gancho es duro; el resto del producto mantiene la calma de siempre.

**La fórmula editorial:** gancho duro SOLO en el hero del landing y en un bloque educativo de la calculadora. Todo lo operativo (crear plan, fondear, presupuesto, errores) conserva el tono tranquilo actual — meter ansiedad pensional en una pantalla de "autorizar cuotas" sería contraproducente.

**Hoy solo Bitcoin, y lo que viene:** el producto hoy compra únicamente Bitcoin. La visión (canasta con oro y dólares digitales) se anuncia como teaser en UNA línea del landing, sin fechas ni promesas: *"Hoy tu agente compra Bitcoin. Pronto también oro y dólares digitales — el mismo plan, la misma billetera."*

---

## 2. Reglas duras (NO negociables para el revisor)

Heredadas de `docs/copy-review-brief.md`:

1. **Nunca "gas"** → "comisión de red" / "network fee" (regla de MiniPay).
2. **Evitar "crypto"/"cripto" como categoría** — hablar de Bitcoin, USDT o "dólares digitales".
3. **No mencionar CELO** (el token) en la UI; la red se llama "red Celo".
4. **Sats por defecto**; el copy hace que "sats" se sienta natural.
5. ES: tuteo, neutro LatAm (base Colombia). EN: neutro/US, casual pero confiable.
6. Términos fijos: ES "cuota" = EN "installment" · "billetera" = "wallet" · "plan" = "plan" · el "agente/agent" siempre en singular como *el* actor.
7. Prohibidos por revisión editorial previa: "DCA", "bóveda", "stop loss", "para siempre", promesas financieras o de seguridad absoluta.

Nuevas, propias de esta narrativa:

8. **El producto NUNCA se llama "pensión"** (término regulado en varios países). La pensión es *el problema* del que hablamos; el producto es *tu ahorro*. Tampoco "fondo de retiro", "jubilación garantizada" ni similares como nombre de feature.
9. **Cuidado con "retiro"** en ES: en apps de dinero significa "withdrawal". Usar "ahorro de largo plazo", "tu futuro", "cuando ya no trabajes". "Retiro" solo si el contexto elimina la ambigüedad.
10. **El miedo nunca promete:** el gancho describe un hecho demográfico verificable (menos jóvenes cotizando), jamás "tu pensión va a desaparecer" como afirmación de futuro ni "Bitcoin te va a pensionar".
11. **El teaser de oro/dólares no promete fechas** y usa "dólares digitales" (término permitido por MiniPay), nunca "stablecoins" en copy de usuario.

---

## 3. Landing (`/` — `frontend/app/page.tsx`)

Primera pantalla para usuarios de browser (en MiniPay se salta directo a la app). Estructura: header con logo · H1 de dos líneas (la segunda resaltada en naranja) · subtítulo · 3 pasos numerados · CTA principal + CTA secundario a la calculadora · nota de custodia · footer.

**Aquí vive el gancho.** Es el único lugar (junto al bloque nuevo del calc) donde se nombra la pensión.

| Clave | Dónde aparece | ES actual | ES propuesto | EN actual | EN propuesto |
|---|---|---|---|---|---|
| `landing.title1` | H1 línea 1 (negro) | Tu agente que compra | **La pensión no va a llegar.** | Your agent that buys | **The pension isn't coming.** |
| `landing.title2` | H1 línea 2 (naranja, el énfasis) | Bitcoin por ti | **Tu ahorro sí.** | Bitcoin for you | **Your savings are.** |
| `landing.subtitle` | Párrafo bajo el H1 | Acumula Bitcoin con compras pequeñas y automáticas, directo a tu billetera. Lo configuras una vez y el agente sigue comprando por ti. | **Cada año hay menos jóvenes cotizando y más personas pensionadas — esa cuenta no da. Por eso existe CompraBTC: un agente que ahorra por ti con compras pequeñas y automáticas de Bitcoin, directo a tu billetera.** | Build Bitcoin with small automatic purchases, straight to your wallet. Set it once, and your agent keeps buying for you. | **Every year there are fewer young workers supporting more retirees — that math doesn't add up. That's why CompraBTC exists: an agent that saves for you with small, automatic Bitcoin purchases, straight to your wallet.** |
| `landing.step1` | Paso 1 de 3 | Conecta tu billetera | sin cambio | Connect your wallet | sin cambio |
| `landing.step2` | Paso 2 de 3 | Elige cuánto comprar y cada cuánto | **Elige cuánto apartar y cada cuánto** | Choose how much to buy and how often | **Choose how much to set aside and how often** |
| `landing.step3` | Paso 3 de 3 | El agente compra Bitcoin y lo envía directo a tu billetera | sin cambio | The agent buys Bitcoin and sends it straight to your wallet | sin cambio |
| `landing.cta` | Botón principal | Crear mi plan | **Empezar hoy** | Create my plan | **Start today** |
| `landing.note` | Texto pequeño bajo el CTA | Sin custodia: tu dinero sigue en tu billetera y bajo tu control | **Sin custodia: nadie puede tocar tu ahorro — ni un fondo, ni un gobierno, ni nosotros.** | Non-custodial: your money stays in your wallet and under your control | **Non-custodial: no one can touch your savings — not a fund, not a government, not even us.** |
| `landing.roadmap` | **CLAVE NUEVA** — caja punteada discreta bajo la nota de custodia (requiere agregar un `<p>` en `page.tsx`) | *(no existe)* | **Hoy tu agente compra Bitcoin. Pronto también oro y dólares digitales — el mismo plan, la misma billetera.** | *(no existe)* | **Today your agent buys Bitcoin. Soon, gold and digital dollars too — same plan, same wallet.** |
| `landing.footer` | Footer | Sobre la red Celo · Impulsado por un agente autónomo | sin cambio | Built on the Celo network · Powered by an autonomous agent | sin cambio |

**Racional del hero:** problema en negro, esperanza en el naranja de la marca. "Tu ahorro sí [va a llegar]" funciona porque el agente lo hace automático — no depende de la disciplina del usuario. La nota de custodia ahora hace doble trabajo: seguridad + narrativa ("ni un gobierno").

---

## 4. Navegación (tab bar inferior de la app)

Etiquetas de una palabra; sin carga narrativa. **Todas sin cambio.**

| Clave | ES | EN |
|---|---|---|
| `nav.home` | Inicio | Home |
| `nav.plan` | Mi plan | My plan |
| `nav.fund` | Agregar USDT | Add USDT |
| `nav.settings` | Ajustes | Settings |

---

## 5. Conexión (pantalla de conectar billetera — solo browser; en MiniPay conecta sola)

| Clave | Dónde aparece | ES actual | ES propuesto | EN actual | EN propuesto |
|---|---|---|---|---|---|
| `connect.title` | Título | Conecta tu billetera | sin cambio | Connect your wallet | sin cambio |
| `connect.subtitle` | Subtítulo | Tu agente de Bitcoin funciona desde tu propia billetera. Tú mantienes el control de tus fondos. | **Tu agente de ahorro funciona desde tu propia billetera. Tú mantienes el control de tus fondos.** | Your Bitcoin agent works from your own wallet. You stay in control of your funds. | **Your savings agent works from your own wallet. You stay in control of your funds.** |
| `connect.button` | Botón | Conectar billetera | sin cambio | Connect wallet | sin cambio |
| `connect.loading` | Estado de carga | Cargando… | sin cambio | Loading… | sin cambio |

---

## 6. Dashboard (`/app` — pantalla principal con el acumulado y el historial)

Es la pantalla que el usuario ve a diario. Celebra la acumulación, no el precio. Cambios mínimos: alinear el vocabulario a "ahorro" sin tocar lo operativo.

| Clave | Dónde aparece | ES actual | ES propuesto | EN actual | EN propuesto |
|---|---|---|---|---|---|
| `dash.emptyTitle` | Título cuando no hay plan | Tu agente de Bitcoin | **Tu agente de ahorro** | Your Bitcoin agent | **Your savings agent** |
| `dash.emptySubtitle` | Subtítulo cuando no hay plan | Crea un plan una vez y el agente comprará Bitcoin por ti mientras esté activo. | sin cambio | Create a plan once, and the agent will buy Bitcoin for you while it's active. | sin cambio |
| `dash.noPlan` | Aviso sin plan | Aún no tienes un plan activo | sin cambio | You don't have an active plan yet | sin cambio |
| `dash.noPlanHint` | Hint bajo el aviso | Compras automáticas desde $0.10 USDT, directo a tu billetera. | sin cambio | Automatic purchases from $0.10 USDT, straight to your wallet. | sin cambio |
| `dash.createPlan` | Botón crear plan | Crear mi plan | sin cambio | Create my plan | sin cambio |
| `dash.fundFirst` | Aviso sin USDT | Primero agrega USDT a tu billetera | sin cambio | First, add USDT to your wallet | sin cambio |
| `dash.fundFirstHint` | Hint del aviso | Necesitas USDT en la red Celo para que el agente pueda comprar Bitcoin. | sin cambio | You need USDT on the Celo network so the agent can buy Bitcoin. | sin cambio |
| `dash.fundCta` | Botón fondear | Agregar USDT | sin cambio | Add USDT | sin cambio |
| `dash.vault` | Título de la tarjeta principal (el acumulado) | Tu acumulado de Bitcoin | **Tu ahorro en Bitcoin** | Your Bitcoin stack | **Your Bitcoin savings** |
| `dash.accumulated` | Métrica | Sats acumulados | sin cambio | Sats stacked | sin cambio |
| `dash.avgPrice` | Métrica | Precio promedio | sin cambio | Average price | sin cambio |
| `dash.currentPrice` | Métrica | Precio actual | sin cambio | Current price | sin cambio |
| `dash.invested` | Métrica | Total invertido | **Total apartado** *(opcional: "invertido" suena a trading; "apartado" suena a ahorro)* | Total invested | **Total set aside** *(opcional)* |
| `dash.available` | Métrica | USDT disponible | sin cambio | USDT available | sin cambio |
| `dash.planInactive` | Aviso plan inactivo | Tu plan está inactivo | sin cambio | Your plan is inactive | sin cambio |
| `dash.planInactiveHint` | Hint | Tu Bitcoin sigue en tu billetera. Crea un plan nuevo para que el agente siga comprando. | sin cambio | Your Bitcoin is still in your wallet. Create a new plan so the agent keeps buying. | sin cambio |
| `dash.reactivate` | Botón | Reactivar mi plan | sin cambio | Reactivate my plan | sin cambio |
| `dash.lowBalance` | Aviso saldo bajo | No hay suficiente USDT para la próxima cuota | sin cambio | Not enough USDT for the next installment | sin cambio |
| `dash.lowBalanceHint` | Hint | El agente pausará las compras hasta que agregues más USDT a tu billetera. | sin cambio | The agent will pause purchases until you add more USDT to your wallet. | sin cambio |
| `dash.fundNow` | Botón | Agregar USDT ahora | sin cambio | Add USDT now | sin cambio |
| `dash.history` | Título del historial | Compras automáticas | sin cambio | Automatic purchases | sin cambio |
| `dash.historyEmpty` | Historial vacío | Tu primera compra se ejecutará pronto. No tienes que hacer nada más. | sin cambio | Your first purchase will run soon. You don't need to do anything else. | sin cambio |
| `dash.viewTx` | Link por compra | Ver compra en Celoscan | sin cambio | View purchase on Celoscan | sin cambio |
| `dash.loadMore` | Botón paginación | Ver más compras ({n} restantes) | sin cambio | Show more purchases ({n} remaining) | sin cambio |

### Estados de cada compra en el historial (`status.*`) — todos sin cambio

| Clave | ES | EN |
|---|---|---|
| `status.success` | Comprado | Bought |
| `status.skipped_no_funds` | Sin saldo USDT | No USDT balance |
| `status.skipped_no_allowance` | Presupuesto agotado | Budget used up |
| `status.skipped_stop_loss` | Pausada por precio | Paused by price |
| `status.failed` | Fallida | Failed |

---

## 7. Plan (`/app/plan` — ver, crear y editar el plan)

Pantalla operativa: aquí el usuario firma y autoriza dinero. **Tono tranquilo intacto — cero narrativa pensional.** Solo dos toques de vocabulario.

| Clave | Dónde aparece | ES actual | ES propuesto | EN actual | EN propuesto |
|---|---|---|---|---|---|
| `plan.title` | Título vista plan | Tu plan de Bitcoin | **Tu plan de ahorro** | Your Bitcoin plan | **Your savings plan** |
| `plan.createTitle` | Título crear plan | Crea tu plan de Bitcoin | **Crea tu plan de ahorro** | Create your Bitcoin plan | **Create your savings plan** |
| `plan.whyTitle` | Bloque educativo al crear plan | Por qué comprar poco a poco ayuda | sin cambio | Why buying little by little helps | sin cambio |
| `plan.whyBody` | Cuerpo del bloque | Comprar Bitcoin de forma periódica evita depender de un solo momento del mercado. Con el tiempo, puede ayudar a suavizar tu precio promedio y reducir decisiones impulsivas. | **Ahorrar de forma periódica evita depender de un solo momento del mercado y convierte el ahorro en un hábito que no requiere fuerza de voluntad. Con el tiempo, puede ayudar a suavizar tu precio promedio.** | Buying Bitcoin regularly means you don't depend on a single market moment. Over time, it can help smooth your average price and reduce impulsive decisions. | **Saving regularly means you don't depend on a single market moment — and it turns saving into a habit that needs no willpower. Over time, it can help smooth your average price.** |

Sin cambio (se listan completos para el inventario):

| Clave | ES | EN |
|---|---|---|
| `plan.state` | Estado | Status |
| `plan.active` | Activo | Active |
| `plan.amountPerRun` | Compra por cuota | Purchase per installment |
| `plan.frequency` | Frecuencia | Frequency |
| `plan.nextRun` | Próxima compra | Next purchase |
| `plan.soon` | Pronto | Soon |
| `plan.custodyTitle` | Tus fondos, tu control | Your funds, your control |
| `plan.custodyBody` | Tu USDT sigue en tu billetera. Cada compra de Bitcoin llega directo a ella, y puedes detener el plan cuando quieras. | Your USDT stays in your wallet. Each Bitcoin purchase goes straight back to it, and you can stop the plan anytime. |
| `plan.cancel` | Detener plan | Stop plan |
| `plan.cancelHint` | Podrás crear un plan nuevo cuando quieras. | You can create a new plan anytime. |
| `plan.cancelError` | No se pudo detener el plan. Inténtalo de nuevo. | Couldn't stop the plan. Please try again. |
| `plan.createSubtitle` | Elige cuánto quieres comprar y cada cuánto. El agente se encarga de hacerlo por ti. | Choose how much you want to buy and how often. The agent takes care of it for you. |
| `plan.amountLabel` | ¿Cuánto quieres comprar por cuota? (USDT) | How much do you want to buy per installment? (USDT) |
| `plan.amountHint` | De ${min} a ${max} USDT por cuota | From ${min} to ${max} USDT per installment |
| `plan.amountError` | El monto debe estar entre ${min} y ${max} USDT | Amount must be between ${min} and ${max} USDT |
| `plan.frequencyLabel` | ¿Cada cuánto quieres comprar? | How often do you want to buy? |
| `plan.frequencyHint` | Comprar poco y seguido ayuda a suavizar el precio promedio | Buying small amounts regularly helps smooth your average price |
| `plan.budgetLabel` | ¿Cuántas cuotas quieres autorizar? | How many installments do you want to authorize? |
| `plan.budgetHint` | Esto define el máximo que el agente puede usar. No se cobra por adelantado y tus fondos siguen en tu billetera. | This sets the maximum the agent can use. You are not charged upfront, and your funds stay in your wallet. |
| `plan.budgetOption` | {n} cuotas | {n} installments |
| `plan.budgetError` | El número de cuotas debe estar entre {min} y {max} | The number of installments must be between {min} and {max} |
| `plan.amountPlaceholder` | Ej: 5 | e.g. 5 |
| `plan.budgetPlaceholder` | Ej: 100 | e.g. 100 |
| `plan.balanceOk` | Tienes ${balance} en tu billetera — te alcanza para todas las cuotas autorizadas. | You have ${balance} in your wallet — enough for every authorized installment. |
| `plan.balancePartial` | Hoy tienes ${balance}: te alcanza para las primeras {runs} cuotas. Tranquilo — puedes agregar USDT cuando quieras; si una cuota te encuentra sin saldo, el agente la salta y sigue en la próxima. | You have ${balance} today: enough for the first {runs} installments. No worries — add USDT whenever you want; if an installment finds no balance, the agent skips it and continues on the next one. |
| `plan.balanceNone` | Aún no tienes USDT en tu billetera. Puedes crear el plan igual y fondear después — el agente salta las cuotas sin saldo y sigue cuando haya. | You don't have USDT in your wallet yet. You can still create the plan and fund later — the agent skips unfunded installments and resumes when there's balance. |
| `plan.budgetLeft` | Presupuesto restante | Remaining budget |
| `plan.budgetLeftValue` | {n} cuotas | {n} installments |
| `plan.budgetEmpty` | El presupuesto que autorizaste ya se usó completo: el agente no puede seguir comprando hasta que autorices más. | The budget you authorized is fully used: the agent can't keep buying until you authorize more. |
| `plan.budgetLow` | Quedan pocas cuotas autorizadas — renueva el presupuesto para que el agente no se detenga. | Few authorized installments left — renew the budget so the agent doesn't stop. |
| `plan.edit` | Editar plan | Edit plan |
| `plan.editTitle` | Edita tu plan | Edit your plan |
| `plan.editSubtitle` | Cambia el monto, la frecuencia o el presupuesto. Dos firmas y el agente sigue con la nueva configuración. | Change the amount, frequency or budget. Two signatures and the agent continues with the new setup. |
| `plan.editSubmit` | Guardar cambios | Save changes |
| `plan.editBack` | Volver sin cambios | Back without changes |
| `plan.renew` | Autorizar presupuesto para {n} cuotas | Authorize budget for {n} installments |
| `plan.renewHint` | Tu presupuesto quedará en {n} cuotas exactas (${total} USDT como máximo) — reemplaza lo que quedaba. Los fondos siguen en tu billetera. | Your budget will be exactly {n} installments (${total} USDT max) — it replaces what was left. Funds stay in your wallet. |
| `plan.renewError` | No se pudo autorizar el presupuesto. Revisa tu billetera e intenta de nuevo. | Couldn't authorize the budget. Check your wallet and try again. |
| `plan.summary` | Autorizarás hasta <b>${total} USDT</b> para este plan: {runs} cuotas de <b>${amount}</b> ({freq}). Firmarás 2 transacciones. | You'll authorize up to <b>${total} USDT</b> for this plan: {runs} installments of <b>${amount}</b> ({freq}). You'll sign 2 transactions. |
| `plan.submit` | Activar compras automáticas | Activate automatic purchases |
| `plan.feeNote` | Sin cobros escondidos: esta es la única comisión y está fijada en el código — nadie puede subirla a escondidas. | No hidden charges: this is the only commission and it's locked in code — no one can quietly raise it. |
| `plan.feePerRun` | Comisión: {fee} por cuota ({pct}% de tu compra) | Commission: {fee} per installment ({pct}% of your purchase) |
| `plan.feeTip` | Tip: con cuotas de {amount} la comisión baja a {pct}%. Tú decides — cuotas chicas también funcionan. | Tip: with {amount} installments the commission drops to {pct}%. Your call — small installments work too. |
| `plan.submitError` | No se pudo crear el plan. Revisa tu billetera e inténtalo de nuevo. | Couldn't create the plan. Check your wallet and try again. |
| `plan.approving` | Autorizando límite de USDT… (1/2) | Authorizing USDT limit… (1/2) |
| `plan.creating` | Creando plan… (2/2) | Creating plan… (2/2) |
| `plan.registering` | Activando agente… | Activating agent… |

### Frecuencias (`freq.*`) — todas sin cambio

| Clave | ES | EN |
|---|---|---|
| `freq.3600` | Cada hora | Every hour |
| `freq.21600` | Cada 6 horas | Every 6 hours |
| `freq.43200` | Cada 12 horas | Every 12 hours |
| `freq.86400` | Diario | Daily |
| `freq.604800` | Semanal | Weekly |

---

## 8. Fondeo (`/app/fund` — agregar USDT)

Pantalla operativa. **Todas sin cambio** (una excepción menor propuesta en `fund.subtitle`).

| Clave | Dónde aparece | ES actual | ES propuesto | EN actual | EN propuesto |
|---|---|---|---|---|---|
| `fund.title` | Título | Agrega USDT a tu billetera | sin cambio | Add USDT to your wallet | sin cambio |
| `fund.subtitle` | Subtítulo | El agente usa el USDT de tu billetera para comprar Bitcoin, cuota por cuota. | **El agente usa el USDT de tu billetera para construir tu ahorro, cuota por cuota.** *(opcional)* | The agent uses the USDT in your wallet to buy Bitcoin, installment by installment. | **The agent uses the USDT in your wallet to build your savings, installment by installment.** *(opcional)* |
| `fund.balance` | Métrica | Saldo disponible | sin cambio | Available balance | sin cambio |
| `fund.network` | Etiqueta | USDT en la red Celo | sin cambio | USDT on the Celo network | sin cambio |
| `fund.minipayTitle` | Bloque MiniPay | Agrega USDT desde MiniPay | sin cambio | Add USDT from MiniPay | sin cambio |
| `fund.minipayBody` | Cuerpo | Usa la opción Depositar de MiniPay para agregar USDT con tu método de pago local. Tu saldo aparecerá aquí automáticamente. | sin cambio | Use MiniPay's Deposit option to add USDT with your local payment method. Your balance will appear here automatically. | sin cambio |
| `fund.sendTitle` | Bloque envío directo | Envía USDT en la red Celo a tu dirección | sin cambio | Send USDT on the Celo network to your address | sin cambio |
| `fund.copy` / `fund.copied` | Botón copiar | Copiar dirección / Dirección copiada | sin cambio | Copy address / Address copied | sin cambio |
| `fund.warning` | Advertencia | Importante: envía únicamente USDT en la red Celo. Si usas otra red, los fondos podrían perderse. | sin cambio | Important: only send USDT on the Celo network. If you use another network, your funds may be lost. | sin cambio |
| `fund.refresh` | Botón | Actualizar saldo | sin cambio | Refresh balance | sin cambio |
| `fund.custodyTitle` | Bloque custodia | Tus fondos, tu control | sin cambio | Your funds, your control | sin cambio |
| `fund.custodyBody` | Cuerpo | Tu USDT permanece en tu billetera hasta el momento de cada compra. El contrato solo puede usarlo dentro del límite que autorizaste. | sin cambio | Your USDT stays in your wallet until each purchase. The contract can only use it within the limit you authorized. | sin cambio |

---

## 9. Ajustes (`/app/settings`)

Un solo cambio: el footer, que es la "firma" del producto.

| Clave | Dónde aparece | ES actual | ES propuesto | EN actual | EN propuesto |
|---|---|---|---|---|---|
| `settings.footer` | Firma al pie | CompraBTC · Agente de compras automáticas sobre la red Celo | **CompraBTC · Tu agente de ahorro en Bitcoin sobre la red Celo** | CompraBTC · Automatic purchase agent on the Celo network | **CompraBTC · Your Bitcoin savings agent on the Celo network** |

Sin cambio:

| Clave | ES | EN |
|---|---|---|
| `settings.title` | Ajustes | Settings |
| `settings.wallet` | Billetera conectada | Connected wallet |
| `settings.viaMiniPay` | Conectada vía MiniPay | Connected via MiniPay |
| `settings.via` | Conectada vía {name} | Connected via {name} |
| `settings.disconnect` | Desconectar | Disconnect |
| `settings.plan` | Tu plan | Your plan |
| `settings.planBody` | Gestiona o detén tu plan de compras automáticas. | Manage or stop your automatic purchase plan. |
| `settings.goToPlan` | Ir a mi plan | Go to my plan |
| `settings.language` | Idioma | Language |
| `settings.units` | Unidad de Bitcoin | Bitcoin unit |
| `settings.unitsSats` | Satoshis (sats) | Satoshis (sats) |
| `settings.unitsBtc` | BTC | BTC |
| `settings.transparency` | Transparencia y control | Transparency and control |
| `settings.transparencyBody` | CompraBTC es sin custodia: el contrato que ejecuta tus compras es público y verificado. Tus fondos solo se mueven dentro de los límites que tú autorizaste. | CompraBTC is non-custodial: the contract that runs your purchases is public and verified. Your funds only move within the limits you authorized. |
| `settings.viewContract` | Ver contrato en Celoscan | View contract on Celoscan |
| `settings.telegram` … `settings.telegramConnect` | (bloque Telegram completo: conectar bot, pasos 1-3, mensaje de prueba) — sin cambio | (idem EN) |

---

## 10. Stats (`/stats` — página pública de métricas)

**Todas sin cambio.** Es la página de transparencia; el lenguaje factual es correcto.

| Clave | ES | EN |
|---|---|---|
| `stats.title` | CompraBTC en números | CompraBTC in numbers |
| `stats.subtitle` | Actividad real del agente, verificable on-chain. | Real agent activity, verifiable on-chain. |
| `stats.purchases` | Compras ejecutadas | Purchases executed |
| `stats.volume` | Volumen comprado | Volume purchased |
| `stats.sats` | Sats acumulados por usuarios | Sats stacked by users |
| `stats.activePlans` | Planes activos | Active plans |
| `stats.users` | Usuarios | Users |
| `stats.x402` | Pagos x402 liquidados | x402 payments settled |
| `stats.btcPrice` | Precio BTC | BTC price |
| `stats.viewContract` | Ver contrato verificado | View verified contract |

---

## 11. Calculadora (`/calc` — simulador público, la herramienta de adquisición)

Página pública con la simulación histórica ("¿y si hubieras empezado antes?") + dos bloques educativos: "¿Por qué la gente guarda en Bitcoin?" (3 tarjetas con emoji) y "¿Y por qué con CompraBTC?" (3 tarjetas). **Aquí entra la segunda dosis de narrativa: un bloque pensional NUEVO como primera tarjeta del primer grupo.**

| Clave | Dónde aparece | ES actual | ES propuesto | EN actual | EN propuesto |
|---|---|---|---|---|---|
| `calc.title` | H1 (también es el CTA secundario del landing) | ¿Y si hubieras empezado antes? | sin cambio — encaja perfecto con la nueva narrativa | What if you had started earlier? | sin cambio |
| `calc.subtitle` | Bajo el H1 | Así crecería tu ahorro comprando Bitcoin automáticamente, poquito a poquito, cada hora. | **Así crecería tu ahorro de largo plazo comprando Bitcoin automáticamente, poquito a poquito, cada hora.** | This is how your savings would grow buying Bitcoin automatically, little by little, every hour. | **This is how your long-term savings would grow buying Bitcoin automatically, little by little, every hour.** |
| `calc.btc0t` / `calc.btc0b` | **CLAVE NUEVA** — primera tarjeta de "¿Por qué la gente guarda en Bitcoin?", emoji sugerido 🏛️ (requiere agregar `{ key: 'btc0', emoji: '🏛️' }` al array `WHY_BTC` en `calc/page.tsx`) | *(no existe)* | **T: Porque la pensión ya no es un plan** · **B: Las pensiones dependen de que haya muchos jóvenes cotizando por cada pensionado — y cada año hay menos. Un ahorro propio no depende de nadie: empiezas hoy y es tuyo desde el primer día.** | *(no existe)* | **T: Because a pension is no longer a plan** · **B: Pension systems depend on many young workers contributing for every retiree — and every year there are fewer. Savings of your own depend on no one: you start today, and they're yours from day one.** |
| `calc.btc1t` / `btc1b` | Tarjeta 🪙 | Nadie puede imprimir más / Solo existirán 21 millones de bitcoins… | sin cambio | No one can print more / Only 21 million bitcoins will ever exist… | sin cambio |
| `calc.btc2t` / `btc2b` | Tarjeta 🌍 | No es de ningún gobierno ni empresa / Nadie puede decidir devaluarlo, congelarlo ni imprimir más… | sin cambio | It doesn't belong to any government or company / … | sin cambio |
| `calc.btc3t` / `btc3b` | Tarjeta 🛡️ | Cuida el valor de tu esfuerzo / Los precios suben y la plata guardada pierde fuerza cada año… | sin cambio | Protects the value of your effort / … | sin cambio |
| `calc.whyUsTitle` + `us1-us3` | Bloque "¿Y por qué con CompraBTC?" (🧘 sin adivinar el momento · 🔑 llega a tu billetera · 🔍 comisión clara) | sin cambio | sin cambio | sin cambio | sin cambio |
| `calc.cta` | CTA final | Empieza hoy — crea tu plan | sin cambio | Start today — create your plan | sin cambio |
| `calc.disclaimer` | Disclaimer | Cálculo con precios históricos reales de Bitcoin. El comportamiento pasado no garantiza resultados futuros. | sin cambio — **no quitar nunca** | Calculated with real historical Bitcoin prices. Past performance does not guarantee future results. | sin cambio |
| resto (`calc.amountLabel`, `periodLabel`, `period365/1095/1825`, `loading`, `invested`, `wouldHave`, `change`, `purchases`, `seriesInvested`, `seriesWorth`, `error`) | controles y resultados del simulador | sin cambio | | sin cambio | |

---

## 12. Cambios de código necesarios (además del diccionario)

1. `frontend/app/page.tsx`: agregar un `<p>` para `landing.roadmap` bajo la nota de custodia (sugerido: caja con borde punteado discreto, `text-sm text-muted-foreground`).
2. `frontend/app/calc/page.tsx`: agregar `{ key: 'btc0', emoji: '🏛️' }` como primer elemento del array `WHY_BTC` (el render ya es dinámico, no hay más cambios).
3. `frontend/lib/prefs.tsx`: agregar las claves nuevas `landing.roadmap`, `calc.btc0t`, `calc.btc0b` en ES y EN, y actualizar el comentario editorial del diccionario con las reglas de la sección 2.
4. Verificación: `npx tsc --noEmit` en `frontend/` (ya validado con estos textos: pasa limpio).

---

## 13. Preguntas abiertas para la revisión

1. **Hero:** ¿"La pensión no va a llegar. / Tu ahorro sí." es demasiado duro para la marca "tranquilidad", o es exactamente el gancho? Alternativas consideradas: "La pensión de tus abuelos / no va a existir para ti" (más generacional, más largo) · "Nadie va a construir / tu retiro por ti" (usa "retiro", ambiguo con withdrawal).
2. **`dash.invested` → "Total apartado":** ¿vale el cambio o "invertido" es más claro aunque suene a trading?
3. **El teaser de oro/dólares:** ¿en el landing basta, o también una línea en el dashboard (donde el usuario recurrente lo vería)? Riesgo: prometer features en la pantalla diaria genera "¿y cuándo?".
4. **EN del hero:** "The pension isn't coming. / Your savings are." — en mercados donde se dice "social security" (EE.UU.) el término "pension" suena británico. ¿Dejar "pension" (global) o algo neutro tipo "Retirement isn't coming on its own"?

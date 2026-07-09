# CompraBTC — Brief para revisión de copies (ES/EN)

> **Instrucción para el revisor (IA o humano):** revisa todos los textos de la interfaz listados abajo en español e inglés. Evalúa claridad, tono, consistencia terminológica y poder de conversión para el público objetivo descrito. Propón mejoras concretas texto por texto (no reescrituras totales del producto). Señala también inconsistencias entre el ES y el EN.

---

## 1. Qué es CompraBTC

CompraBTC es un **agente autónomo que compra Bitcoin por el usuario, automáticamente y para siempre**. El usuario conecta su billetera (MiniPay o MetaMask), define un plan una sola vez —cuánto por cuota (desde $1 USDT), con qué frecuencia (desde cada hora hasta semanal), y opcionalmente una pausa automática si el precio cae— y firma 2 transacciones. Desde ahí el agente ejecuta cada compra solo: cobra la cuota en USDT desde la billetera del usuario, compra Bitcoin y lo deposita **directo en la billetera del usuario**.

**Diferenciales clave que los copies deben transmitir:**
- **Set-and-forget real:** configuras una vez, el agente trabaja para siempre. Cero esfuerzo continuo.
- **No-custodial:** los fondos nunca salen de la billetera del usuario. No hay depósito a terceros. Cancelar es instantáneo y el usuario siempre tiene el control (el contrato es público y verificado).
- **Micro-montos:** desde $1 USDT por cuota. Acumular Bitcoin no requiere capital.
- **Anti-ansiedad:** el producto existe para que el usuario NO mire el precio. El dashboard celebra la acumulación (sats), no el trading.

## 2. Público objetivo

**Personas que quieren comprar Bitcoin y desentenderse.** No son traders ni cripto-expertos:
- Creen en Bitcoin a largo plazo pero no quieren pensar en cuándo comprar, ni mirar gráficas, ni sentir el estrés del precio.
- Pueden ser nuevos en cripto (usuarios de MiniPay en mercados emergentes, LatAm principalmente) o tener algo de experiencia (usuario de MetaMask) — pero en ambos casos buscan **simplicidad y confianza**, no sofisticación.
- Les asusta: perder el control de su dinero, las estafas, la jerga técnica, y equivocarse.
- Les motiva: el hábito ("ahorrar sin darme cuenta"), ver crecer su acumulado, y la sensación de estar haciendo lo correcto a largo plazo.

**Implicaciones para el copy:** lenguaje simple y humano, cero jerga innecesaria, tono cálido pero directo, énfasis constante en control y seguridad ("tu billetera", "tu control"), y celebrar el progreso acumulado.

## 3. Reglas duras de terminología

1. **Nunca "gas"** → decir "network fee" / "comisión de red" (regla de MiniPay).
2. **Evitar "crypto"/"cripto" como categoría** cuando sea posible — hablar de Bitcoin, USDT o "dólares digitales".
3. **No mencionar CELO** (token) en la UI — MiniPay lo prohíbe; la red se puede llamar "red Celo".
4. **Unidades:** por defecto mostramos **sats** (satoshis); el usuario puede cambiar a BTC. El copy debe hacer que "sats" se sienta natural.
5. ES: tuteo, neutro LatAm (base Colombia). EN: inglés neutro/US, casual pero confiable.
6. Términos consistentes: ES "cuota" = EN "installment" · ES "billetera" = EN "wallet" · ES "plan" = EN "plan" · "agente/agent" siempre en singular como *el* actor del producto.

## 4. Copies actuales

### 4.1 Landing

| Clave | Español | English | Contexto |
|---|---|---|---|
| title1 + title2 | Tu agente que compra / **Bitcoin por ti** | Your agent that buys / **Bitcoin for you** | H1 del hero, segunda línea resaltada en naranja |
| subtitle | Compras automáticas, pequeñas y constantes, directo a tu billetera. Configúralo una vez y déjalo trabajar. | Automatic, small, steady purchases — straight to your wallet. Set it once and let it work. | Bajo el H1 |
| step1 | Conecta tu billetera (MiniPay o la que uses) | Connect your wallet (MiniPay or any other) | Paso 1 de 3 |
| step2 | Define tu plan: desde $1 USDT, cada hora o cada semana | Set your plan: from $1 USDT, hourly to weekly | Paso 2 de 3 |
| step3 | El agente compra por ti y el Bitcoin llega a tu billetera | The agent buys for you and Bitcoin lands in your wallet | Paso 3 de 3 |
| cta | Empezar ahora | Start now | Botón principal |
| note | Sin custodia: tus fondos nunca salen de tu control | Non-custodial: your funds never leave your control | Bajo el CTA |
| footer | Construido sobre Celo · Impulsado por un agente autónomo | Built on Celo · Powered by an autonomous agent | Footer |

### 4.2 Navegación y conexión

| Clave | Español | English | Contexto |
|---|---|---|---|
| nav.home | Inicio | Home | Tab bar inferior |
| nav.plan | Mi Plan | My Plan | Tab bar |
| nav.fund | Fondear | Deposit | Tab bar |
| nav.settings | Ajustes | Settings | Tab bar |
| connect.title | Conecta tu billetera | Connect your wallet | Pantalla de conexión (solo browser; en MiniPay conecta sola) |
| connect.subtitle | Tu agente de ahorro en Bitcoin funciona directo desde tu billetera. Tus fondos nunca salen de tu control. | Your Bitcoin savings agent works straight from your wallet. Your funds never leave your control. | |
| connect.button | Conectar billetera | Connect wallet | |
| connect.loading | Cargando... | Loading... | |

### 4.3 Dashboard (Inicio)

| Clave | Español | English | Contexto |
|---|---|---|---|
| dash.emptyTitle | Tu agente de Bitcoin | Your Bitcoin agent | Estado vacío (sin plan) |
| dash.emptySubtitle | Configura un plan una vez y el agente compra Bitcoin por ti, para siempre. | Set up a plan once and the agent buys Bitcoin for you, forever. | |
| dash.noPlan | Aún no tienes un plan activo | You don't have an active plan yet | Card naranja con ₿ grande |
| dash.noPlanHint | Compras automáticas desde $1 USDT, directo a tu billetera. | Automatic purchases from $1 USDT, straight to your wallet. | |
| dash.createPlan | Crear mi plan | Create my plan | Botón |
| dash.fundFirst | Primero: fondea tu billetera | First: fund your wallet | Aviso si no hay USDT |
| dash.fundFirstHint | Necesitas USDT en Celo para que el agente pueda comprar. | You need USDT on Celo so the agent can buy. | |
| dash.fundCta | Fondear con USDT | Deposit USDT | |
| dash.vault | Tu bóveda de Bitcoin | Your Bitcoin vault | H1 con plan activo |
| dash.accumulated | Bitcoin acumulado | Bitcoin stacked | Label del KPI grande (ej: "1.716 sats") |
| dash.avgPrice | Precio promedio | Average price | Métrica |
| dash.currentPrice | Precio actual | Current price | Métrica |
| dash.invested | Total invertido | Total invested | Métrica |
| dash.available | USDT disponible | USDT available | Métrica |
| dash.lowBalance | Saldo insuficiente para la próxima cuota | Not enough balance for the next installment | Aviso amarillo |
| dash.lowBalanceHint | El agente saltará las compras hasta que fondees tu billetera. | The agent will skip purchases until you fund your wallet. | |
| dash.fundNow | Fondear ahora | Deposit now | |
| dash.history | Compras del agente | Agent purchases | Título del historial |
| dash.historyEmpty | Tu primera compra se ejecutará pronto. El agente trabaja solo. | Your first purchase will run soon. The agent works on its own. | |
| dash.viewTx | Ver en Celoscan | View on Celoscan | Link por compra |
| status.success | Comprado | Bought | Badge en historial |
| status.skipped_no_funds | Sin saldo | No balance | Badge |
| status.skipped_stop_loss | Pausa por precio | Price pause | Badge |
| status.failed | Fallida | Failed | Badge |

### 4.4 Mi Plan — crear

| Clave | Español | English | Contexto |
|---|---|---|---|
| plan.createTitle | Configura tu plan | Set up your plan | H1 |
| plan.createSubtitle | Define cuánto y con qué frecuencia quieres acumular Bitcoin. El agente compra por ti. | Choose how much and how often you want to stack Bitcoin. The agent buys for you. | |
| plan.amountLabel | ¿Cuánto compras por cuota? (USDT) | How much per installment? (USDT) | Input |
| plan.amountHint | Entre $1 y $200 USDT por cuota | Between $1 and $200 USDT per installment | |
| plan.amountError | El monto debe estar entre $1 y $200 USDT | Amount must be between $1 and $200 USDT | |
| plan.frequencyLabel | ¿Con qué frecuencia? | How often? | Select |
| plan.frequencyHint | Cuotas pequeñas y frecuentes promedian mejor el precio | Small, frequent installments average the price better | |
| freq.* | Cada hora / Cada 6 horas / Cada 12 horas / Diaria / Semanal | Hourly / Every 6 hours / Every 12 hours / Daily / Weekly | Opciones |
| plan.budgetLabel | ¿Cuántas cuotas autorizas? | How many installments do you authorize? | Select (10/25/50) — es el cap del approve de USDT |
| plan.budgetHint | Es el máximo total que el agente puede usar. Tus fondos siguen en tu billetera. | It's the maximum total the agent can use. Your funds stay in your wallet. | |
| plan.stopLossLabel | Pausa automática si BTC cae (%) — opcional | Auto-pause if BTC drops (%) — optional | Input |
| plan.stopLossHint | Si el precio cae este % frente a tu precio promedio, el agente pausa las compras | If price drops this % vs. your average price, the agent pauses purchases | |
| plan.summary | Autorizarás **$X USDT** en total (N cuotas de **$Y**, frecuencia). Firmarás 2 transacciones. | You'll authorize **$X USDT** total (N installments of **$Y**, frequency). You'll sign 2 transactions. | Card resumen antes del botón |
| plan.submit | Activar mi agente | Activate my agent | Botón principal |
| plan.approving / creating / registering | Autorizando USDT... (1/2) / Creando plan... (2/2) / Activando agente... | Authorizing USDT... (1/2) / Creating plan... (2/2) / Activating agent... | Estados del botón |
| plan.submitError | No se pudo crear el plan. Revisa tu billetera e intenta de nuevo. | Couldn't create the plan. Check your wallet and try again. | Error |
| plan.whyTitle | ¿Por qué funciona el DCA? | Why does DCA work? | Card educativa |
| plan.whyBody | Al comprar Bitcoin de forma periódica, evitas depender de un solo momento del mercado. Con el tiempo, esto ayuda a bajar el precio promedio y a reducir el impacto de decisiones emocionales. | Buying Bitcoin periodically means you never depend on a single market moment. Over time it lowers your average price and takes emotion out of the decision. | |

### 4.5 Mi Plan — activo

| Clave | Español | English | Contexto |
|---|---|---|---|
| plan.title | Tu plan DCA | Your DCA plan | H1 |
| plan.state / plan.active | Estado / Activo | Status / Active | Badge |
| plan.amountPerRun | Compra por cuota | Per installment | |
| plan.frequency | Frecuencia | Frequency | |
| plan.nextRun | Próxima compra | Next purchase | |
| plan.soon | Pronto | Soon | Fallback si no hay fecha |
| plan.custodyTitle | Tus fondos, tu control | Your funds, your control | Card |
| plan.custodyBody | El USDT sigue en tu billetera y el Bitcoin comprado llega directo a ella. Cancelar detiene el agente al instante. | Your USDT stays in your wallet and the Bitcoin you buy lands right back in it. Cancelling stops the agent instantly. | |
| plan.cancel | Cancelar plan | Cancel plan | Botón |
| plan.cancelHint | Podrás crear un plan nuevo cuando quieras. | You can create a new plan anytime. | |
| plan.cancelError | No se pudo cancelar. Intenta de nuevo. | Couldn't cancel. Please try again. | |

### 4.6 Fondear

| Clave | Español | English | Contexto |
|---|---|---|---|
| fund.title | Fondea tu billetera | Fund your wallet | H1 |
| fund.subtitle | El agente compra Bitcoin con el USDT de tu billetera, cuota a cuota. | The agent buys Bitcoin with the USDT in your wallet, installment by installment. | |
| fund.balance | Saldo disponible | Available balance | KPI |
| fund.network | USDT en Celo | USDT on Celo | Bajo el KPI |
| fund.minipayTitle | Deposita desde MiniPay | Deposit from MiniPay | Solo dentro de MiniPay |
| fund.minipayBody | Usa la opción Depositar de MiniPay para agregar USDT con tu método de pago local. Tu saldo aparecerá aquí automáticamente. | Use MiniPay's Deposit option to add USDT with your local payment method. Your balance will show up here automatically. | |
| fund.sendTitle | Envía USDT (red Celo) a tu dirección | Send USDT (Celo network) to your address | Solo browser |
| fund.copy / fund.copied | Copiar dirección / ¡Copiada! | Copy address / Copied! | Botón |
| fund.warning | Importante: envía únicamente USDT en la red Celo. Depósitos en otras redes no llegarán a esta billetera. | Important: only send USDT on the Celo network. Deposits on other networks will not arrive in this wallet. | Advertencia |
| fund.refresh | Actualizar saldo | Refresh balance | Botón |
| fund.custodyTitle | Sin custodia | Non-custodial | Card |
| fund.custodyBody | Tus fondos nunca salen de tu billetera hasta el momento de cada compra, y el Bitcoin comprado llega directo a ella. Nadie más puede moverlos. | Your funds never leave your wallet until the moment of each purchase, and the Bitcoin you buy lands right back in it. Nobody else can move them. | |

### 4.7 Ajustes

| Clave | Español | English | Contexto |
|---|---|---|---|
| settings.title | Ajustes | Settings | H1 |
| settings.language | Idioma | Language | Select (Español/English) |
| settings.units | Unidades de Bitcoin | Bitcoin units | Select |
| settings.unitsSats / unitsBtc | Satoshis (sats) / BTC | Satoshis (sats) / BTC | Opciones |
| settings.wallet | Billetera conectada | Connected wallet | |
| settings.viaMiniPay / via | Conectada vía MiniPay / Conectada vía {name} | Connected via MiniPay / Connected via {name} | |
| settings.disconnect | Desconectar | Disconnect | Botón |
| settings.plan / planBody / goToPlan | Tu plan / Gestiona o cancela tu plan de compras automáticas. / Ir a Mi Plan | Your plan / Manage or cancel your automatic purchase plan. / Go to My Plan | |
| settings.transparency | Transparencia | Transparency | |
| settings.transparencyBody | CompraBTC es no-custodial: el contrato que ejecuta tus compras es público y verificado. Tus fondos solo se mueven según los límites que tú firmaste. | CompraBTC is non-custodial: the contract that executes your purchases is public and verified. Your funds only move within the limits you signed. | |
| settings.viewContract | Ver contrato en Celoscan | View contract on Celoscan | Botón/link |
| settings.footer | CompraBTC · Agente DCA sobre Celo | CompraBTC · DCA agent on Celo | Footer |

---

## 5. Qué queremos del revisor

1. **Claridad para no-expertos:** ¿algún texto asume conocimiento cripto que el público no tiene? (ej. "DCA", "no-custodial", "sats", "approve/autorizar")
2. **Confianza:** ¿los textos de custodia y seguridad tranquilizan de verdad o suenan a letra pequeña?
3. **Conversión:** ¿el landing y el flujo de crear plan empujan a la acción? ¿El CTA "Activar mi agente" / "Activate my agent" es el mejor posible?
4. **Consistencia ES↔EN:** ¿dicen lo mismo? ¿El inglés suena nativo o traducido?
5. **Consistencia interna:** mismos términos para lo mismo en toda la app (cuota/installment, fondear/deposit, billetera/wallet).
6. **Tono:** cálido, humano, directo, cero hype ("to the moon" prohibido), cero miedo.
7. Sugerencias puntuales de reemplazo, en formato: `clave → texto actual → propuesta → razón`.

/**
 * PREFERENCIAS DE USUARIO: idioma + unidades
 * ============================================
 * - Idioma: es/en, detectado del navegador, persistido en localStorage.
 * - Unidades: sats (default) o BTC, persistido en localStorage.
 * Incluye el diccionario completo de la UI.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'es' | 'en';
export type BtcUnit = 'sats' | 'btc';

// ===== DICCIONARIO =====
// Copies finales según docs/copy-review-brief.md + revisión editorial (jul 2026).
// Criterio: CompraBTC no vende trading, vende tranquilidad. Sin "DCA"/"bóveda"/
// "stop loss"/"para siempre" en la UI; autorización explicada (no se cobra por
// adelantado); sin promesas financieras ni de seguridad absoluta.
const dict = {
  es: {
    // Landing
    'landing.title1': 'Tu agente que compra',
    'landing.title2': 'Bitcoin por ti',
    'landing.subtitle': 'Acumula Bitcoin con compras pequeñas y automáticas, directo a tu billetera. Lo configuras una vez y el agente sigue comprando por ti.',
    'landing.step1': 'Conecta tu billetera',
    'landing.step2': 'Elige cuánto comprar y cada cuánto',
    'landing.step3': 'El agente compra Bitcoin y lo envía directo a tu billetera',
    'landing.cta': 'Crear mi plan',
    'landing.note': 'Sin custodia: tu dinero sigue en tu billetera y bajo tu control',
    'landing.footer': 'Sobre la red Celo · Impulsado por un agente autónomo',
    // Nav
    'nav.home': 'Inicio',
    'nav.plan': 'Mi plan',
    'nav.fund': 'Agregar USDT',
    'nav.settings': 'Ajustes',
    // Connect
    'connect.title': 'Conecta tu billetera',
    'connect.subtitle': 'Tu agente de Bitcoin funciona desde tu propia billetera. Tú mantienes el control de tus fondos.',
    'connect.button': 'Conectar billetera',
    'connect.loading': 'Cargando…',
    // Dashboard
    'dash.emptyTitle': 'Tu agente de Bitcoin',
    'dash.emptySubtitle': 'Crea un plan una vez y el agente comprará Bitcoin por ti mientras esté activo.',
    'dash.noPlan': 'Aún no tienes un plan activo',
    'dash.noPlanHint': 'Compras automáticas desde $0.10 USDT, directo a tu billetera.',
    'dash.createPlan': 'Crear mi plan',
    'dash.fundFirst': 'Primero agrega USDT a tu billetera',
    'dash.fundFirstHint': 'Necesitas USDT en la red Celo para que el agente pueda comprar Bitcoin.',
    'dash.fundCta': 'Agregar USDT',
    'dash.vault': 'Tu acumulado de Bitcoin',
    'dash.accumulated': 'Sats acumulados',
    'dash.avgPrice': 'Precio promedio',
    'dash.currentPrice': 'Precio actual',
    'dash.invested': 'Total invertido',
    'dash.available': 'USDT disponible',
    'dash.planInactive': 'Tu plan está inactivo',
    'dash.planInactiveHint': 'Tu Bitcoin sigue en tu billetera. Crea un plan nuevo para que el agente siga comprando.',
    'dash.reactivate': 'Reactivar mi plan',
    'dash.lowBalance': 'No hay suficiente USDT para la próxima cuota',
    'dash.lowBalanceHint': 'El agente pausará las compras hasta que agregues más USDT a tu billetera.',
    'dash.fundNow': 'Agregar USDT ahora',
    'dash.history': 'Compras automáticas',
    'dash.historyEmpty': 'Tu primera compra se ejecutará pronto. No tienes que hacer nada más.',
    'dash.viewTx': 'Ver compra en Celoscan',
    'dash.showing': 'Mostrando las últimas 10 de {n} compras',
    'status.success': 'Comprado',
    'status.skipped_no_funds': 'Sin USDT',
    'status.skipped_stop_loss': 'Pausada por precio',
    'status.failed': 'Fallida',
    // Plan
    'plan.title': 'Tu plan de Bitcoin',
    'plan.state': 'Estado',
    'plan.active': 'Activo',
    'plan.amountPerRun': 'Compra por cuota',
    'plan.frequency': 'Frecuencia',
    'plan.nextRun': 'Próxima compra',
    'plan.soon': 'Pronto',
    'plan.custodyTitle': 'Tus fondos, tu control',
    'plan.custodyBody': 'Tu USDT sigue en tu billetera. Cada compra de Bitcoin llega directo a ella, y puedes detener el plan cuando quieras.',
    'plan.cancel': 'Detener plan',
    'plan.cancelHint': 'Podrás crear un plan nuevo cuando quieras.',
    'plan.cancelError': 'No se pudo detener el plan. Inténtalo de nuevo.',
    'plan.createTitle': 'Crea tu plan de Bitcoin',
    'plan.createSubtitle': 'Elige cuánto quieres comprar y cada cuánto. El agente se encarga de hacerlo por ti.',
    'plan.amountLabel': '¿Cuánto quieres comprar por cuota? (USDT)',
    'plan.amountHint': 'De ${min} a ${max} USDT por cuota',
    'plan.amountError': 'El monto debe estar entre ${min} y ${max} USDT',
    'plan.frequencyLabel': '¿Cada cuánto quieres comprar?',
    'plan.frequencyHint': 'Comprar poco y seguido ayuda a suavizar el precio promedio',
    'plan.budgetLabel': '¿Cuántas cuotas quieres autorizar?',
    'plan.budgetHint': 'Esto define el máximo que el agente puede usar. No se cobra por adelantado y tus fondos siguen en tu billetera.',
    'plan.budgetOption': '{n} cuotas',
    'plan.budgetError': 'El número de cuotas debe estar entre {min} y {max}',
    'plan.amountPlaceholder': 'Ej: 5',
    'plan.budgetPlaceholder': 'Ej: 100',
    'plan.balanceOk': 'Tienes ${balance} en tu billetera — te alcanza para todas las cuotas autorizadas.',
    'plan.balancePartial': 'Hoy tienes ${balance}: te alcanza para las primeras {runs} cuotas. Tranquilo — puedes agregar USDT cuando quieras; si una cuota te encuentra sin saldo, el agente la salta y sigue en la próxima.',
    'plan.balanceNone': 'Aún no tienes USDT en tu billetera. Puedes crear el plan igual y fondear después — el agente salta las cuotas sin saldo y sigue cuando haya.',
    'plan.summary': 'Autorizarás hasta <b>${total} USDT</b> para este plan: {runs} cuotas de <b>${amount}</b> ({freq}). Firmarás 2 transacciones.',
    'plan.submit': 'Activar compras automáticas',
    'plan.feeNote': 'Sin cobros escondidos: esta es la única comisión y está fijada en el código — nadie puede subirla a escondidas.',
    'plan.feePerRun': 'Comisión: {fee} por cuota ({pct}% de tu compra)',
    'plan.feeTip': 'Tip: con cuotas de {amount} la comisión baja a {pct}%. Tú decides — cuotas chicas también funcionan.',
    'plan.submitError': 'No se pudo crear el plan. Revisa tu billetera e inténtalo de nuevo.',
    'plan.approving': 'Autorizando límite de USDT… (1/2)',
    'plan.creating': 'Creando plan… (2/2)',
    'plan.registering': 'Activando agente…',
    'plan.whyTitle': 'Por qué comprar poco a poco ayuda',
    'plan.whyBody': 'Comprar Bitcoin de forma periódica evita depender de un solo momento del mercado. Con el tiempo, puede ayudar a suavizar tu precio promedio y reducir decisiones impulsivas.',
    'freq.3600': 'Cada hora',
    'freq.21600': 'Cada 6 horas',
    'freq.43200': 'Cada 12 horas',
    'freq.86400': 'Diario',
    'freq.604800': 'Semanal',
    // Fund
    'fund.title': 'Agrega USDT a tu billetera',
    'fund.subtitle': 'El agente usa el USDT de tu billetera para comprar Bitcoin, cuota por cuota.',
    'fund.balance': 'Saldo disponible',
    'fund.network': 'USDT en la red Celo',
    'fund.minipayTitle': 'Agrega USDT desde MiniPay',
    'fund.minipayBody': 'Usa la opción Depositar de MiniPay para agregar USDT con tu método de pago local. Tu saldo aparecerá aquí automáticamente.',
    'fund.sendTitle': 'Envía USDT en la red Celo a tu dirección',
    'fund.copy': 'Copiar dirección',
    'fund.copied': 'Dirección copiada',
    'fund.warning': 'Importante: envía únicamente USDT en la red Celo. Si usas otra red, los fondos podrían perderse.',
    'fund.refresh': 'Actualizar saldo',
    'fund.custodyTitle': 'Tus fondos, tu control',
    'fund.custodyBody': 'Tu USDT permanece en tu billetera hasta el momento de cada compra. El contrato solo puede usarlo dentro del límite que autorizaste.',
    // Settings
    'settings.title': 'Ajustes',
    'settings.wallet': 'Billetera conectada',
    'settings.viaMiniPay': 'Conectada vía MiniPay',
    'settings.via': 'Conectada vía {name}',
    'settings.disconnect': 'Desconectar',
    'settings.plan': 'Tu plan',
    'settings.planBody': 'Gestiona o detén tu plan de compras automáticas.',
    'settings.goToPlan': 'Ir a mi plan',
    'settings.language': 'Idioma',
    'settings.units': 'Unidad de Bitcoin',
    'settings.unitsSats': 'Satoshis (sats)',
    'settings.unitsBtc': 'BTC',
    'settings.transparency': 'Transparencia y control',
    'settings.transparencyBody': 'CompraBTC es sin custodia: el contrato que ejecuta tus compras es público y verificado. Tus fondos solo se mueven dentro de los límites que tú autorizaste.',
    'settings.viewContract': 'Ver contrato en Celoscan',
    'settings.footer': 'CompraBTC · Agente de compras automáticas sobre la red Celo',
    'settings.telegram': 'Alertas por Telegram',
    'settings.telegramLinked': 'Conectado',
    'settings.telegramNotLinked': 'Sin conectar',
    'settings.telegramLinkedBody': 'Tu Telegram quedó vinculado a esta billetera: te llegará un mensaje cada vez que el agente compre Bitcoin por ti.',
    'settings.telegramStep1': 'Toca “Conectar Telegram”: se abrirá nuestro bot en tu app de Telegram.',
    'settings.telegramStep2': 'En el chat del bot, toca “Iniciar” (o “Start”). Con eso queda vinculado a tu billetera.',
    'settings.telegramStep3': 'Vuelve aquí: verás “Conectado” y el bot te enviará la confirmación.',
    'settings.telegramTest': 'Enviar mensaje de prueba',
    'settings.telegramTestSent': 'Enviado — revisa tu Telegram ✓',
    'settings.telegramTestError': 'No se pudo enviar — espera un minuto e intenta de nuevo',
    'settings.telegramConnect': 'Conectar Telegram',
    // Stats
    'stats.title': 'CompraBTC en números',
    'stats.subtitle': 'Actividad real del agente, verificable on-chain.',
    'stats.purchases': 'Compras ejecutadas',
    'stats.volume': 'Volumen comprado',
    'stats.sats': 'Sats acumulados por usuarios',
    'stats.activePlans': 'Planes activos',
    'stats.users': 'Usuarios',
    'stats.x402': 'Pagos x402 liquidados',
    'stats.btcPrice': 'Precio BTC',
    'stats.viewContract': 'Ver contrato verificado',
    // Calculadora
    'calc.title': '¿Y si hubieras empezado antes?',
    'calc.subtitle': 'Así crecería tu ahorro comprando Bitcoin automáticamente, poquito a poquito, cada hora.',
    'calc.amountLabel': '¿Cuánto por hora?',
    'calc.periodLabel': '¿Desde hace cuánto?',
    'calc.period365': 'Hace 1 año',
    'calc.period1095': 'Hace 3 años',
    'calc.period1825': 'Hace 5 años',
    'calc.loading': 'Calculando con precios históricos reales…',
    'calc.invested': 'Habrías puesto',
    'calc.wouldHave': 'Hoy tendrías',
    'calc.change': 'Diferencia',
    'calc.purchases': '{n} compras automáticas de {amount}',
    'calc.seriesInvested': 'Lo que pusiste',
    'calc.seriesWorth': 'Lo que tendrías',
    'calc.whyBtcTitle': '¿Por qué la gente guarda en Bitcoin?',
    'calc.btc1t': 'Nadie puede imprimir más',
    'calc.btc1b': 'Solo existirán 21 millones de bitcoins. Cuando algo es escaso y más gente lo quiere, su valor tiende a subir con los años.',
    'calc.btc2t': 'No es de ningún gobierno ni empresa',
    'calc.btc2b': 'Nadie puede decidir devaluarlo, congelarlo ni imprimir más. Funciona igual en cualquier país del mundo, las 24 horas.',
    'calc.btc3t': 'Cuida el valor de tu esfuerzo',
    'calc.btc3b': 'Los precios suben y la plata guardada pierde fuerza cada año. Mucha gente aparta una porción en Bitcoin para proteger lo que le costó ganar.',
    'calc.whyUsTitle': '¿Y por qué con CompraBTC?',
    'calc.us1t': 'Poquito a poco, sin adivinar el momento',
    'calc.us1b': 'Nadie sabe cuándo sube o baja. El agente compra un montico con la frecuencia que elijas, promedia el precio y te quita el estrés de adivinar.',
    'calc.us2t': 'Tu Bitcoin llega a tu billetera',
    'calc.us2b': 'No se queda en una plataforma. Ni siquiera nuestro agente puede tocarlo: solo puede comprar dentro del presupuesto que tú autorizaste, y puedes cancelar cuando quieras.',
    'calc.us3t': 'Comisión clara y a la vista',
    'calc.us3b': 'Ves la comisión exacta antes de crear tu plan, y el contrato no permite cobrar más de lo mostrado. Todo queda verificable en la blockchain.',
    'calc.cta': 'Empieza hoy — crea tu plan',
    'calc.disclaimer': 'Cálculo con precios históricos reales de Bitcoin. El comportamiento pasado no garantiza resultados futuros.',
    'calc.error': 'No pudimos cargar los precios históricos. Intenta de nuevo en un momento.',
  },
  en: {
    'landing.title1': 'Your agent that buys',
    'landing.title2': 'Bitcoin for you',
    'landing.subtitle': 'Build Bitcoin with small automatic purchases, straight to your wallet. Set it once, and your agent keeps buying for you.',
    'landing.step1': 'Connect your wallet',
    'landing.step2': 'Choose how much to buy and how often',
    'landing.step3': 'The agent buys Bitcoin and sends it straight to your wallet',
    'landing.cta': 'Create my plan',
    'landing.note': 'Non-custodial: your money stays in your wallet and under your control',
    'landing.footer': 'Built on the Celo network · Powered by an autonomous agent',
    'nav.home': 'Home',
    'nav.plan': 'My plan',
    'nav.fund': 'Add USDT',
    'nav.settings': 'Settings',
    'connect.title': 'Connect your wallet',
    'connect.subtitle': 'Your Bitcoin agent works from your own wallet. You stay in control of your funds.',
    'connect.button': 'Connect wallet',
    'connect.loading': 'Loading…',
    'dash.emptyTitle': 'Your Bitcoin agent',
    'dash.emptySubtitle': "Create a plan once, and the agent will buy Bitcoin for you while it's active.",
    'dash.noPlan': "You don't have an active plan yet",
    'dash.noPlanHint': 'Automatic purchases from $0.10 USDT, straight to your wallet.',
    'dash.createPlan': 'Create my plan',
    'dash.fundFirst': 'First, add USDT to your wallet',
    'dash.fundFirstHint': 'You need USDT on the Celo network so the agent can buy Bitcoin.',
    'dash.fundCta': 'Add USDT',
    'dash.vault': 'Your Bitcoin stack',
    'dash.accumulated': 'Sats stacked',
    'dash.avgPrice': 'Average price',
    'dash.currentPrice': 'Current price',
    'dash.invested': 'Total invested',
    'dash.available': 'USDT available',
    'dash.planInactive': 'Your plan is inactive',
    'dash.planInactiveHint': 'Your Bitcoin is still in your wallet. Create a new plan so the agent keeps buying.',
    'dash.reactivate': 'Reactivate my plan',
    'dash.lowBalance': 'Not enough USDT for the next installment',
    'dash.lowBalanceHint': 'The agent will pause purchases until you add more USDT to your wallet.',
    'dash.fundNow': 'Add USDT now',
    'dash.history': 'Automatic purchases',
    'dash.historyEmpty': "Your first purchase will run soon. You don't need to do anything else.",
    'dash.viewTx': 'View purchase on Celoscan',
    'dash.showing': 'Showing the last 10 of {n} purchases',
    'status.success': 'Bought',
    'status.skipped_no_funds': 'No USDT',
    'status.skipped_stop_loss': 'Paused by price',
    'status.failed': 'Failed',
    'plan.title': 'Your Bitcoin plan',
    'plan.state': 'Status',
    'plan.active': 'Active',
    'plan.amountPerRun': 'Purchase per installment',
    'plan.frequency': 'Frequency',
    'plan.nextRun': 'Next purchase',
    'plan.soon': 'Soon',
    'plan.custodyTitle': 'Your funds, your control',
    'plan.custodyBody': 'Your USDT stays in your wallet. Each Bitcoin purchase goes straight back to it, and you can stop the plan anytime.',
    'plan.cancel': 'Stop plan',
    'plan.cancelHint': 'You can create a new plan anytime.',
    'plan.cancelError': "Couldn't stop the plan. Please try again.",
    'plan.createTitle': 'Create your Bitcoin plan',
    'plan.createSubtitle': 'Choose how much you want to buy and how often. The agent takes care of it for you.',
    'plan.amountLabel': 'How much do you want to buy per installment? (USDT)',
    'plan.amountHint': 'From ${min} to ${max} USDT per installment',
    'plan.amountError': 'Amount must be between ${min} and ${max} USDT',
    'plan.frequencyLabel': 'How often do you want to buy?',
    'plan.frequencyHint': 'Buying small amounts regularly helps smooth your average price',
    'plan.budgetLabel': 'How many installments do you want to authorize?',
    'plan.budgetHint': 'This sets the maximum the agent can use. You are not charged upfront, and your funds stay in your wallet.',
    'plan.budgetOption': '{n} installments',
    'plan.budgetError': 'The number of installments must be between {min} and {max}',
    'plan.amountPlaceholder': 'e.g. 5',
    'plan.budgetPlaceholder': 'e.g. 100',
    'plan.balanceOk': 'You have ${balance} in your wallet — enough for every authorized installment.',
    'plan.balancePartial': "You have ${balance} today: enough for the first {runs} installments. No worries — add USDT whenever you want; if an installment finds no balance, the agent skips it and continues on the next one.",
    'plan.balanceNone': "You don't have USDT in your wallet yet. You can still create the plan and fund later — the agent skips unfunded installments and resumes when there's balance.",
    'plan.summary': "You'll authorize up to <b>${total} USDT</b> for this plan: {runs} installments of <b>${amount}</b> ({freq}). You'll sign 2 transactions.",
    'plan.submit': 'Activate automatic purchases',
    'plan.feeNote': "No hidden charges: this is the only commission and it's locked in code — no one can quietly raise it.",
    'plan.feePerRun': 'Commission: {fee} per installment ({pct}% of your purchase)',
    'plan.feeTip': 'Tip: with {amount} installments the commission drops to {pct}%. Your call — small installments work too.',
    'plan.submitError': "Couldn't create the plan. Check your wallet and try again.",
    'plan.approving': 'Authorizing USDT limit… (1/2)',
    'plan.creating': 'Creating plan… (2/2)',
    'plan.registering': 'Activating agent…',
    'plan.whyTitle': 'Why buying little by little helps',
    'plan.whyBody': "Buying Bitcoin regularly means you don't depend on a single market moment. Over time, it can help smooth your average price and reduce impulsive decisions.",
    'freq.3600': 'Every hour',
    'freq.21600': 'Every 6 hours',
    'freq.43200': 'Every 12 hours',
    'freq.86400': 'Daily',
    'freq.604800': 'Weekly',
    'fund.title': 'Add USDT to your wallet',
    'fund.subtitle': 'The agent uses the USDT in your wallet to buy Bitcoin, installment by installment.',
    'fund.balance': 'Available balance',
    'fund.network': 'USDT on the Celo network',
    'fund.minipayTitle': 'Add USDT from MiniPay',
    'fund.minipayBody': "Use MiniPay's Deposit option to add USDT with your local payment method. Your balance will appear here automatically.",
    'fund.sendTitle': 'Send USDT on the Celo network to your address',
    'fund.copy': 'Copy address',
    'fund.copied': 'Address copied',
    'fund.warning': 'Important: only send USDT on the Celo network. If you use another network, your funds may be lost.',
    'fund.refresh': 'Refresh balance',
    'fund.custodyTitle': 'Your funds, your control',
    'fund.custodyBody': 'Your USDT stays in your wallet until each purchase. The contract can only use it within the limit you authorized.',
    'settings.title': 'Settings',
    'settings.wallet': 'Connected wallet',
    'settings.viaMiniPay': 'Connected via MiniPay',
    'settings.via': 'Connected via {name}',
    'settings.disconnect': 'Disconnect',
    'settings.plan': 'Your plan',
    'settings.planBody': 'Manage or stop your automatic purchase plan.',
    'settings.goToPlan': 'Go to my plan',
    'settings.language': 'Language',
    'settings.units': 'Bitcoin unit',
    'settings.unitsSats': 'Satoshis (sats)',
    'settings.unitsBtc': 'BTC',
    'settings.transparency': 'Transparency and control',
    'settings.transparencyBody': 'CompraBTC is non-custodial: the contract that runs your purchases is public and verified. Your funds only move within the limits you authorized.',
    'settings.viewContract': 'View contract on Celoscan',
    'settings.footer': 'CompraBTC · Automatic purchase agent on the Celo network',
    'settings.telegram': 'Telegram alerts',
    'settings.telegramLinked': 'Connected',
    'settings.telegramNotLinked': 'Not connected',
    'settings.telegramLinkedBody': 'Your Telegram is linked to this wallet: you get a message every time the agent buys Bitcoin for you.',
    'settings.telegramStep1': 'Tap “Connect Telegram”: our bot will open in your Telegram app.',
    'settings.telegramStep2': 'In the bot chat, tap “Start”. That links it to your wallet.',
    'settings.telegramStep3': 'Come back here: you will see “Connected” and the bot will send a confirmation.',
    'settings.telegramTest': 'Send a test message',
    'settings.telegramTestSent': 'Sent — check your Telegram ✓',
    'settings.telegramTestError': "Couldn't send — wait a minute and try again",
    'settings.telegramConnect': 'Connect Telegram',
    'stats.title': 'CompraBTC in numbers',
    'stats.subtitle': 'Real agent activity, verifiable on-chain.',
    'stats.purchases': 'Purchases executed',
    'stats.volume': 'Volume purchased',
    'stats.sats': 'Sats stacked by users',
    'stats.activePlans': 'Active plans',
    'stats.users': 'Users',
    'stats.x402': 'x402 payments settled',
    'stats.btcPrice': 'BTC price',
    'stats.viewContract': 'View verified contract',
    'calc.title': 'What if you had started earlier?',
    'calc.subtitle': 'This is how your savings would grow buying Bitcoin automatically, little by little, every hour.',
    'calc.amountLabel': 'How much per hour?',
    'calc.periodLabel': 'Starting when?',
    'calc.period365': '1 year ago',
    'calc.period1095': '3 years ago',
    'calc.period1825': '5 years ago',
    'calc.loading': 'Calculating with real historical prices…',
    'calc.invested': 'You would have put in',
    'calc.wouldHave': "You'd have today",
    'calc.change': 'Difference',
    'calc.purchases': '{n} automatic purchases of {amount}',
    'calc.seriesInvested': 'What you put in',
    'calc.seriesWorth': "What you'd have",
    'calc.whyBtcTitle': 'Why do people save in Bitcoin?',
    'calc.btc1t': 'No one can print more',
    'calc.btc1b': 'Only 21 million bitcoins will ever exist. When something is scarce and more people want it, its value tends to rise over the years.',
    'calc.btc2t': "It doesn't belong to any government or company",
    'calc.btc2b': 'No one can decide to devalue it, freeze it, or print more. It works the same in every country, around the clock.',
    'calc.btc3t': 'Protects the value of your effort',
    'calc.btc3b': 'Prices go up and saved money loses strength every year. Many people set aside a portion in Bitcoin to protect what they worked for.',
    'calc.whyUsTitle': 'And why with CompraBTC?',
    'calc.us1t': 'Little by little, no guessing the moment',
    'calc.us1b': 'Nobody knows when the price goes up or down. The agent buys a tiny amount at the frequency you choose, averaging the price and removing the stress of guessing.',
    'calc.us2t': 'Your Bitcoin lands in your wallet',
    'calc.us2b': "It never sits on a platform. Not even our agent can touch it: it can only buy within the budget you authorized, and you can cancel anytime.",
    'calc.us3t': 'A clear, upfront commission',
    'calc.us3b': "You see the exact commission before creating your plan, and the contract can't charge more than shown. Everything is verifiable on the blockchain.",
    'calc.cta': 'Start today — create your plan',
    'calc.disclaimer': 'Calculated with real historical Bitcoin prices. Past performance does not guarantee future results.',
    'calc.error': "We couldn't load historical prices. Please try again in a moment.",
  },
} as const;

export type DictKey = keyof (typeof dict)['es'];

// ===== CONTEXTO =====
interface Prefs {
  lang: Lang;
  setLang: (l: Lang) => void;
  unit: BtcUnit;
  setUnit: (u: BtcUnit) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  locale: string;
}

const PrefsContext = createContext<Prefs | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');
  const [unit, setUnitState] = useState<BtcUnit>('sats');

  // Cargar preferencias (o detectar idioma del navegador)
  useEffect(() => {
    const savedLang = localStorage.getItem('comprabtc.lang') as Lang | null;
    if (savedLang === 'es' || savedLang === 'en') {
      setLangState(savedLang);
    } else if (typeof navigator !== 'undefined' && !navigator.language.toLowerCase().startsWith('es')) {
      setLangState('en');
    }
    const savedUnit = localStorage.getItem('comprabtc.unit') as BtcUnit | null;
    if (savedUnit === 'sats' || savedUnit === 'btc') setUnitState(savedUnit);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('comprabtc.lang', l);
  };
  const setUnit = (u: BtcUnit) => {
    setUnitState(u);
    localStorage.setItem('comprabtc.unit', u);
  };

  const t = (key: DictKey, vars?: Record<string, string | number>) => {
    let text: string = dict[lang][key] ?? dict.es[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };

  const locale = lang === 'es' ? 'es-CO' : 'en-US';

  return (
    <PrefsContext.Provider value={{ lang, setLang, unit, setUnit, t, locale }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
}

// ===== FORMATO DE CANTIDADES BTC =====
const SATS_PER_BTC = 100_000_000;

export function formatBtcAmount(sats: number, unit: BtcUnit, locale: string): string {
  if (unit === 'btc') {
    return `${(sats / SATS_PER_BTC).toLocaleString(locale, { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`;
  }
  return `${sats.toLocaleString(locale)} sats`;
}

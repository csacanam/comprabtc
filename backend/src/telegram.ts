/**
 * TELEGRAM
 * =========
 * Un solo bot para dos usos:
 * 1. Alertas a usuarios: /start <wallet> vincula el chat y avisa cada compra.
 * 2. Bot de control (ops): digest de métricas + alarmas de saldos al chat del operador.
 * Si TELEGRAM_BOT_TOKEN no está configurado, todo se desactiva en silencio.
 */

import { config } from "./config.js";

const API = (token = config.telegramBotToken) => `https://api.telegram.org/bot${token}`;

export function telegramEnabled(): boolean {
  return Boolean(config.telegramBotToken);
}

export async function sendTelegram(chatId: string, text: string, token?: string): Promise<void> {
  if (!telegramEnabled()) return;
  try {
    await fetch(`${API(token)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch (err) {
    console.warn("[telegram] send failed:", err);
  }
}

/** Mensajes de operación: van por el bot de ops si está configurado (OPS_TELEGRAM_BOT_TOKEN). */
export async function sendOps(text: string): Promise<void> {
  if (!config.opsTelegramChatId) return;
  await sendTelegram(config.opsTelegramChatId, text, config.opsTelegramBotToken || undefined);
}

// ===== MENSAJES AL USUARIO (multi-idioma) =====
// El idioma se captura al vincular (deep link ?start=<wallet>_<lang>) y se
// guarda en agent_users.lang — todo mensaje al usuario debe salir de aquí.
export type UserLang = "es" | "en";

export const userMessages = {
  es: {
    linked: (w: string) =>
      `✅ Listo. Te avisaré aquí cada vez que tu agente compre Bitcoin para <code>${w}…</code>`,
    relinked: (w: string) =>
      `⚠️ Las alertas de <code>${w}…</code> se vincularon desde otro Telegram y dejarán de llegar aquí. Si no fuiste tú, vuelve a conectar desde la app (Ajustes → Conectar Telegram).`,
    startHelp: "Para vincular tus alertas, entra a comprabtc.vercel.app → Ajustes → Conectar Telegram.",
    test: "👋 Prueba de CompraBTC: por aquí te avisaré cada vez que tu agente compre Bitcoin.",
    purchase: (sats: string, usd: string, tx: string) =>
      `🟠 <b>CompraBTC</b>\nTu agente compró <b>${sats} sats</b> por $${usd} USDT.\n<a href="https://celoscan.io/tx/${tx}">Ver compra en Celoscan</a>`,
    skippedNoFunds:
      "⚠️ <b>CompraBTC</b>\nTu cuota se saltó: no había USDT suficiente en tu billetera. Agrega USDT y el agente retoma solo en la próxima cuota.",
    skippedNoAllowance:
      "⚠️ <b>CompraBTC</b>\nTu cuota se saltó: el presupuesto que autorizaste ya se usó completo. Entra a la app → Mi plan y autoriza más cuotas para que el agente siga comprando.",
    budgetLow:
      "🔔 <b>CompraBTC</b>\nQuedan solo <b>3 cuotas</b> de tu presupuesto autorizado. Renueva en la app → Mi plan para que el agente no se detenga.",
  },
  en: {
    linked: (w: string) =>
      `✅ Done. I'll message you here every time your agent buys Bitcoin for <code>${w}…</code>`,
    relinked: (w: string) =>
      `⚠️ Alerts for <code>${w}…</code> were linked from another Telegram and will stop arriving here. If that wasn't you, reconnect from the app (Settings → Connect Telegram).`,
    startHelp: "To link your alerts, open comprabtc.vercel.app → Settings → Connect Telegram.",
    test: "👋 CompraBTC test: I'll message you here every time your agent buys Bitcoin.",
    purchase: (sats: string, usd: string, tx: string) =>
      `🟠 <b>CompraBTC</b>\nYour agent bought <b>${sats} sats</b> for $${usd} USDT.\n<a href="https://celoscan.io/tx/${tx}">View on Celoscan</a>`,
    skippedNoFunds:
      "⚠️ <b>CompraBTC</b>\nYour installment was skipped: not enough USDT in your wallet. Add USDT and the agent resumes on the next installment automatically.",
    skippedNoAllowance:
      "⚠️ <b>CompraBTC</b>\nYour installment was skipped: the budget you authorized is fully used. Open the app → My plan and authorize more installments so the agent can keep buying.",
    budgetLow:
      "🔔 <b>CompraBTC</b>\nOnly <b>3 installments</b> left in your authorized budget. Renew in the app → My plan so the agent doesn't stop.",
  },
} as const satisfies Record<UserLang, unknown>;

export function normalizeLang(value: string | null | undefined): UserLang {
  return value === "en" ? "en" : "es";
}

/** Registra el webhook del bot apuntando a nuestra URL pública. */
export async function setupWebhook(publicUrl: string): Promise<void> {
  if (!telegramEnabled()) return;
  try {
    const res = await fetch(`${API()}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `${publicUrl}/api/telegram/webhook`,
        secret_token: config.telegramWebhookSecret,
        allowed_updates: ["message"],
      }),
    });
    const body = await res.json();
    console.log("[telegram] webhook:", JSON.stringify(body));
  } catch (err) {
    console.warn("[telegram] setWebhook failed:", err);
  }
}

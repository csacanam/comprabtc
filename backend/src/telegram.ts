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

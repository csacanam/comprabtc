-- Migración: vincular Telegram a usuarios del agente (alertas de compra).
-- Ejecutar en el SQL Editor de Supabase.
alter table agent_users add column if not exists telegram_chat_id text;

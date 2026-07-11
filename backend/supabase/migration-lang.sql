-- Idioma preferido del usuario (es/en) para los mensajes de Telegram.
-- Se captura al vincular: el deep link lleva ?start=<wallet>_<lang>.
alter table agent_users add column if not exists lang text not null default 'es';

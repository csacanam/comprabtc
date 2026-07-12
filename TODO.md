# TODO — crecimiento y distribución para agentes

Contexto: aplicando el playbook Remotion (skill oficial + llms.txt + demo viral) a los proyectos del portafolio. Estado al 12 jul 2026. Hecho ya: ✅ skill instalable (`npx skills add csacanam/comprabtc`), ✅ llms.txt, ✅ metadata ERC-8004 completa (#9665, registration-v1, agentURI apunta a `/metadata.json` → editar metadata = solo push, sin tx), ✅ `.well-known/agent-registration.json`.

## Distribución / agentes

- [ ] **Demo en X** con output real: video corto de Claude Code creando un plan DCA (`npx skills add csacanam/comprabtc` en el post). Es el paso de mayor impacto del playbook.
- [ ] Verificar que 8004scan re-indexó el perfil (capabilities OASF, logo, x402, verificación circular): https://www.8004scan.io/agents/celo/9665
- [x] PRs a awesome-lists ABIERTOS (12 jul): awesome-mcp-servers#9909 (los 4 MCPs), awesome-agentic-commerce#442 (ex awesome-x402, las 3 apps), awesome-erc8004#80 (#9665 y #9669), celo-org/awesome-celo#1 (CompraBTC/HashProof/Voulti). Monitorear reviews de mantenedores.
- [ ] Endpoint x402 **canónico** (pago → valor en la respuesta): `POST /api/backtest` con la lógica de `/calc` (simulación DCA con precios históricos). Hoy el único x402 es `/api/execute` (metering del keeper, auto-pago).
- [ ] Conseguir feedback on-chain de usuarios/agentes reales (ERC-8004 Reputation Registry / Aigora) — es lo que rankea en los leaderboards de agentes.

## Hackathon (cierra 20 jul 2026 09:00 GMT — ver PLAN.md y memoria de sesión)

- [ ] Planes de la familia (wallets reales, anti-sybil manual).
- [ ] Verificar tag `celo_61eaf011b5a9` acreditando en el leaderboard Dune.
- [ ] Responder comentarios de mantenedores en los PRs de aigora-skills.
- [ ] Decisión pendiente: `setFeeFlat` a $0.002.

## MCP (12 jul)

- [x] MCP server para tesorerías construido y probado (`mcp/`): get_wallet_status y get_portfolio (gratis, lecturas on-chain reales verificadas), create_plan (2 txs con validaciones de balance/gas/cap por cuota), renew_budget, cancel_plan (con revoke). La wallet configurada ES la tesorería dueña del plan — sin capacidad de retiro por diseño.
- [x] `comprabtc-mcp@0.1.0` PUBLICADO (12 jul): npm (cold-install npx verificado) + registro MCP oficial (`io.github.csacanam/comprabtc`). Instalación: `claude mcp add comprabtc -- npx -y comprabtc-mcp`.

## Mantenimiento

- [ ] El skill vive en `skills/comprabtc/SKILL.md` — si se cambia el contrato/API, actualizarlo (es lo que instalan los agentes).

#!/usr/bin/env node
const userAgent = process.env.npm_config_user_agent || '';

if (!userAgent.startsWith('pnpm/')) {
  console.error('\n\x1b[41m\x1b[37m%s\x1b[0m', ' 🛑 BLOQUEO DE SEGURIDAD HC-SCAN ');
  console.error('\x1b[31m%s\x1b[0m', '❌ Está terminantemente prohibido utilizar npm o yarn en este proyecto.');
  console.error('\x1b[33m%s\x1b[0m', '👉 Por políticas de seguridad y consistencia, debe usar EXCLUSIVAMENTE PNPM:');
  console.error('\x1b[32m%s\x1b[0m', '   ✔ pnpm install');
  console.error('\x1b[32m%s\x1b[0m', '   ✔ pnpm dev / pnpm start');
  console.error('\x1b[32m%s\x1b[0m', '   ✔ pnpm build / pnpm export\n');
  process.exit(1);
}

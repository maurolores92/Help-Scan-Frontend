const { loadEnvConfig } = require('@next/env')
const { spawn } = require('child_process')

// Carga las variables desde .env / .env.local
loadEnvConfig(__dirname)

const port = process.env.PORT || '3000'

// Inicia Next.js en producción escuchando en 0.0.0.0 con el puerto configurado usando pnpm
const startProcess = spawn('pnpm', ['exec', 'next', 'start', '-H', '0.0.0.0', '-p', port], {
  stdio: 'inherit',
  shell: true
})

startProcess.on('exit', code => {
  process.exit(code ?? 0)
})

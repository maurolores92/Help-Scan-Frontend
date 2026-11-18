FROM node:22-alpine

WORKDIR /app

# Instalar PNPM de forma global
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
COPY scripts/ ./scripts/

RUN pnpm install

COPY . .

# Para desarrollo usamos PNPM
CMD ["pnpm", "run", "dev"]

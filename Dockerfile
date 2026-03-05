# ── Stage 1: сборка SPA ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Зависимости в отдельном слое — кэшируются если package.json не менялся
COPY package*.json ./
RUN npm ci --silent

# Исходный код
COPY . .

# Build-time аргументы (передаются из docker-compose)
ARG VITE_API_URL=https://cloudiaas.sytes.net/api
ARG VITE_APP_NAME=CloudIaaS
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build

# ── Stage 2: раздача статики ──────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# SPA конфиг (try_files для client-side routing)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Собранный билд
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ | grep -q "<!DOCTYPE" || exit 1

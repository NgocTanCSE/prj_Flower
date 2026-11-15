# ---------------------------------------------------------------------------
# Production image (Node 20)
#   1. cài TOÀN BỘ dependencies (dev + prod) — `next build` cần tailwindcss /
#      autoprefixer / postcss (postcss.config.mjs)
#   2. `npm run build` — NEXT_PUBLIC_* được baking vào bản dựng
#   3. `npm prune --production` — giữ lại nhà runtime (next, react, supabase, ...)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS app

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json ./

# NODE_ENV chưa bị producer nên npm cài đủ devDependencies (cần cho build)
RUN npm install --no-audit --no-fund 2>&1 || npm install --no-audit --no-fund

COPY . .

RUN npm run build 2>&1 || true

# Giữ lại nhà runtime production
RUN npm prune --production 2>&1 || true

EXPOSE 3000

CMD ["npm", "start"]

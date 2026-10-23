# Beluga taklifnoma platformasi — backend (Express) frontend build'ini ham beradi.
#   docker compose up -d --build   (docker-compose.yml, sirlar .env faylda)

FROM node:22-alpine AS build
WORKDIR /app

# Avval faqat package fayllar — kod o'zgarganda npm ci keshdan olinadi
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --include=dev

COPY backend backend
COPY frontend frontend
# Sayt domen ichidagi yo'lda bo'lsa (masalan /erbotayev) build paytida beriladi
ARG BASE_PATH=
ENV BASE_PATH=$BASE_PATH NODE_ENV=production
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5050
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend/package.json backend/
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
# Yuklangan fayllar (GridFS) va ularning kichraytirilgan variantlari uchun disk keshi;
# docker-compose'da volume — deploy'lar orasida saqlanadi
ENV UPLOAD_CACHE_DIR=/app/cache/uploads
RUN mkdir -p /app/cache/uploads && chown -R node:node /app/cache
USER node
EXPOSE 5050
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:5050/health >/dev/null || exit 1
CMD ["node", "backend/dist/server.js"]

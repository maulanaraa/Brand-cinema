FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY config ./config
COPY .env.example ./.env.example

RUN mkdir -p uploads/posters

EXPOSE 5000

CMD ["node", "dist/server.js"]

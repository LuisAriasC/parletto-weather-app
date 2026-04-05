FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/backend ./apps/backend
COPY libs ./libs
RUN npm ci --ignore-scripts
RUN npx nx build backend --prod

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "main.js"]

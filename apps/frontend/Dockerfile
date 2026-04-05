# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/frontend ./apps/frontend
COPY libs ./libs
RUN npm ci --ignore-scripts
RUN npx nx build frontend --prod

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

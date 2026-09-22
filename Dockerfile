# ===== 1단계: 빌드 =====
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ===== 2단계: 서빙 =====
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# healthcheck용 curl 설치 (alpine은 apk 사용)
RUN apk add --no-cache curl

RUN rm -rf ./*
COPY --from=builder /app/dist .
COPY nginx-fe.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
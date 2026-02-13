FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖配置文件
COPY package.json package-lock.json* yarn.lock* ./

# 安装依赖
RUN npm install --legacy-peer-deps || npm install

# 复制源码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建
RUN npm run build

# ===== 生产阶段 =====
FROM node:20-alpine
WORKDIR /app

# 只安装生产依赖
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --production --legacy-peer-deps || npm install --production

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# 安全：不要复制 .env 文件到镜像中
# 生产环境通过 docker run -e 或 docker-compose environment 传入环境变量

EXPOSE 3001

# 启动前运行数据库迁移
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

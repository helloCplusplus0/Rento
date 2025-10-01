# Rento 房屋租赁管理系统 - 多阶段构建 Dockerfile
# 兼容 Docker 和 Podman 构建
# 构建命令: podman build -t rento:latest . 或 docker build -t rento:latest .

# syntax=docker/dockerfile:1

# 阶段1: 依赖安装和构建
FROM node:20-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 复制package文件 (利用Docker层缓存)
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖 (仅生产依赖)
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用 (Next.js standalone模式)
RUN npm run build

# 阶段2: 生产运行环境
FROM node:20-alpine AS runner

# 安装运行时依赖
RUN apk add --no-cache \
    postgresql-client \
    curl \
    dumb-init \
    tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户 (安全最佳实践)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置工作目录
WORKDIR /app

# 复制构建产物 (使用非root用户权限)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 复制脚本文件
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod +x ./scripts/*.sh

# 创建必要目录并设置权限
RUN mkdir -p /app/logs /app/backups && \
    chown -R nextjs:nodejs /app/logs /app/backups

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# 使用dumb-init作为PID 1 (处理信号和僵尸进程)
ENTRYPOINT ["dumb-init", "--"]

# 启动命令
CMD ["node", "server.js"]
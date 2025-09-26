# syntax=docker/dockerfile:1

# 阶段1: 依赖安装和构建
FROM node:20-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 阶段2: 生产运行环境
FROM node:20-alpine AS runner

# 安装运行时依赖
RUN apk add --no-cache \
    postgresql-client \
    curl \
    dumb-init

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 复制脚本文件
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# 创建必要目录
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

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动命令
CMD ["node", "server.js"]
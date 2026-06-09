# Rento rollback-only container image - 多阶段构建 Dockerfile
# 兼容 Docker 和 Podman 构建
# 注意：该镜像只保留给 legacy 容器化回滚基线，不再承担正式部署主线。
# 构建命令: podman build -t rento:latest . 或 docker build -t rento:latest .

# syntax=docker/dockerfile:1

# 阶段1: 依赖安装和构建
FROM node:20-alpine AS builder

# 跳过额外包安装，直接使用基础镜像

# 设置工作目录
WORKDIR /app

# 复制package文件 (利用Docker层缓存)
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖 (包括开发依赖，构建时需要)
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 生成Prisma客户端 (禁用代理避免网络问题)
ENV http_proxy=""
ENV https_proxy=""
ENV HTTP_PROXY=""
ENV HTTPS_PROXY=""
RUN npx prisma generate

# 构建当前 minix 运行时产物
RUN npm run build:minix

# 删除开发依赖，减小 rollback-only 镜像体积
RUN npm prune --omit=dev

# 阶段2: 生产运行环境
FROM node:20-alpine AS runner

# 跳过运行时依赖安装，使用基础镜像

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户 (安全最佳实践)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置工作目录
WORKDIR /app

# 复制运行所需产物 (使用非root用户权限)
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/build ./build
COPY --from=builder --chown=nextjs:nodejs /app/deploy ./deploy
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/.env.example ./.env.example
## 复制生产依赖，确保 Prisma CLI 及其依赖可离线使用
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 复制脚本文件
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod +x ./scripts/*.sh && chmod +x ./node_modules/.bin/prisma

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
ENV APP_INTERNAL_PORT=3001
ENV MINIX_SERVER_PORT=3001
ENV HOSTNAME="0.0.0.0"

# 健康检查 (使用node内置功能)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# 启动当前 minix 运行时
CMD ["node", "./scripts/start-minix.mjs"]

# Rento 房屋租赁管理系统 - 多阶段构建 Dockerfile
# 兼容 Docker 和 Podman 构建
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

# 构建应用 (Next.js standalone模式)
RUN npm run build

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

# 复制构建产物 (使用非root用户权限)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
## 复制完整的 node_modules，确保 Prisma CLI 及其依赖可离线使用
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
ENV HOSTNAME="0.0.0.0"

# 健康检查 (使用node内置功能)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# 启动命令 (不使用dumb-init)
CMD ["node", "server.js"]
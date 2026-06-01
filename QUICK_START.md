# QUICK_START.md

## 5 分钟启动
### 方案 A：源码生产模式实测
```bash
git clone https://github.com/helloCplusplus0/Rento.git
cd Rento
cp .env.example .env
npm ci
npx prisma generate
npm run lint
npm run type-check
npm run build
npm run start
```

### 方案 B：容器快速验证
```bash
git clone https://github.com/helloCplusplus0/Rento.git
cd Rento
cp .env.example .env
docker compose up --build -d
sleep 30
docker compose exec app /app/scripts/migrate-and-seed.sh
curl http://localhost:3001/api/health
```

## 访问地址
- 应用：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`

## 前提
- Ubuntu 24 或兼容 Linux 环境
- Podman / Podman Compose，或 Docker / Docker Compose
- 可用的 PostgreSQL 容器端口与磁盘空间
- 若走源码生产模式实测，宿主机需安装 Node.js 20 与可访问的 PostgreSQL

## 首次启动前
- 先复制 `cp .env.example .env`
- 至少补齐：`AUTH_SESSION_SECRET`、`ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH`
- 当前项目统一使用 PostgreSQL，不再提供 SQLite 本地开发方案
- `docker compose up --build -d` 表示基于当前源码构建容器；若改用 GHCR 镜像部署，可设置 `APP_IMAGE` 后执行 `docker compose pull app && docker compose up -d`
- 当前后台只适合受控私有部署，不建议直接暴露到公网

## 更多文档
- 项目总览：[README.md](file:///home/dell/Projects/Rento/README.md)
- 环境变量：[ENVIRONMENT_GUIDE.md](file:///home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md)
- 私有部署与验收：[DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md)

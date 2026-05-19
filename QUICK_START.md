# QUICK_START.md

## 5 分钟启动
```bash
git clone https://github.com/helloCplusplus0/Rento.git
cd Rento
cp .env.example .env
podman-compose up -d
sleep 30
podman exec -it rento-app /app/scripts/migrate-and-seed.sh
curl http://localhost:3001/api/health
```

## 访问地址
- 应用：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`

## 前提
- Ubuntu 24 或兼容 Linux 环境
- Podman / Podman Compose，或 Docker / Docker Compose
- 可用的 PostgreSQL 容器端口与磁盘空间

## 重要说明
- 当前项目统一使用 PostgreSQL，不再提供 SQLite 本地开发方案。
- `.env` 是本地私有配置文件，请不要把真实地址、密码、密钥写回共享文档。
- 在鉴权完成前，不建议把当前版本直接暴露到公网。

## 更多文档
- [README.md](./README.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md)

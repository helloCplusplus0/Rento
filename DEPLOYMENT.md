# DEPLOYMENT.md

## 1. 部署策略
Rento 当前采用统一容器部署策略：本地、测试、生产都以 `docker-compose.yml` 为主入口，数据库统一使用 PostgreSQL。

## 2. 本地部署
```bash
cp .env.example .env
podman-compose up -d
podman exec -it rento-app /app/scripts/migrate-and-seed.sh
curl http://localhost:3001/api/health
```

## 3. 云服务器部署
```bash
chmod +x scripts/cloud-deploy.sh
./scripts/cloud-deploy.sh your-domain.com
```

脚本会自动：
- 检测 Podman 或 Docker
- 更新 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS`
- 启动容器
- 执行数据库同步与健康检查

## 4. 环境要求
- Ubuntu 24 或兼容 Linux
- 2 GB 以上内存
- PostgreSQL 与 Redis 所需端口可用
- 正式环境建议启用反向代理和 HTTPS

## 5. PostgreSQL 说明
- 当前主线数据库为 PostgreSQL。
- 现有 Prisma schema 已固定为 PostgreSQL。
- 历史迁移锁仍保留 SQLite 时代遗留，因此 `scripts/migrate-and-seed.sh` 会在必要时回退到 `prisma db push` 做兼容同步；这属于过渡方案，不代表 SQLite 仍是当前支持路径。

## 6. 安全清单
- 生产环境必须修改 `NEXTAUTH_URL`
- 生产环境必须修改 `ALLOWED_ORIGINS`
- 生产环境必须使用私有 `.env`
- 在鉴权完成前，不要把管理后台开放到公网
- 使用 HTTPS、强密码和反向代理

## 7. 常用命令
```bash
podman-compose ps
podman-compose logs -f
podman-compose restart
podman-compose down
```

如使用 Docker，请替换为对应的 `docker-compose` 命令。

## 8. 故障排查
### 健康检查失败
```bash
./scripts/health-check.sh
curl http://localhost:3001/api/health
```

### 数据库未就绪
```bash
podman-compose logs postgres
podman-compose restart postgres
```

### 应用容器异常
```bash
podman-compose logs app
```

## 9. 反向代理
如需启用 Nginx：
```bash
podman-compose --profile nginx up -d
```

证书与代理配置位于：
- `nginx/nginx.conf`
- `nginx/ssl/`

生产环境请使用正式证书，不要依赖开发用自签名材料。

# DEPLOYMENT.md

## 1. 部署策略
Rento 当前采用统一容器部署策略：本地、测试、生产都以 `docker-compose.yml` 为主入口，数据库统一使用 PostgreSQL。

## 2. 本地部署
```bash
cp .env.example .env
podman-compose up -d
podman-compose exec app /app/scripts/migrate-and-seed.sh
curl "http://localhost:${APP_PORT:-3001}/api/health"
```

- 若使用默认 `CONTAINER_PREFIX=rento`，`podman-compose exec app ...` 等价于 `podman exec -it rento-app ...`。
- 若修改了 `APP_PORT`，请同步替换健康检查与浏览器访问地址，不要继续写死 `3001`。

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
- 至少补齐 `AUTH_SESSION_SECRET`、`ADMIN_PASSWORD_HASH`、`POSTGRES_PASSWORD`

## 5. PostgreSQL 说明
- 当前主线数据库为 PostgreSQL。
- 现有 Prisma schema 已固定为 PostgreSQL。
- 历史迁移锁仍保留 SQLite 时代遗留，因此 `scripts/migrate-and-seed.sh` 当前保留两级兼容：
- 若 `migration_lock.toml` 仍指向 SQLite，则直接走 `prisma db push`
- 若 `migrate deploy` 在当前历史迁移链上失败，也会临时回退到 `prisma db push`
- 上述路径仅用于过渡期保证 PostgreSQL 环境按现状 schema 可启动，不代表现有 `prisma/migrations/` 已是正式 PostgreSQL 迁移基线。
- 在完成 PostgreSQL 基线重建或 baseline resolve 验证前，不应移除该兼容分支。

## 6. 安全清单
- 生产环境必须修改 `NEXTAUTH_URL`
- 生产环境必须修改 `ALLOWED_ORIGINS`
- 生产环境必须使用私有 `.env`
- 生产环境必须配置 `AUTH_SESSION_SECRET`
- 生产环境必须配置 `ADMIN_PASSWORD_HASH`
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
curl "http://localhost:${APP_PORT:-3001}/api/health"
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

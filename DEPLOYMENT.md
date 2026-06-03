# DEPLOYMENT.md

## 最小必做清单
1. 拉取部署资产：
```bash
curl -fsSL https://raw.githubusercontent.com/helloCplusplus0/Rento/main/scripts/bootstrap-deploy-assets.sh | bash -s -- /opt/rento
```
2. 进入目录并生成私有配置：
```bash
cd /opt/rento
cp .env.example .env
mkdir -p nginx/ssl logs/nginx backups
```
3. 编辑 `.env`，至少填这些值：
```env
NEXTAUTH_URL=https://rento.example.com
ALLOWED_ORIGINS=https://rento.example.com
AUTH_SESSION_SECRET=replace-with-a-secure-random-secret
NEXTAUTH_SECRET=replace-with-a-secure-random-secret
ADMIN_PASSWORD_HASH=scrypt:replace-with-salt:replace-with-password-hash
POSTGRES_PASSWORD=YOUR_PASSWORD
CONTAINER_DATABASE_URL=postgresql://rento:YOUR_PASSWORD_URLENCODED@postgres:5432/rento_production
```
4. 把证书放到固定路径：
```bash
cp /path/to/fullchain.pem ./nginx/ssl/fullchain.pem
cp /path/to/privkey.pem ./nginx/ssl/privkey.pem
```
5. 执行部署：
```bash
chmod +x scripts/cloud-deploy.sh
./scripts/cloud-deploy.sh rento.example.com
```
6. 验证：
```bash
curl -kI https://rento.example.com/api/health
```

## 最终基线
- 应用固定使用预构建镜像，不再在云服务器上执行源码构建
- `postgres`、`redis`、`app`、`nginx` 全部使用容器运行
- `nginx` 固定负责 `80 -> 443` 跳转和 HTTPS 终止
- `app`、`postgres`、`redis` 只走容器内网络
- 生产入口固定为 `https://<domain>`

## 部署前检查
- 服务器已安装 Docker Compose 或 Podman Compose
- DNS 已解析到当前服务器公网 IP
- 安全组已放行 `80/443`
- 已准备好正式证书和私钥
- `.env` 中已填入真实域名、密钥、管理员哈希和数据库密码

## 说明
### 部署资产拉取
- 推荐不要整仓库完整拉取到云服务器，而是只拉取部署所需资产
- `bootstrap-deploy-assets.sh` 会自动使用 Git sparse-checkout
- 会自动创建 `nginx/ssl`、`logs/nginx`、`backups`
- 会保留后续更新所需的 Git 远端关系

当前部署资产集合固定为：
- `.env.example`
- `README.md`
- `DEPLOYMENT.md`
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/bootstrap-deploy-assets.sh`
- `scripts/cloud-deploy.sh`
- `scripts/health-check.sh`
- `scripts/init-db.sh`

### 常用配置项
```env
APP_IMAGE=ghcr.io/hellocplusplus0/rento@sha256:9ae214a2ebe776ddf68ed80b61193b4139ee2ff7eb41994a51a4b755440e3abd
HTTP_PORT=80
HTTPS_PORT=443
CONTAINER_REDIS_URL=redis://redis:6379
NGINX_SSL_DIR=./nginx/ssl
HOST_LOG_DIR=./logs
HOST_BACKUP_DIR=./backups
HOST_NGINX_LOG_DIR=./logs/nginx
```

### 环境变量规则
- `.env.example` 是唯一共享模板
- `.env` 是服务器私有配置，不应提交到版本控制
- `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS` 默认应保持一致
- `ADMIN_PASSWORD_HASH` 必须使用 `scrypt:<salt>:<hash>` 格式
- 不要再引入 `ADMIN_PASSWORD_PLAINTEXT`

### 管理员密码哈希生成
```bash
node -e "const { randomBytes, scryptSync } = require('node:crypto'); const password = process.argv[1]; const salt = randomBytes(16).toString('hex'); const hash = scryptSync(password, salt, 64).toString('hex'); console.log(`scrypt:${salt}:${hash}`)" "your-password"
```

## 脚本行为
`scripts/cloud-deploy.sh` 会执行以下动作：
- 自动识别 Docker 或 Podman
- 若 `.env` 不存在则从模板生成
- 可根据入参写入 `NEXTAUTH_URL` 和 `ALLOWED_ORIGINS`
- 校验 `.env` 必填项和证书文件
- 拉取固定镜像
- 启动 `postgres`、`redis`、`app`
- 等待健康检查通过后执行数据库初始化
- 启动 `nginx`
- 执行本机 HTTPS 健康检查

## 手动运维
启动后常用命令：
```bash
docker compose ps
docker compose logs -f
docker compose exec app /app/scripts/migrate-and-seed.sh
docker compose restart nginx
docker compose down
```

如果使用 Podman，请替换为 `podman compose` 或 `podman-compose`。

## 验收清单
- `https://rento.example.com/api/health` 返回 `200`
- `https://rento.example.com/login` 可打开并完成管理员登录
- 首页、房源、合同、账单主链可访问
- 浏览器能正常读取 `manifest.json`
- Android Chrome 可识别安装入口
- 安装后的 PWA 可启动、登录、刷新和更新

## 更新流程
常规更新：
```bash
docker compose pull app
docker compose up -d app nginx
docker compose exec app /app/scripts/migrate-and-seed.sh
```

如果要冻结到新的镜像版本，请直接修改 `.env` 中的 `APP_IMAGE`。

如果云服务器只保留了部署资产，也可以执行：
```bash
./scripts/bootstrap-deploy-assets.sh /opt/rento
```

这会在保持稀疏拉取范围不变的前提下更新部署文件。

## 回滚流程
如果新镜像异常：
1. 把 `.env` 中的 `APP_IMAGE` 改回上一个可用 digest
2. 执行 `docker compose pull app`
3. 执行 `docker compose up -d app nginx`
4. 重新验证 `/api/health` 和登录页

## 安全要求
- 不要把 `.env`、证书、私钥提交到仓库
- 不要保留明文管理员密码
- 不要额外暴露 `postgres` 或 `redis` 到公网
- 不要再引入第二套部署入口、第二套 Nginx 配置或第二套 compose 文件

# ENVIRONMENT_GUIDE.md

## 1. 配置文件说明
- `.env`：本地私有环境配置，真实部署时使用，不应作为共享真相源。
- `.env.example`：环境模板，提供字段说明和安全占位值。
- `docker-compose.yml`：本地/测试/生产统一容器编排入口。
- 当前要求 `.env` 与 `.env.example` 使用同一组键名；允许不同的只有具体值，不允许再并列维护第二套环境变量命名真相。
- `PORT`、`HOSTNAME`、`npm_package_version` 等运行时变量由进程或包管理器注入，不属于用户手工维护的 `.env` 键。

## 2. 当前配置原则
- PostgreSQL-only：当前主线不再支持 SQLite 开发配置。
- `.env` 私有：局域网地址、密码、密钥可保留在本地 `.env`，不应同步到共享文档。
- 域名优先：生产环境使用正式域名，局域网地址仅用于本地或内网调试。
- 迁移兼容显式化：当前 Prisma 迁移链仍保留 SQLite 历史兼容，容器初始化脚本中的 `db push` 只是过渡兜底，不是正式 PostgreSQL 迁移基线。

## 3. 最小配置步骤
```bash
cp .env.example .env
npm run dev:check
```

至少确认以下字段：
```bash
HOST_IP=127.0.0.1
APP_INTERNAL_PORT=3001
APP_PORT=3001
NEXTAUTH_URL=http://localhost:3001
AUTH_SESSION_SECRET=replace-me
NEXTAUTH_SECRET=replace-me
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:YOUR_SALT:YOUR_HASH
DATABASE_URL=postgresql://rento:YOUR_PASSWORD_URLENCODED@127.0.0.1:5432/rento_production
CONTAINER_DATABASE_URL=postgresql://rento:YOUR_PASSWORD_URLENCODED@postgres:5432/rento_production
REDIS_URL=redis://127.0.0.1:6379
CONTAINER_REDIS_URL=redis://redis:6379
POSTGRES_PASSWORD=YOUR_PASSWORD
ALLOWED_ORIGINS=http://localhost:3001
```

若要手动启动本地开发服务器，推荐统一使用：

```bash
npm run dev
```

该入口会先按 Next.js 的 `.env*` 加载顺序校验开发态上下文，再启动 `next dev`，避免浏览器验证与脚本验证落在不同环境里。

## 4. 关键字段
### 应用相关
- `NODE_ENV`：运行环境
- `HOST_IP`：宿主机或局域网访问地址，用于拼装本地访问入口
- `APP_INTERNAL_PORT`：容器内应用监听端口
- `APP_PORT`：宿主机暴露端口；默认与 `APP_INTERNAL_PORT` 保持一致
- `NEXTAUTH_URL`：应用对外访问地址
- `NEXTAUTH_SECRET`：历史兼容密钥，当前仍可作为 session secret 回退值
- `AUTH_SESSION_SECRET`：当前最小门禁使用的 session 签名密钥

### 认证相关
- `ADMIN_USERNAME`：管理员登录账号
- `ADMIN_PASSWORD_HASH`：管理员密码哈希，格式固定为 `scrypt:<salt>:<hash>`
- 当前不再依赖开放注册；必须显式配置管理员账号与密码哈希

### 数据库相关
- `DATABASE_URL`：宿主机开发、Prisma CLI、本地脚本使用的 PostgreSQL 连接串，应指向宿主机可访问地址
- `CONTAINER_DATABASE_URL`：容器内应用运行时使用的 PostgreSQL 连接串，应指向容器服务名
- `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`：容器数据库初始化配置
- `POSTGRES_PORT`：宿主机映射端口
- 容器部署时，应用实际拿到的是 `docker-compose.yml` 注入后的 `DATABASE_URL=${CONTAINER_DATABASE_URL}`；不要把宿主机开发用 `DATABASE_URL` 误读为容器内连接串

### 安全与网络
- `ALLOWED_ORIGINS`：允许的来源地址
- `CORS_ENABLED`：是否开启 CORS 校验
- `MAX_REQUEST_SIZE`：请求体限制，当前按字节解析，不接受 `10mb` 这类带单位写法
- `REQUEST_TIMEOUT`：请求超时

### 缓存与运行时目录
- `REDIS_URL`：宿主机开发或本地脚本访问缓存时使用的连接串
- `CONTAINER_REDIS_URL`：容器内应用运行时使用的缓存连接串
- `LOG_DIR` / `BACKUP_DIR`：宿主机可写路径
- `CONTAINER_LOG_DIR` / `CONTAINER_BACKUP_DIR`：容器内路径

## 5. 本地开发建议
- 可在 `.env` 中使用真实局域网地址进行本地联调。
- 若是本机访问，默认可用：`http://localhost:3001`。
- 若使用局域网地址，请同步更新：
  - `HOST_IP`
  - `APP_PORT`
  - `NEXTAUTH_URL`
  - `ALLOWED_ORIGINS`
- 宿主机开发时，`DATABASE_URL` / `REDIS_URL` 不能继续写成 `postgres` / `redis` 这类仅容器内可解析的服务名。
- 容器运行所需的连接统一写入 `CONTAINER_DATABASE_URL` / `CONTAINER_REDIS_URL`，再由 `docker-compose.yml` 注入到容器应用。
- 若要启用认证登录，请至少补齐：
  - `AUTH_SESSION_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
- 推荐先执行 `npm run dev:check`，确认开发态关键变量完整后再执行 `npm run dev`。
- `npm run dev:check` 现在会校验 `DATABASE_URL` 的真实连通性与认证是否有效，而不只是检查变量是否存在。
- 当前统一开发入口的阻断项为：
  - `DATABASE_URL`
  - `ADMIN_PASSWORD_HASH`
  - `AUTH_SESSION_SECRET` 或 `NEXTAUTH_SECRET`
- `REDIS_URL` 当前仅作为非阻断提示保留，用于后续缓存依赖接入时保持上下文一致。
- `scripts/health-check.sh` 与 `scripts/benchmark.js` 默认会复用 `NEXTAUTH_URL` / `APP_PORT` / `APP_INTERNAL_PORT` 推导访问地址，不再单独维护第二套应用 URL 真相。
- 不要为了开发方便绕过 `middleware` 或移除登录门禁；开发态与浏览器验证应共享同一套认证 / 数据库配置假设。

## 6. 生产环境建议
- 使用正式域名和 HTTPS
- 使用强密码与随机密钥
- 将反向代理证书放到受控路径，不提交私钥
- 不要把生产 `.env` 放入版本控制
- 不要在生产环境使用明文密码；仅使用 `ADMIN_PASSWORD_HASH`

## 6.1 生成管理员密码哈希
```bash
node -e "const { randomBytes, scryptSync } = require('node:crypto'); const password = process.argv[1]; const salt = randomBytes(16).toString('hex'); const hash = scryptSync(password, salt, 64).toString('hex'); console.log(`scrypt:${salt}:${hash}`)" "your-password"
```

- 将输出值写入 `ADMIN_PASSWORD_HASH`
- 不要把明文密码回写到共享文档

## 7. 已知历史遗留
- 早期项目曾使用 SQLite，本仓库仍残留少量历史注释和兼容脚本。
- 当前执行与发布口径以 PostgreSQL 为准；遇到冲突时，以 `prisma/schema.prisma`、`.env.example` 和顶层治理文档为准。
- `prisma/migrations/migration_lock.toml` 当前仍指向 SQLite，`scripts/migrate-and-seed.sh` 会在该锁存在或 `migrate deploy` 无法应用旧迁移链时回退到 `db push`。
- 该兼容分支的当前作用是保证 PostgreSQL 环境按现状 schema 可启动；正式退出前至少需要完成 PostgreSQL 基线方案、空库验证和兼容替代验证。
- 当前推荐的开发态启动方式已从裸 `npm run dev` 升级为统一入口；若需直接调用 `next dev` 做底层排查，请显式使用 `npm run dev:next`，且仅作为临时调试手段。

# ENVIRONMENT_GUIDE.md

## 1. 配置文件说明
- `.env`：本地私有环境配置，真实部署时使用，不应作为共享真相源。
- `.env.example`：环境模板，提供字段说明和安全占位值。
- `docker-compose.yml`：本地/测试/生产统一容器编排入口。

## 2. 当前配置原则
- PostgreSQL-only：当前主线不再支持 SQLite 开发配置。
- `.env` 私有：局域网地址、密码、密钥可保留在本地 `.env`，不应同步到共享文档。
- 域名优先：生产环境使用正式域名，局域网地址仅用于本地或内网调试。

## 3. 最小配置步骤
```bash
cp .env.example .env
```

至少确认以下字段：
```bash
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=replace-me
AUTH_SESSION_SECRET=replace-me
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:YOUR_SALT:YOUR_HASH
DATABASE_URL=postgresql://rento:YOUR_PASSWORD@postgres:5432/rento_production
POSTGRES_PASSWORD=YOUR_PASSWORD
ALLOWED_ORIGINS=http://localhost:3001
```

## 4. 关键字段
### 应用相关
- `NODE_ENV`：运行环境
- `APP_INTERNAL_PORT`：容器内应用监听端口
- `NEXTAUTH_URL`：应用对外访问地址
- `NEXTAUTH_SECRET`：历史兼容密钥，当前仍可作为 session secret 回退值
- `AUTH_SESSION_SECRET`：当前最小门禁使用的 session 签名密钥

### 认证相关
- `ADMIN_USERNAME`：管理员登录账号
- `ADMIN_PASSWORD_HASH`：管理员密码哈希，格式固定为 `scrypt:<salt>:<hash>`
- 当前不再依赖开放注册；必须显式配置管理员账号与密码哈希

### 数据库相关
- `DATABASE_URL`：Prisma 使用的 PostgreSQL 连接串
- `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`：容器数据库初始化配置

### 安全与网络
- `ALLOWED_ORIGINS`：允许的来源地址
- `CORS_ENABLED`：是否开启 CORS 校验
- `MAX_REQUEST_SIZE`：请求体限制
- `REQUEST_TIMEOUT`：请求超时

## 5. 本地开发建议
- 可在 `.env` 中使用真实局域网地址进行本地联调。
- 若是本机访问，默认可用：`http://localhost:3001`。
- 若使用局域网地址，请同步更新：
  - `NEXTAUTH_URL`
  - `ALLOWED_ORIGINS`
- 若要启用认证登录，请至少补齐：
  - `AUTH_SESSION_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`

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

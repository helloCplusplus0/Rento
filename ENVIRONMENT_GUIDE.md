# Rento 环境配置简明指南

快速了解 Rento 项目的环境配置，3分钟上手。

## 📁 配置文件说明

| 文件名 | 用途 | 说明 |
|--------|------|------|
| `.env` | 当前环境配置 | 实际使用的环境变量（不提交到版本控制） |
| `.env.example` | 配置模板 | 包含所有配置项和安全默认值 |
| `docker-compose.yml` | 容器编排 | 适用于所有环境的统一配置 |

## 🚀 快速配置

### 1. 复制配置模板
```bash
cp .env.example .env
```

### 2. 根据需要调整配置

**开发环境**（本地开发）：
```bash
# 编辑 .env 文件
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
ENABLE_MONITORING=false
LOG_LEVEL=debug
```

**生产环境**（服务器部署）：
```bash
# 编辑 .env 文件
NEXTAUTH_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
# 其他配置保持默认即可
```

### 3. 启动服务
```bash
podman-compose up -d
# 或 docker-compose up -d
```

## 🔧 核心配置项

### 必须配置的项目

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `NEXTAUTH_SECRET` | 会话加密密钥 | 已提供安全默认值 |
| `POSTGRES_PASSWORD` | 数据库密码 | 已提供安全默认值 |
| `NEXTAUTH_URL` | 应用访问地址 | 生产环境需修改为实际域名 |

### 可选配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | production |
| `LOG_LEVEL` | 日志级别 | info |
| `ENABLE_MONITORING` | 启用监控 | true |

## 🔒 安全说明

### 默认安全配置
- ✅ **安全密钥**: 已预生成强密码和密钥
- ✅ **数据库密码**: 使用随机生成的安全密码
- ✅ **监控启用**: 默认启用性能监控
- ✅ **日志配置**: 合理的日志级别设置

### 生产环境建议
- 🔐 修改 `NEXTAUTH_URL` 为实际域名
- 🔐 修改 `ALLOWED_ORIGINS` 为实际域名
- 🔐 可选：自定义密码（已提供安全默认值）

## 🛠️ 环境切换

### 开发 → 生产
```bash
# 修改 .env 文件中的域名配置
NEXTAUTH_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
```

### 生产 → 开发
```bash
# 修改 .env 文件
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001
```

## 📝 常见问题

**Q: 需要修改哪些配置？**
A: 对于快速测试，只需复制 `.env.example` 为 `.env` 即可。生产环境建议修改域名相关配置。

**Q: 密码安全吗？**
A: 是的，配置模板已包含随机生成的安全密码和密钥，可直接使用。

**Q: 如何生成新密钥？**
A: 使用 `openssl rand -base64 32` 生成新的 NextAuth 密钥。

**Q: 开发环境用什么数据库？**
A: 推荐使用 SQLite（`DATABASE_URL="file:./prisma/dev.db"`），无需额外配置。

## 🔄 配置验证

启动后验证配置是否正确：
```bash
# 检查服务状态
podman-compose ps

# 检查健康状态
curl http://localhost:3001/api/health

# 查看日志
podman-compose logs -f
```

---

**配置原则**: 安全默认值 + 最小化配置  
**推荐方式**: 使用默认配置 + 按需调整  
**支持环境**: 开发/测试/生产统一配置
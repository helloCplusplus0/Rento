# Rento 环境配置指南

本文档详细说明 Rento 项目的环境配置管理策略和最佳实践。

## 📋 配置文件说明

### 核心配置文件

| 文件名 | 用途 | 说明 |
|--------|------|------|
| `.env` | 当前环境配置 | 实际使用的环境变量，不提交到版本控制 |
| `.env.example` | 配置模板 | 包含所有可用配置项的模板文件 |
| `.env.production` | 生产环境参考 | 生产环境配置示例，包含完整的生产配置 |

### Docker 编排文件

| 文件名 | 用途 | 说明 |
|--------|------|------|
| `docker-compose.yml` | 标准编排配置 | 适用于所有环境的容器编排配置 |

## 🎯 设计原则

### 1. 统一配置管理
- **单一配置文件**: 使用 `.env` 作为唯一的环境配置文件
- **模板驱动**: 通过 `.env.example` 提供完整的配置模板
- **环境无关**: 同一套配置适用于开发、测试、生产环境

### 2. 生产环境优先
- **默认生产配置**: 配置模板默认使用生产环境的安全配置
- **向下兼容**: 开发环境通过注释/取消注释来调整配置
- **安全第一**: 默认启用所有安全特性

### 3. 简化部署流程
- **标准命令**: 使用标准的 `docker-compose up -d` 命令
- **自动发现**: Docker Compose 自动读取 `.env` 文件
- **一致体验**: 本地开发和生产部署使用相同的命令

## 🔧 配置使用指南

### 开发环境配置

```bash
# 1. 复制配置模板
cp .env.example .env

# 2. 修改为开发环境配置
nano .env

# 3. 调整以下配置项：
# NODE_ENV=development
# DATABASE_URL="file:./dev.db"  # 使用 SQLite
# NEXTAUTH_URL=http://localhost:3001
# 注释掉生产环境相关配置

# 4. 启动服务（推荐使用Podman）
podman-compose up -d
# 或使用Docker: docker-compose up -d
```

### 生产环境配置

```bash
# 1. 复制配置模板
cp .env.example .env

# 2. 修改生产环境配置
nano .env

# 3. 必须修改的配置项：
# POSTGRES_PASSWORD=your-secure-password-here
# NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
# NEXTAUTH_URL=https://your-domain.com
# 启用所有生产环境配置

# 4. 启动服务（推荐使用Podman）
podman-compose up -d
# 或使用Docker: docker-compose up -d
```

### 测试环境配置

```bash
# 1. 复制配置模板
cp .env.example .env

# 2. 修改为测试环境配置
nano .env

# 3. 调整以下配置项：
# NODE_ENV=test
# DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/rento_test
# 启用必要的监控和日志

# 4. 启动服务（推荐使用Podman）
podman-compose up -d
# 或使用Docker: docker-compose up -d
```

## 🚀 部署命令

### 统一部署命令

无论在哪个环境，都使用相同的命令：

```bash
# 启动服务（推荐使用Podman）
podman-compose up -d

# 或使用Docker（备选）
docker-compose up -d

# 查看状态
podman-compose ps  # 或 docker-compose ps

# 查看日志
podman-compose logs -f  # 或 docker-compose logs -f

# 停止服务
podman-compose down  # 或 docker-compose down
```

### 环境差异通过配置体现

不同环境的差异完全通过 `.env` 文件中的配置来体现：

- **开发环境**: SQLite 数据库，调试日志，开发端口
- **测试环境**: PostgreSQL 数据库，测试数据，监控启用
- **生产环境**: PostgreSQL 数据库，生产安全配置，完整监控

## 📊 配置项详解

### 应用基础配置

```bash
NODE_ENV=production              # 运行环境：development/test/production
PORT=3001                       # 应用端口
NEXTAUTH_URL=http://localhost:3001  # 应用访问地址
NEXTAUTH_SECRET=your-secret     # NextAuth 密钥（必须修改）
```

### 数据库配置

```bash
# 开发环境 - SQLite
DATABASE_URL="file:./dev.db"

# 生产环境 - PostgreSQL
DATABASE_URL=postgresql://rento:password@postgres:5432/rento_production
POSTGRES_DB=rento_production
POSTGRES_USER=rento
POSTGRES_PASSWORD=your-secure-password  # 必须修改
```

### 服务配置

```bash
BACKUP_DIR=/app/backups         # 备份目录
LOG_DIR=/app/logs              # 日志目录
REDIS_URL=redis://redis:6379   # Redis 缓存（可选）
```

### 监控配置

```bash
ENABLE_MONITORING=true          # 启用监控
PERFORMANCE_MONITORING=true     # 性能监控
LOG_LEVEL=info                 # 日志级别
```

### 安全配置

```bash
ALLOWED_ORIGINS=http://localhost:3001  # 允许的来源
CORS_ENABLED=true                      # 启用 CORS
MAX_REQUEST_SIZE=10mb                  # 最大请求大小
REQUEST_TIMEOUT=30000                  # 请求超时时间
```

## 🔒 安全最佳实践

### 1. 敏感信息管理

```bash
# ✅ 正确：使用强密码
POSTGRES_PASSWORD=Rt9$mK2#vL8@nQ5w

# ❌ 错误：使用弱密码
POSTGRES_PASSWORD=123456

# ✅ 正确：使用随机密钥
NEXTAUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# ❌ 错误：使用默认密钥
NEXTAUTH_SECRET=your-secret-key-here
```

### 2. 环境隔离

```bash
# 开发环境
NODE_ENV=development
DATABASE_URL="file:./dev.db"
LOG_LEVEL=debug

# 生产环境
NODE_ENV=production
DATABASE_URL=postgresql://...
LOG_LEVEL=info
```

### 3. 配置验证

在应用启动时验证关键配置：

```typescript
// 验证必需的环境变量
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'POSTGRES_PASSWORD'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
```

## 🔄 迁移指南

### 从旧配置迁移

如果你之前使用多个配置文件，可以按以下步骤迁移：

```bash
# 1. 备份现有配置
cp .env .env.backup
cp .env.local .env.local.backup

# 2. 使用新的配置模板
cp .env.example .env

# 3. 从备份文件中复制有效配置到新的 .env 文件

# 4. 删除旧的配置文件
rm .env.local .env.local.template

# 5. 测试新配置（推荐使用Podman）
podman-compose up -d
# 或使用Docker: docker-compose up -d
```

## 📝 维护建议

### 1. 定期更新配置模板

当添加新功能时，及时更新 `.env.example`：

```bash
# 添加新配置项到模板
echo "NEW_FEATURE_ENABLED=true" >> .env.example
```

### 2. 配置文档同步

确保配置变更同步到相关文档：

- `README.md` - 快速开始指南
- `DEPLOYMENT.md` - 部署指南
- `ENVIRONMENT_GUIDE.md` - 本文档

### 3. 安全审查

定期审查配置文件，确保：

- 没有硬编码的敏感信息
- 默认配置符合安全要求
- 生产环境配置正确

---

**文档版本**: v1.0  
**最后更新**: 2024年1月  
**维护者**: Rento 开发团队
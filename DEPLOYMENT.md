# Rento 快速部署指南

Rento 房屋租赁管理系统的简化部署指南，5分钟快速上手。

## 🚀 一键部署

### 系统要求
- **操作系统**: Linux (Ubuntu 20.04+)
- **容器运行时**: Podman (推荐) 或 Docker
- **内存**: 最少 2GB RAM
- **存储**: 最少 10GB 可用空间

### 安装 Podman (推荐)
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y podman podman-compose

# 验证安装
podman --version && podman-compose --version
```

### 快速部署
```bash
# 1. 获取代码
git clone https://github.com/helloCplusplus0/Rento.git
cd Rento

# 2. 配置环境
cp .env.example .env
# 注意：.env 文件已包含安全的默认配置，可直接使用

# 3. 启动服务
podman-compose up -d

# 4. 等待启动完成（约1分钟）
sleep 60

# 5. 初始化数据库
podman exec -it rento-app /app/scripts/migrate-and-seed.sh

# 6. 验证部署
curl http://localhost:3001/api/health
```

### 访问应用
- **应用地址**: http://localhost:3001
- **健康检查**: http://localhost:3001/api/health

## 🔧 自定义配置

### 开发环境配置
如果用于本地开发，编辑 `.env` 文件：
```bash
# 修改为开发模式
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
ENABLE_MONITORING=false
LOG_LEVEL=debug
```

### 生产环境配置
如果用于生产部署，编辑 `.env` 文件：
```bash
# 修改域名和密钥
NEXTAUTH_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com

# 可选：修改密码（已提供安全默认值）
# NEXTAUTH_SECRET=your-custom-secret
# POSTGRES_PASSWORD=your-custom-password
```

## 📊 服务管理

### 常用命令
```bash
# 查看服务状态
podman-compose ps

# 查看日志
podman-compose logs -f

# 重启服务
podman-compose restart

# 停止服务
podman-compose down

# 更新应用
podman-compose pull && podman-compose up -d
```

### 数据备份
```bash
# 备份数据库
podman exec rento-postgres pg_dump -U rento rento_production > backup.sql

# 恢复数据库
podman exec -i rento-postgres psql -U rento rento_production < backup.sql
```

## 🚨 故障排除

### 常见问题

**端口被占用**
```bash
# 检查端口
sudo lsof -i :3001
# 修改端口：编辑 docker-compose.yml 中的端口映射
```

**容器启动失败**
```bash
# 查看日志
podman-compose logs app
# 重新启动
podman-compose down && podman-compose up -d
```

**数据库连接失败**
```bash
# 检查数据库状态
podman-compose logs postgres
# 重启数据库
podman-compose restart postgres
```

### 健康检查
```bash
# 使用内置脚本
./scripts/health-check.sh

# 手动检查
curl http://localhost:3001/api/health | jq
```

## 🔄 使用 Docker (备选)

如果使用 Docker 而不是 Podman，将所有 `podman-compose` 命令替换为 `docker-compose`：

```bash
# Docker 安装
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh

# Docker 部署
docker-compose up -d
docker exec -it rento-app /app/scripts/migrate-and-seed.sh
```

## 📞 获取帮助

- **项目仓库**: https://github.com/helloCplusplus0/Rento
- **问题反馈**: GitHub Issues
- **详细文档**: 查看项目 README.md

---

**部署时间**: 约 5 分钟  
**推荐方式**: Podman + 默认配置  
**支持平台**: Linux (Ubuntu/Debian/CentOS)
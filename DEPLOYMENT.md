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

### 云服务器一键部署（推荐）
在云服务器上，可使用内置脚本完成端到端部署：
```bash
# 1) 赋予脚本执行权限
chmod +x scripts/cloud-deploy.sh

# 2) 传入你的域名并执行（例如 example.com）
./scripts/cloud-deploy.sh example.com

# 3) 验证
curl https://example.com:3001/api/health
```
说明：
- 脚本会自动检测 Podman 或 Docker，并选择可用的容器运行时。
- 若传入非 localhost 的域名，脚本会将 `NEXTAUTH_URL` 和 `ALLOWED_ORIGINS` 自动更新为 `https://<domain>`。
- 数据库迁移与健康检查会自动执行与验证。

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

#### 端口与内部监听
```bash
# 容器内部监听端口（compose 已传递为 PORT）
APP_INTERNAL_PORT=3001
# 宿主机暴露端口（compose 映射为 APP_PORT:3001）
APP_PORT=3001
```
保持 `APP_INTERNAL_PORT` 与健康检查端点一致（`/api/health` 默认 3001）。

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

**域名或跨域问题**
```bash
# 确认环境变量已设置：
grep -E "^(NEXTAUTH_URL|ALLOWED_ORIGINS|CORS_ENABLED)=" .env

# 使用脚本自动修复域名相关配置
./scripts/cloud-deploy.sh your-domain.com
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

## 🌐 Nginx 反向代理（可选，生产）
使用 Compose Profile 启用 Nginx 并配置 SSL：
```bash
# 启用 Nginx profile
podman-compose --profile nginx up -d
# 或
docker-compose --profile nginx up -d

# 将证书放置到 ./nginx/ssl 目录
# 并根据需要调整 ./nginx/nginx.conf
```
环境变量：
- `HTTP_PORT`（默认 80）
- `HTTPS_PORT`（默认 443）

## 🔐 云服务器安全与防火墙建议
- 仅开放必要端口（`80/443` 或应用端口 `3001`）
- 使用强密码与随机密钥（`POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`）
- 建议启用 HTTPS 与反向代理

## 📞 获取帮助

- **项目仓库**: https://github.com/helloCplusplus0/Rento
- **问题反馈**: GitHub Issues
- **详细文档**: 查看项目 README.md

---

**部署时间**: 约 5 分钟  
**推荐方式**: Podman + 默认配置  
**支持平台**: Linux (Ubuntu/Debian/CentOS)
# Rento 快速开始指南

⚡ 5分钟快速部署 Rento 房屋租赁管理系统

## 🚀 一键部署

### 前提条件
- Linux 系统 (Ubuntu 20.04+)
- 2GB+ 内存，10GB+ 存储

### 安装 Podman
```bash
sudo apt update && sudo apt install -y podman podman-compose
```

### 部署应用
```bash
# 1. 获取代码
git clone https://github.com/helloCplusplus0/Rento.git && cd Rento

# 2. 配置环境（使用安全默认值）
cp .env.example .env

# 3. 启动服务
podman-compose up -d

# 4. 等待启动（约1分钟）
sleep 60

# 5. 初始化数据库
podman exec -it rento-app /app/scripts/migrate-and-seed.sh

# 6. 验证部署
curl http://localhost:3001/api/health
```

### 访问应用
🌐 **应用地址**: http://localhost:3001

## 🔧 自定义配置

### 开发环境
```bash
# 编辑 .env 文件
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
ENABLE_MONITORING=false
```

### 生产环境
```bash
# 编辑 .env 文件
NEXTAUTH_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
```

## 📊 管理命令

```bash
# 查看状态
podman-compose ps

# 查看日志
podman-compose logs -f

# 重启服务
podman-compose restart

# 停止服务
podman-compose down
```

## 🚨 故障排除

**端口被占用**
```bash
sudo lsof -i :3001
# 修改 docker-compose.yml 中的端口映射
```

**容器启动失败**
```bash
podman-compose logs app
podman-compose down && podman-compose up -d
```

**数据库连接失败**
```bash
podman-compose restart postgres
```

## 📞 获取帮助

- 📖 **详细文档**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🔧 **环境配置**: [ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md)
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/helloCplusplus0/Rento/issues)

---

**部署时间**: 5分钟 | **默认端口**: 3001 | **推荐工具**: Podman
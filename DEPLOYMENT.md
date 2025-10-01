# Rento 统一部署指南

本文档详细说明 Rento 房屋租赁管理系统的统一部署方案，适用于本地开发环境和生产环境。

## 🎯 统一部署理念

**核心原则**: 本地部署和生产部署使用完全相同的流程和配置，确保部署一致性。

- **本地部署**: 在开发环境（Ubuntu 24）中运行容器，验证所有部署环节
- **生产部署**: 在云服务器中运行相同的容器配置
- **唯一差异**: 运行环境的物理位置，配置和流程完全一致

### 优势
- ✅ **部署一致性**: 消除本地和生产环境的差异
- ✅ **风险降低**: 本地验证所有部署步骤，降低生产部署风险
- ✅ **快速部署**: 本地验证通过后，可快速复制到生产环境
- ✅ **问题排查**: 本地可完全复现生产环境问题

## 📋 部署前准备

## 📋 环境要求

### 通用系统要求（本地 + 生产）

- **操作系统**: Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+)
- **容器运行时**: Podman 3.0+ (推荐) 或 Docker 20.10+
- **内存**: 最少 2GB RAM (推荐 4GB+)
- **存储**: 最少 10GB 可用空间 (推荐 20GB+)
- **网络**: 开放端口 3001 (应用), 5432 (数据库), 6379 (Redis)

### 本地开发环境
- **当前环境**: Ubuntu 24 (已验证兼容)
- **容器运行时**: Podman (推荐)
- **用途**: 验证部署流程，测试应用功能
- **访问地址**: http://localhost:3001

### 生产环境
- **推荐配置**: 云服务器 (阿里云、腾讯云、AWS等)
- **容器运行时**: Podman (推荐) 或 Docker
- **用途**: 正式运行环境
- **访问地址**: https://your-domain.com

### 安装容器运行时

#### Podman 安装（推荐）
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y podman podman-compose

# CentOS/RHEL
sudo dnf install -y podman podman-compose

# 验证安装
podman --version
podman-compose --version
```

#### Docker 安装（备选）
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

## 🚀 统一部署流程

### 步骤概览
无论是本地部署还是生产部署，都遵循以下统一流程：

1. **环境准备** → 2. **获取代码** → 3. **配置环境** → 4. **启动服务** → 5. **验证部署**

### 1. 获取部署文件

#### 方式一：完整克隆（推荐）
```bash
# 克隆完整仓库
git clone https://github.com/helloCplusplus0/Rento.git
cd Rento
```

#### 方式二：仅下载部署文件
```bash
# 创建部署目录
mkdir rento-deploy && cd rento-deploy

# 下载核心部署文件
wget https://raw.githubusercontent.com/helloCplusplus0/Rento/main/docker-compose.yml
wget https://raw.githubusercontent.com/helloCplusplus0/Rento/main/.env.example

# 下载部署脚本
mkdir -p scripts
wget -P scripts https://raw.githubusercontent.com/helloCplusplus0/Rento/main/scripts/health-check.sh
wget -P scripts https://raw.githubusercontent.com/helloCplusplus0/Rento/main/scripts/migrate-and-seed.sh
chmod +x scripts/*.sh
```

### 2. 环境配置（统一流程）

#### 基础配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

#### 配置差异化设置

**本地开发环境配置**:
```bash
# 应用访问地址
NEXTAUTH_URL=http://localhost:3001

# 数据库密码（本地测试用）
POSTGRES_PASSWORD=rento-local-2024

# NextAuth 密钥（本地测试用）
NEXTAUTH_SECRET=local-dev-secret-32-characters-long

# 其他配置保持默认
```

**生产环境配置**:
```bash
# 应用访问地址（替换为实际域名）
NEXTAUTH_URL=https://your-domain.com

# 数据库密码（必须使用强密码）
POSTGRES_PASSWORD=your-super-secure-password-here

# NextAuth 密钥（必须使用随机生成的密钥）
NEXTAUTH_SECRET=your-random-32-char-secret-key-here

# 启用生产环境监控
ENABLE_MONITORING=true
PERFORMANCE_MONITORING=true
```

#### 安全密钥生成
```bash
# 生成安全的 NextAuth 密钥
openssl rand -base64 32

# 生成安全的数据库密码
openssl rand -base64 24
```

### 3. 启动服务（统一命令）

无论本地还是生产环境，都使用相同的启动命令：

#### Podman Compose 部署（推荐）
```bash
# 启动所有服务
podman-compose up -d

# 查看服务状态
podman-compose ps

# 查看服务日志
podman-compose logs -f
```

#### Docker Compose 部署（备选）
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

#### 服务启动顺序
系统会自动按以下顺序启动服务：
1. **PostgreSQL** → 2. **Redis** → 3. **Rento应用** → 4. **Nginx**（生产环境）

### 4. 数据库初始化（统一流程）

#### 等待服务启动
```bash
# 等待服务完全启动（约 30-60 秒）
sleep 60

# 或者实时监控启动状态
docker-compose logs -f app
```

#### 执行数据库迁移
```bash
# Podman 环境（推荐）
podman exec -it rento-app-1 /app/scripts/migrate-and-seed.sh

# Docker 环境（备选）
docker exec -it rento-app-1 /app/scripts/migrate-and-seed.sh
```

#### 验证数据库状态
```bash
# 检查数据库连接（Podman）
podman-compose exec postgres psql -U rento -d rento_production -c "SELECT version();"

# 检查表结构（Podman）
podman-compose exec postgres psql -U rento -d rento_production -c "\dt"

# 如果使用Docker，将podman-compose替换为docker-compose
```

### 5. 验证部署（统一验证）

#### 健康检查
```bash
# 使用内置健康检查脚本
./scripts/health-check.sh

# 或直接访问健康检查端点
curl http://localhost:3001/api/health | jq
```

#### 访问应用
**本地环境**:
- 应用地址: http://localhost:3001
- 数据库: localhost:5432 (用户名: rento)
- Redis: localhost:6379

**生产环境**:
- 应用地址: https://your-domain.com
- 数据库: 内部访问 (postgres:5432)
- Redis: 内部访问 (redis:6379)

#### 功能验证清单
- [ ] 应用首页正常加载
- [ ] 用户登录功能正常
- [ ] 数据库连接正常
- [ ] 健康检查端点返回正常
- [ ] 日志输出正常

#### 性能验证
```bash
# 检查容器资源使用
docker stats

# 检查应用响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/health
```

## 🔄 本地到生产的迁移流程

### 本地验证完成后的生产部署

当本地部署验证通过后，可以快速迁移到生产环境：

#### 1. 准备生产服务器
```bash
# 在生产服务器上安装Podman（推荐）
sudo apt update
sudo apt install -y podman podman-compose

# 或者安装Docker（备选）
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 复制部署配置
```bash
# 将本地验证的配置文件上传到生产服务器
scp -r .env docker-compose.yml scripts/ user@production-server:/opt/rento/

# 或使用 rsync 同步
rsync -avz --exclude='.git' ./ user@production-server:/opt/rento/
```

#### 3. 调整生产配置
```bash
# 在生产服务器上修改环境变量
nano /opt/rento/.env

# 主要修改项：
# NEXTAUTH_URL=https://your-domain.com
# POSTGRES_PASSWORD=production-secure-password
# NEXTAUTH_SECRET=production-secure-secret
```

#### 4. 执行生产部署
```bash
# 在生产服务器上执行相同的部署命令
cd /opt/rento

# 使用Podman（推荐）
podman-compose up -d

# 或使用Docker（备选）
# docker-compose up -d

# 执行数据库迁移（Podman）
podman exec -it rento-app-1 /app/scripts/migrate-and-seed.sh

# 验证部署
./scripts/health-check.sh
```

### 配置域名和SSL（生产环境）

#### 域名解析
```bash
# 将域名 A 记录指向生产服务器 IP
# your-domain.com -> your-server-ip
```

#### SSL证书配置
```bash
# 使用 Let's Encrypt 自动获取SSL证书
sudo apt install certbot
sudo certbot --nginx -d your-domain.com
```

## 🔧 高级配置

### 自定义端口

如需修改默认端口，在 `docker-compose.yml` 中调整端口映射：

```yaml
services:
  app:
    ports:
      - "8080:3001"  # 将应用映射到 8080 端口
  postgres:
    ports:
      - "5433:5432"  # 将数据库映射到 5433 端口
```

### 资源限制配置

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

### 数据持久化

默认配置已包含数据持久化：

```yaml
volumes:
  postgres_data:    # PostgreSQL 数据
  redis_data:       # Redis 数据
  ./backups:/app/backups  # 备份文件
  ./logs:/app/logs        # 日志文件
```

## 🛡️ 安全配置（本地 + 生产）

### 1. 防火墙设置

**本地环境**（可选）:
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 3001/tcp
sudo ufw enable
```

**生产环境**（必需）:
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # 应用端口
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### 2. SSL/TLS 配置

使用 Nginx 反向代理配置 HTTPS：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 数据库安全

- 使用强密码
- 限制数据库访问（仅容器内部）
- 定期备份数据

## 📊 运维管理（统一流程）

### 服务管理

#### 查看服务状态
```bash
# 查看所有服务状态（Podman）
podman-compose ps

# 查看特定服务状态（Podman）
podman-compose ps app postgres redis

# 如果使用Docker，将podman-compose替换为docker-compose
```

#### 服务日志管理
```bash
# 查看应用日志（Podman）
podman-compose logs app

# 查看数据库日志（Podman）
podman-compose logs postgres

# 实时跟踪日志（Podman）
podman-compose logs -f --tail=100

# 查看特定时间段日志（Podman）
podman-compose logs --since="2024-01-01T00:00:00" app

# 如果使用Docker，将podman-compose替换为docker-compose
```

#### 服务重启
```bash
# 重启单个服务（Podman）
podman-compose restart app

# 重启所有服务（Podman）
podman-compose restart

# 强制重新创建服务（Podman）
podman-compose up -d --force-recreate

# 如果使用Docker，将podman-compose替换为docker-compose
```

### 数据备份和恢复

#### 数据库备份
```bash
# 创建数据库备份（Podman）
podman exec rento-postgres-1 pg_dump -U rento rento_production > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份文件
gzip backup_$(date +%Y%m%d_%H%M%S).sql

# 如果使用Docker，将podman替换为docker
```

#### 数据库恢复
```bash
# 从备份恢复数据库（Podman）
gunzip backup_20240101_120000.sql.gz
podman exec -i rento-postgres-1 psql -U rento rento_production < backup_20240101_120000.sql

# 如果使用Docker，将podman替换为docker
```

#### 自动备份脚本
```bash
# 创建自动备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/rento/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 使用Podman（推荐）
podman exec rento-postgres-1 pg_dump -U rento rento_production | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# 如果使用Docker，取消注释下面一行并注释上面一行
# docker exec rento-postgres-1 pg_dump -U rento rento_production | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到定时任务
echo "0 2 * * * /opt/rento/backup.sh" | crontab -
```

### 应用更新

#### 更新流程
```bash
# 1. 备份当前数据
./backup.sh

# 2. 拉取最新镜像（Podman）
podman-compose pull

# 3. 停止服务（Podman）
podman-compose down

# 4. 启动新版本（Podman）
podman-compose up -d

# 5. 执行数据库迁移（如果需要）
podman exec -it rento-app-1 /app/scripts/migrate-and-seed.sh

# 6. 验证更新
./scripts/health-check.sh

# 如果使用Docker，将podman-compose替换为docker-compose，podman替换为docker
```

#### 回滚流程
```bash
# 如果更新出现问题，可以快速回滚（Podman）
podman-compose down
podman-compose up -d --force-recreate

# 如果需要恢复数据
podman exec -i rento-postgres-1 psql -U rento rento_production < backup_latest.sql

# 如果使用Docker，将podman-compose替换为docker-compose，podman替换为docker
```

### 监控和告警

#### 健康检查
```bash
# 应用健康状态
curl http://localhost:3001/api/health | jq

# 系统资源监控（通用）
podman stats --no-stream  # 或 docker stats --no-stream

# 磁盘空间检查（通用）
df -h
```

#### 性能监控
```bash
# 查看容器资源使用（Podman）
podman stats

# 查看数据库连接数（Podman）
podman exec rento-postgres-1 psql -U rento -d rento_production -c "SELECT count(*) FROM pg_stat_activity;"

# 查看应用响应时间（通用）
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/health

# 如果使用Docker，将podman替换为docker
```

## 🚨 故障排除（统一解决方案）

### 常见问题及解决方案

#### 1. 端口被占用
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3001
sudo lsof -i :3001

# 解决方案
# 方案1: 停止占用进程
sudo kill -9 <PID>

# 方案2: 修改端口映射
# 编辑 docker-compose.yml，将 "3001:3001" 改为 "3002:3001"
```

#### 2. 数据库连接失败
```bash
# 检查数据库容器状态（Podman）
podman-compose logs postgres

# 检查数据库连接（Podman）
podman exec rento-postgres-1 pg_isready -U rento

# 解决方案
# 1. 重启数据库服务（Podman）
podman-compose restart postgres

# 2. 检查环境变量配置
grep POSTGRES .env

# 3. 重新初始化数据库（Podman）
podman-compose down -v
podman-compose up -d

# 如果使用Docker，将podman-compose替换为docker-compose，podman替换为docker
```

#### 3. 容器启动失败
```bash
# 查看容器日志（Podman）
podman-compose logs app

# 查看系统资源（通用）
free -h
df -h

# 解决方案
# 1. 清理容器资源（Podman）
podman system prune -f

# 2. 重新构建容器（Podman）
podman-compose down
podman-compose up -d --force-recreate

# 3. 检查配置文件（通用）
podman-compose config  # 或 docker-compose config

# 如果使用Docker，将podman相关命令替换为docker相关命令
```

#### 4. 应用无法访问
```bash
# 检查应用状态（通用）
curl -I http://localhost:3001

# 检查防火墙（通用）
sudo ufw status

# 解决方案
# 1. 检查容器网络（Podman）
podman network ls
podman network inspect rento_rento-network

# 2. 重启应用服务（Podman）
podman-compose restart app

# 3. 检查健康检查（通用）
./scripts/health-check.sh

# 如果使用Docker，将podman相关命令替换为docker相关命令
```

### 日志分析

#### 应用日志分析
```bash
# 查看错误日志（Podman）
podman-compose logs app | grep -i error

# 查看数据库连接日志（Podman）
podman-compose logs postgres | grep connection

# 查看健康检查失败日志（Podman）
podman-compose logs app | grep health

# 如果使用Docker，将podman-compose替换为docker-compose
```

#### 系统日志分析
```bash
# 查看系统日志（通用）
sudo journalctl -u podman.service --since "1 hour ago"  # 或 docker.service

# 查看内存使用情况（通用）
free -h
cat /proc/meminfo

# 查看磁盘使用情况（通用）
df -h
du -sh /var/lib/containers/  # Podman 存储目录
# du -sh /var/lib/docker/    # Docker 存储目录
```

## 📞 技术支持

### 获取帮助

- **项目仓库**: https://github.com/helloCplusplus0/Rento
- **问题反馈**: 在 GitHub Issues 中提交问题
- **部署文档**: 本文档提供完整的部署指南

### 部署检查清单

#### 部署前检查
- [ ] 系统满足最低要求（2GB RAM, 10GB 存储）
- [ ] Docker/Podman 已正确安装
- [ ] 防火墙端口已开放
- [ ] 域名解析已配置（生产环境）

#### 部署过程检查
- [ ] 环境变量已正确配置
- [ ] 容器服务已成功启动
- [ ] 数据库迁移已执行
- [ ] 健康检查通过

#### 部署后检查
- [ ] 应用界面可正常访问
- [ ] 用户功能正常工作
- [ ] 数据库连接正常
- [ ] 备份机制已配置
- [ ] 监控告警已设置

### 最佳实践总结

1. **统一部署**: 本地和生产使用相同的部署流程
2. **容器优先**: 推荐使用 Podman 作为容器运行时，Docker 作为备选
3. **配置管理**: 通过环境变量区分不同环境
4. **数据安全**: 定期备份，使用强密码
5. **监控运维**: 建立完善的监控和告警机制
6. **故障处理**: 准备完整的故障排除方案

### Podman 优势

- **无守护进程**: Podman 不需要守护进程，更安全
- **Rootless 运行**: 支持非 root 用户运行容器
- **兼容性**: 与 Docker 命令兼容，迁移简单
- **安全性**: 更好的安全隔离和权限管理
- **资源效率**: 更低的资源占用

### 快速验证脚本

```bash
# 使用 Podman 部署验证脚本
./scripts/podman-deploy-test.sh

# 该脚本会自动：
# 1. 检查 Podman 环境
# 2. 验证配置文件
# 3. 启动服务
# 4. 执行健康检查
# 5. 显示部署信息
```

---

**文档版本**: v2.0  
**适用环境**: 本地开发 + 生产部署  
**最后更新**: 2024年1月  
**维护者**: Rento 开发团队
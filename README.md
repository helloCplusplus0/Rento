# Rento - 房屋租赁管理系统

专业的房屋租赁管理系统，提供房源管理、租客管理、合同管理、账单管理等功能。

## 🎯 统一部署理念

**核心原则**: 本地部署和生产部署使用完全相同的流程和配置，确保部署一致性。

- **本地部署**: 在开发环境中运行容器，验证所有部署环节
- **生产部署**: 在云服务器中运行相同的容器配置  
- **唯一差异**: 运行环境的物理位置，配置和流程完全一致

## 🚀 快速开始

### ⚡ 5分钟部署
```bash
# 1. 获取代码
git clone https://github.com/helloCplusplus0/Rento.git && cd Rento

# 2. 配置环境（已包含安全默认值）
cp .env.example .env

# 3. 启动服务
podman-compose up -d

# 4. 等待启动完成
sleep 60

# 5. 初始化数据库
podman exec -it rento-app /app/scripts/migrate-and-seed.sh

# 6. 访问应用
# 🌐 http://localhost:3001
```

> 📖 **详细指南**: 查看 [QUICK_START.md](./QUICK_START.md) 获取完整的快速开始指南

### 统一容器部署（推荐）

无论本地还是生产环境，都使用相同的部署流程：

#### 1. 获取代码
```bash
git clone https://github.com/helloCplusplus0/Rento.git
cd Rento
```

#### 2. 配置环境
```bash
# 复制环境变量模板
cp .env.example .env

# 根据环境修改配置
nano .env
```

#### 3. 启动服务
```bash
# 启动所有服务（推荐使用Podman）
podman-compose up -d

# 或使用Docker（备选）
# docker-compose up -d

# 执行数据库迁移
podman exec -it rento-app /app/scripts/migrate-and-seed.sh

# 验证部署
./scripts/health-check.sh
```

#### 4. 访问应用
- **本地环境**: http://localhost:3001
- **生产环境**: https://your-domain.com

> 📖 **详细部署指南**: 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取完整的部署文档

### 云部署（一键脚本）
在云服务器上，使用内置脚本可端到端完成部署与验证：
```bash
# 赋予脚本执行权限
chmod +x scripts/cloud-deploy.sh

# 传入你的域名执行（示例：example.com）
./scripts/cloud-deploy.sh example.com

# 验证健康状态
curl https://example.com:3001/api/health
```
脚本会：
- 自动检测 Podman 或 Docker 并选择可用的容器运行时
- 更新域名相关配置（`NEXTAUTH_URL`、`ALLOWED_ORIGINS`）为 `https://<domain>`
- 拉取镜像、启动容器、执行数据库迁移并做健康检查

#### 端口说明
- `APP_PORT`：宿主机对外暴露端口（默认 `3001`）
- `APP_INTERNAL_PORT`：容器内应用监听端口（默认 `3001`，通过 `PORT` 传入）
两者保持一致，可简化健康检查与代理配置。

### 本地开发（可选）

如需进行代码开发，可以使用本地开发模式：

```bash
# 安装依赖
npm install

# 配置数据库
npx prisma generate
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

#### 健康检查

```bash
# 使用内置健康检查脚本
./scripts/health-check.sh

# 或直接访问健康检查端点
curl http://localhost:3001/api/health
```

#### 服务管理

```bash
# 查看服务状态（推荐使用Podman）
podman-compose ps

# 查看日志
podman-compose logs -f

# 停止服务
podman-compose down

# 重启服务
podman-compose restart

# 如果使用Docker，将podman-compose替换为docker-compose
```

## 📁 项目结构

```
├── src/                     # 应用源代码
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 组件
│   ├── lib/                 # 工具库和配置
│   └── types/               # TypeScript 类型定义
├── prisma/                  # 数据库模式和迁移
├── scripts/                 # 部署和维护脚本
├── .github/workflows/       # GitHub Actions CI/CD
├── docker-compose.yml       # 容器编排配置
├── DEPLOYMENT.md           # 详细部署指南
└── ENVIRONMENT_GUIDE.md    # 环境配置指南
```

## 🛠️ 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL (生产), SQLite (开发)
- **缓存**: Redis
- **容器**: Podman/Docker
- **CI/CD**: GitHub Actions

## 📊 功能特性

- ✅ **房源管理**: 楼栋、房间、状态管理
- ✅ **租客管理**: 信息管理、合同关联
- ✅ **合同管理**: 创建、续约、退租
- ✅ **账单管理**: 租金、水电费、支付状态
- ✅ **水电表管理**: 抄表、计费
- ✅ **数据统计**: 收支统计、趋势分析
- ✅ **移动端适配**: 响应式设计
- ✅ **PWA支持**: 离线访问、安装到桌面

## 🔧 开发指南

### 环境要求

- Node.js 20+
- PostgreSQL 16+ (生产环境)
- Docker/Podman (容器部署)

### 开发命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
npm run type-check

# 数据库操作
npm run db:generate    # 生成 Prisma 客户端
npm run db:migrate     # 运行数据库迁移
npm run db:seed        # 运行种子数据
npm run db:studio      # 打开 Prisma Studio
```

### 容器镜像

项目使用 GitHub Actions 自动构建 Docker 镜像：

- **镜像仓库**: `ghcr.io/hellocplusplus0/rento`
- **标签**: `latest` (主分支), `v*` (版本标签)
- **架构**: linux/amd64, linux/arm64

## 📝 部署注意事项

### 安全配置
- ✅ 修改默认密码 (`POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`)
- ✅ 使用 HTTPS (生产环境)
- ✅ 配置防火墙规则

### 性能优化
- ✅ PostgreSQL 配置已优化
- ✅ Redis 缓存配置
- ✅ 健康检查和监控

### 数据备份
- ✅ 定期备份 PostgreSQL 数据
- ✅ 备份目录: `./backups`
- ✅ 日志目录: `./logs`

## 📖 相关文档

- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: 完整的部署指南
- **[ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md)**: 环境配置指南
- **[GitHub Actions](./.github/workflows/)**: CI/CD 配置

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**版本**: v0.1.0  
**部署方式**: 统一容器部署  
**最后更新**: 2024年1月

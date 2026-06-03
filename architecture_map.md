# architecture_map.md

## 仓库总览
Rento 是一个 `Next.js + Prisma + PostgreSQL + Redis + Nginx` 的单仓库应用。当前仓库同时承载业务源码和最终容器化部署资产，但云服务器最终部署只认一套真相源。

## 最终部署真相源
- `docker-compose.yml`：唯一容器编排入口
- `.env.example`：唯一共享环境模板
- `nginx/nginx.conf`：唯一 HTTPS 反向代理配置
- `scripts/cloud-deploy.sh`：唯一部署执行脚本
- `scripts/bootstrap-deploy-assets.sh`：唯一部署资产拉取脚本

历史上的源码部署、自签 HTTPS、本地 PWA 验收辅助文件已不再属于当前部署主线。

## 根目录结构
```text
Rento/
├── src/                  # 应用源码
├── prisma/               # Prisma schema 与迁移
├── public/               # 静态资源
├── scripts/              # 启动、初始化、部署脚本
├── docs/                 # 设计、分析、归档文档
├── nginx/                # 最终 HTTPS 反向代理配置与证书目录
├── backups/              # 运行时备份挂载目录
├── logs/                 # 运行时日志挂载目录
├── README.md             # 项目总览
├── DEPLOYMENT.md         # 单一部署操作手册
├── architecture_map.md   # 当前文件
├── docker-compose.yml    # 最终容器编排
└── .env.example          # 最终环境模板
```

## 业务源码结构
### `src/app`
- `src/app/page.tsx`：工作台首页入口
- `src/app/rooms`、`renters`、`contracts`、`bills`：核心业务页面
- `src/app/add/*`：新增流程入口
- `src/app/api/*`：后端 API
- `src/app/login/page.tsx`：管理员登录页

### `src/lib`
- `prisma.ts`：Prisma Client 单例
- `queries.ts`：核心查询封装
- `api-error-handler.ts`：API 错误处理与请求约束
- `auth/*`：认证、密码校验、会话守卫
- `health-checker.ts` 等：运行治理能力

### `prisma`
- `schema.prisma`：当前数据库主真相源
- `migrations/`：历史迁移目录，仍包含 SQLite 兼容遗留

## 脚本结构
- `scripts/cloud-deploy.sh`：最终部署辅助脚本
- `scripts/migrate-and-seed.sh`：数据库初始化入口
- `scripts/init-db.sh`：数据库容器初始化脚本
- `scripts/health-check.sh`：健康检查辅助脚本
- `scripts/archive/`：历史归档脚本

## 文档结构
- `README.md`：项目概览与入口摘要
- `DEPLOYMENT.md`：部署资产拉取、环境变量、部署、更新、回滚和验收
- `docs/`：阶段设计、问题分析和历史归档

## 当前结构判断
- 云服务器最终部署不再依赖源码构建能力
- 应用发布主线已经从“服务器构建源码”收口到“服务器拉取固定镜像”
- 目录中的部署资产应继续保持单一路线，避免再次出现第二套 compose、第二套 Nginx 或第二套部署脚本

# Rento

Rento 是一个面向房东/运营者的私有化租赁管理后台，覆盖房源、租客、合同、账单、仪表与抄表管理。

## 当前状态
- 当前阶段：`phase02-auth-gate-*`
- 当前目标：先补齐最小认证门禁与访问边界，再进入一致性和性能加固。
- 当前定位：自用优先、私有部署优先、移动端友好、UI 视觉风格冻结。
- 当前登录方式：最小管理员门禁，默认通过 `/login` 进入后台。

## 核心能力
- 房源管理：楼栋、房间、状态、批量操作
- 租客管理：资料、合同关联、详情展示
- 合同管理：创建、续租、退租、状态流转
- 账单管理：租金、水电费、账单明细、支付状态
- 仪表管理：一个房间支持多个仪表，抄表与账单联动
- 运维辅助：健康检查、数据一致性检查、部署脚本

## 关键约束
- 数据库主线固定为 PostgreSQL，不再恢复 SQLite 开发/同步双轨。
- 在鉴权落地前，禁止将系统作为公网匿名可访问后台部署。
- 当前 UI 设计为已确认资产，后续只做不破坏视觉结果的优化。
- 仪表历史数据必须长期保留，不能因解绑或更换仪表而丢失。

## 技术栈
- 前端：Next.js 15、React 19、TypeScript、Tailwind CSS 4
- 后端：Next.js App Router Route Handlers
- 数据层：Prisma 6、PostgreSQL
- 基础设施：Docker/Podman、Redis、Nginx（可选）

## 快速开始
```bash
cp .env.example .env
podman-compose up -d
podman exec -it rento-app /app/scripts/migrate-and-seed.sh
curl http://localhost:3001/api/health
```

如使用 Docker，请将 `podman-compose` / `podman` 替换为 `docker-compose` / `docker`。
- 首次启用门禁前，请在 `.env` 中补齐：
  - `AUTH_SESSION_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
- 配置完成后，通过 `http://localhost:3001/login` 使用管理员账号登录。

## 运行模式
- 开发热加载模式：使用 `npm run dev` 启动本地 `Next.js dev server`，适合日常开发和浏览器即时反馈。
- 容器部署验证模式：使用 `docker-compose.yml` 启动容器栈，适合验证部署链路、健康检查和环境配置。
- 当前默认开发方式应优先使用开发热加载模式；容器模式不替代本地热加载。

## 文档入口
- [AGENTS.md](./AGENTS.md)：顶层执行规范与阅读顺序
- [project_rules.md](./project_rules.md)：刚性规则、门禁与目录治理
- [architecture_map.md](./architecture_map.md)：仓库结构地图与模块说明
- [plan.md](./plan.md)：当前阶段计划与后续顺序
- [QUICK_START.md](./QUICK_START.md)：最短启动路径
- [DEPLOYMENT.md](./DEPLOYMENT.md)：部署与发布说明
- [ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md)：环境变量与配置说明
- [docs/archive/README.md](./docs/archive/README.md)：历史任务文档归档说明

## 目录结构
```text
src/                 应用源码
prisma/              Prisma schema 与迁移
scripts/             部署、初始化与辅助脚本
docs/                当前分析文档与归档文档
public/              静态资源
nginx/               反向代理配置
```

## 当前已知问题
- 鉴权尚未落地，因此公网部署仍不满足安全门禁。
- SQLite 时代的迁移锁与部分历史脚本仍有遗留，需要单独任务收口。
- 若干性能/演示/验证页面仍与正式页面并存，后续需要分类治理。

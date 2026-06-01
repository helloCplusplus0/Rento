# Rento

Rento 是一个面向房东/运营者的私有化租赁管理后台，覆盖房源、租客、合同、账单、仪表与抄表全链路。

## 当前状态
- 默认工作流：`真实场景验证与 fix 闭环`
- 当前定位：自用优先、私有部署优先、移动端友好、UI 风格冻结
- 当前登录方式：最小管理员门禁，默认通过 `/login` 进入后台
- PWA 交付状态：`phase05-pwa-delivery-*` 已完成当前阶段收口，正式 PWA 只面向受控私有部署

## 核心能力
- 房源管理：楼栋、房间、状态、批量操作
- 租客管理：资料、合同关联、详情展示
- 合同管理：创建、续租、退租、状态流转
- 账单管理：租金、水电费、账单明细、支付状态
- 仪表管理：一个房间支持多个仪表，抄表与账单联动
- 运维辅助：健康检查、数据一致性检查、部署脚本

## 关键约束
- 数据库主线固定为 PostgreSQL，不再恢复 SQLite 双轨
- 当前后台只允许受控私有部署，不允许公网匿名访问
- 仪表历史、抄表历史、账单历史优先保留，不允许用删除掩盖业务事实
- 当前 UI 视为已确认资产，只做最小必要优化

## 技术栈
- 前端：Next.js 15、React 19、TypeScript、Tailwind CSS 4
- 后端：Next.js App Router Route Handlers
- 数据层：Prisma 6、PostgreSQL
- 基础设施：Docker/Podman、Redis、Nginx（可选）

## 启动入口
### 源码实测
```bash
cp .env.example .env
npm ci
npx prisma generate
npm run lint
npm run type-check
npm run build
npm run start
```

### 容器验证
```bash
cp .env.example .env
docker compose up --build -d
docker compose exec app /app/scripts/migrate-and-seed.sh
curl "http://localhost:3001/api/health"
```

- 更短的首次启动说明见 [QUICK_START.md](file:///home/dell/Projects/Rento/QUICK_START.md)
- 环境变量含义见 [ENVIRONMENT_GUIDE.md](file:///home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md)
- 私有部署、PWA 与验收说明见 [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md)

## 文档导航
- 项目入口与约束：[AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md)
- 快速启动：[QUICK_START.md](file:///home/dell/Projects/Rento/QUICK_START.md)
- 环境变量说明：[ENVIRONMENT_GUIDE.md](file:///home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md)
- 私有部署与验收：[DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md)
- PWA 细化 runbook：[pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md)
- 结构映射：[architecture_map.md](file:///home/dell/Projects/Rento/architecture_map.md)
- 当前阶段真相源：[plan.md](file:///home/dell/Projects/Rento/plan.md)

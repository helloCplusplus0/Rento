# Tasks
- [x] Task 1: 冻结共享领域服务承接位，建立 `src/lib/domain/` 的最小目录与入口边界。
  - [x] SubTask 1.1: 基于 `docs/phase09_*` 与现有 `src/lib/*` 输入，确定 `contracts`、`billing`、`meters`、`delete-guards`、`shared` 的目录划分。
  - [x] SubTask 1.2: 创建最小共享领域服务承接位与必要的入口文件，但不迁移具体合同、账单、抄表业务逻辑。
  - [x] SubTask 1.3: 明确共享领域服务与宿主适配层的边界，避免把 Hono/Next.js 逻辑混入共享层。

- [x] Task 2: 冻结正式领域路由承接位，建立 `server/routes/*` 的 phase09 路由骨架。
  - [x] SubTask 2.1: 为 `contracts`、`bills`、`meter-readings`、`rooms`、`checkout` 预留正式路由文件或等价承接位。
  - [x] SubTask 2.2: 在 `server/app.ts` 中明确新增领域路由的挂接顺序，确保挂接发生在兜底 `requireAuth()` 之前。
  - [x] SubTask 2.3: 保持 `phase08` 既有的认证门禁、中间件链、错误出口与 `/api` 宿主边界不被破坏。

- [x] Task 3: 冻结旧 `src/app/api/*` 的 compat wrapper 边界与调用关系。
  - [x] SubTask 3.1: 列出 `phase09` 主链迁移涉及的旧 API 入口范围。
  - [x] SubTask 3.2: 为已迁接口定义“共享服务调用 / 转发 / 只读参考”三类 compat 策略。
  - [x] SubTask 3.3: 明确旧入口不得继续承载新增主链业务真相，并写清存在原因与退出条件。

- [x] Task 4: 冻结最小事务归属约定，为后续主链写路径迁移提供统一规则。
  - [x] SubTask 4.1: 结合 `src/lib/contract-activation.ts`、`src/app/api/contracts/[id]/checkout/route.ts`、`src/app/api/meter-readings/route.ts` 提炼事务边界候选。
  - [x] SubTask 4.2: 约定路由层只负责请求解析、鉴权、响应适配与调用编排，写事务由共享领域服务承接。
  - [x] SubTask 4.3: 保留 Prisma 事务、串行化隔离级别与 `P2034` 重试模式作为并发敏感写路径的默认候选。

- [x] Task 5: 完成实现校验，确认 `phase09-01` 只冻结承接位与宿主关系，不越界迁移具体业务逻辑。
  - [x] SubTask 5.1: 运行 `npm run lint`。
  - [x] SubTask 5.2: 运行 `npm run type-check`。
  - [x] SubTask 5.3: 复核 `server/app.ts`、`server/routes/*`、`src/lib/domain/*`、`src/app/api/*` 的职责边界是否符合 spec。

- [x] Task 6: 修复 checklist 复核失败项，补齐正式路由可达性、compat 边界表达与事务策略冻结。
  - [x] SubTask 6.1: 调整 `server/routes/domain.ts` 的挂接顺序，确保 `checkout` 等更窄路径不会被更宽泛路由吞掉。
  - [x] SubTask 6.2: 在旧 `src/app/api/*` 参考入口或新骨架边界中补足 compat wrapper 分类、存在原因与退出条件表达。
  - [x] SubTask 6.3: 在共享领域服务边界中明确冻结 Prisma 事务、`Serializable` 隔离级别与 `P2034` 重试为并发敏感写路径默认候选。
  - [x] SubTask 6.4: 重新运行 `npm run lint`、`npm run type-check` 并再次复核 checklist。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2, Task 3, Task 4
- Task 6 depends on Task 5

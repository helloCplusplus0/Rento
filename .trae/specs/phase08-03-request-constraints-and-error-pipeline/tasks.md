# Tasks

- [x] Task 1: 盘点旧请求治理基线与当前 Hono 宿主缺口。
  - [x] SubTask 1.1: 核对 `src/lib/api-error-handler.ts` 中可直接复用的最小请求治理语义
  - [x] SubTask 1.2: 核对 `src/middleware.ts` 中现有最小安全响应头口径
  - [x] SubTask 1.3: 核对 `src/app/api/health/route.ts`、`server/routes/health.ts` 与 `scripts/health-check.sh` 的健康状态兼容要求

- [x] Task 2: 建立 Hono 统一错误与响应基础。
  - [x] SubTask 2.1: 新建 `server/lib/api-errors.ts`，收口最小错误分类与状态码映射
  - [x] SubTask 2.2: 新建 `server/lib/api-responses.ts`，收口统一成功/错误响应辅助函数
  - [x] SubTask 2.3: 确保后续 Hono 路由可复用统一 JSON 错误出口，而不是各自拼装响应

- [x] Task 3: 建立 Hono 请求约束中间件。
  - [x] SubTask 3.1: 新建 `server/middleware/request-constraints.ts`
  - [x] SubTask 3.2: 在其中实现 CORS 预检、来源白名单、请求体大小限制与请求超时的最小承接
  - [x] SubTask 3.3: 确保约束逻辑读取 `ALLOWED_ORIGINS`、`CORS_ENABLED`、`MAX_REQUEST_SIZE`、`REQUEST_TIMEOUT`

- [x] Task 4: 建立 Hono 基础安全响应头中间件。
  - [x] SubTask 4.1: 新建 `server/middleware/security-headers.ts`
  - [x] SubTask 4.2: 至少补齐 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`
  - [x] SubTask 4.3: 确保 API 成功响应、错误响应与预检响应都不会丢失最小安全头

- [x] Task 5: 在 `server/app.ts` 串联统一治理链。
  - [x] SubTask 5.1: 将请求约束中间件接到 `/api` 宿主
  - [x] SubTask 5.2: 将安全头中间件接到 `/api` 宿主
  - [x] SubTask 5.3: 让 `app.onError()` 与统一错误辅助函数保持一致，而不是继续输出弱 JSON 兜底

- [x] Task 6: 校准 Hono 健康检查与旧脚本兼容性。
  - [x] SubTask 6.1: 调整 `server/routes/health.ts`，保留脚本依赖的 `status`
  - [x] SubTask 6.2: 确保 `status` 继续覆盖 `healthy`、`degraded`、`unhealthy`
  - [x] SubTask 6.3: 在不复制旧健康接口全部复杂度的前提下保留最小兼容字段

- [x] Task 7: 完成工程校验与脚本级验证。
  - [x] SubTask 7.1: 运行 `lint`
  - [x] SubTask 7.2: 运行 `type-check`
  - [x] SubTask 7.3: 验证 `scripts/health-check.sh` 仍可识别新宿主 `/api/health` 的健康状态
  - [x] SubTask 7.4: 确认本次实现未引入复杂限流、外部网关、APM/Tracing 或治理/辅助接口迁移

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2, Task 3, Task 4
- Task 6 depends on Task 1, Task 5
- Task 7 depends on Task 5, Task 6

# Tasks

- [x] Task 1: 盘点统一 API 宿主的当前装配现状与直接参考基线。
  - [x] SubTask 1.1: 核对 `server/app.ts`、`server/lib/env.ts`、`server/routes/health.ts` 的当前职责与缺口
  - [x] SubTask 1.2: 核对 `src/middleware.ts` 中公开页面/API 白名单与旧宿主门禁口径
  - [x] SubTask 1.3: 核对 `.env.example`、`src/lib/auth/session.ts` 中的认证与请求治理变量口径

- [x] Task 2: 冻结统一 `/api` 宿主与公开/受保护路由边界。
  - [x] SubTask 2.1: 在 spec 中明确 `server/app.ts` 是新增 API/Auth 的正式宿主入口
  - [x] SubTask 2.2: 明确最小公开 API 白名单仅包含 `/api/health`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/session`
  - [x] SubTask 2.3: 明确其他未来迁入 `server/` 的 API 默认受保护

- [x] Task 3: 冻结最小环境变量契约与主次关系。
  - [x] SubTask 3.1: 明确 `AUTH_SESSION_SECRET` 为正式主变量
  - [x] SubTask 3.2: 明确 `NEXTAUTH_SECRET` 仅为历史兼容回退
  - [x] SubTask 3.3: 明确 `ALLOWED_ORIGINS`、`CORS_ENABLED`、`MAX_REQUEST_SIZE`、`REQUEST_TIMEOUT`、`APP_INTERNAL_PORT` 的用途和边界

- [x] Task 4: 冻结 `/api/health` 在新宿主中的长期承接角色。
  - [x] SubTask 4.1: 明确 `/api/health` 继续作为唯一主健康入口
  - [x] SubTask 4.2: 明确它同时服务于新宿主可用性判断与旧脚本兼容
  - [x] SubTask 4.3: 明确本子任务不调整健康检查的完整实现细节

- [x] Task 5: 冻结旧 `src/app/api/*` 与新 `server/` 的职责边界。
  - [x] SubTask 5.1: 明确旧 `src/app/api/*` 在本阶段继续承接存量业务 API 与治理/辅助接口
  - [x] SubTask 5.2: 明确新 `server/` 是新增 API/Auth 骨架唯一正式宿主
  - [x] SubTask 5.3: 明确本子任务不迁入登录/登出具体实现，也不迁移正式业务 API

- [x] Task 6: 复核 spec 产物与 `phase08` 文档口径一致。
  - [x] SubTask 6.1: 确认 spec 不越界到 `phase08-02` 认证实现
  - [x] SubTask 6.2: 确认 spec 与 `docs/phase08_*` 的公开 API 白名单、环境变量主次关系一致
  - [x] SubTask 6.3: 确认 spec 能直接支撑后续进入实现阶段

- [x] Task 7: 修复旧宿主公开 API 白名单与新宿主矩阵漂移。
  - [x] SubTask 7.1: 为 `src/middleware.ts` 补齐 `/api/auth/session` 到公开 API 白名单
  - [x] SubTask 7.2: 为旧宿主门禁补充最小注释，明确其当前仅作为兼容门禁与 `phase08` 参考基线
  - [x] SubTask 7.3: 重新验证新旧宿主的公开 API 白名单与 `docs/phase08_*` 一致

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2
- Task 5 depends on Task 1, Task 2, Task 3
- Task 6 depends on Task 2, Task 3, Task 4, Task 5
- Task 7 depends on Task 6

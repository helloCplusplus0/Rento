# Tasks

- [x] Task 1: 盘点当前 Minix 路由壳、登录页与旧门禁基线。
  - [x] SubTask 1.1: 核对 `src/minix/router/index.tsx` 当前路由结构与公开页面边界
  - [x] SubTask 1.2: 核对 `src/minix/routes/LoginPage.tsx` 当前登录提交与回跳行为
  - [x] SubTask 1.3: 核对 `src/middleware.ts` 中旧页面/API 门禁矩阵和公开路径口径

- [x] Task 2: 建立 Minix 会话探测客户端。
  - [x] SubTask 2.1: 新建 `src/minix/lib/session-client.ts`
  - [x] SubTask 2.2: 统一封装 `GET /api/auth/session` 的请求、结果类型和失败退化语义
  - [x] SubTask 2.3: 确保登录页与页面守卫都复用该客户端，而不是重复发起散落的探测逻辑

- [x] Task 3: 建立 Minix 最小页面守卫。
  - [x] SubTask 3.1: 新建或适配 `src/minix/router/guards.ts`
  - [x] SubTask 3.2: 为主壳路径实现未登录跳转 `/login?next=...`
  - [x] SubTask 3.3: 为 `/login` 实现已登录自动回跳

- [x] Task 4: 把页面守卫接入 Minix 路由树。
  - [x] SubTask 4.1: 适配 `src/minix/router/index.tsx`
  - [x] SubTask 4.2: 保持 `/login`、`/offline`、错误页等公开路径可访问
  - [x] SubTask 4.3: 不迁移正式业务页面逻辑，只给现有主壳和占位页加最小门禁

- [x] Task 5: 适配 Minix 登录页与真实认证 API。
  - [x] SubTask 5.1: 让 `src/minix/routes/LoginPage.tsx` 继续调用新宿主 `POST /api/auth/login`
  - [x] SubTask 5.2: 登录成功后按 `next` 或首页回跳
  - [x] SubTask 5.3: 登录页初始化时消费会话探测结果，已登录则自动回跳

- [x] Task 6: 写清旧宿主与新壳门禁的并行边界。
  - [x] SubTask 6.1: 在实现层或最小文档承接位中写明旧 `src/middleware.ts` 继续负责旧 `Next.js` 页面/API 运行线
  - [x] SubTask 6.2: 写明新 `src/minix` 页面守卫只负责新前端壳路径
  - [x] SubTask 6.3: 形成可验证的并行边界清单，不让两条门禁链再次争夺默认入口

- [x] Task 7: 完成工程校验与门禁一致性验证。
  - [x] SubTask 7.1: 运行 `lint`
  - [x] SubTask 7.2: 运行 `type-check`
  - [x] SubTask 7.3: 验证未登录访问主壳会跳到 `/login?next=...`
  - [x] SubTask 7.4: 验证已登录访问 `/login` 会自动回跳
  - [x] SubTask 7.5: 验证页面门禁与 API 门禁继续保持一致

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 2, Task 4
- Task 6 depends on Task 1, Task 4, Task 5
- Task 7 depends on Task 4, Task 5, Task 6

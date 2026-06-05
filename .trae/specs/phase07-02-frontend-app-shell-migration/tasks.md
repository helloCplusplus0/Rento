# Tasks

- [x] Task 1: 盘点 `phase07-02` 的前端壳承接基线。
  - [x] SubTask 1.1: 核对当前 `src/minix/` 的占位壳、路由骨架与 `phase07-01` 已冻结边界
  - [x] SubTask 1.2: 盘点旧 `AppLayout`、`UnifiedNavigation`、路由元数据与页面治理口径中可直接复用或需适配的部分
  - [x] SubTask 1.3: 明确本子任务只承接前端壳、导航和基础页面位，不迁移全量业务逻辑、完整查询写操作与完整认证链

- [x] Task 2: 在 `src/minix/` 中建立统一布局与导航壳。
  - [x] SubTask 2.1: 迁移或适配 `AppLayout` 到新前端壳结构
  - [x] SubTask 2.2: 迁移或适配 `UnifiedNavigation`，把 `next/link` 与 `next/navigation` 依赖替换为 `React Router` 承接方式
  - [x] SubTask 2.3: 保留现有 UI 风格、图标语义与桌面/移动端导航表达，不重做视觉体系

- [x] Task 3: 建立 `React Router` 的正式页面承接位。
  - [x] SubTask 3.1: 为 `/`、`/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 建立正式页面壳
  - [x] SubTask 3.2: 补齐 `login`、`offline`、`404`、`error`、`loading` 的基础承接位
  - [x] SubTask 3.3: 让路由骨架明确区分壳层承接与后续业务逻辑迁移边界

- [x] Task 4: 复用并收口前端共享资产。
  - [x] SubTask 4.1: 复用现有样式、图标与信息架构，不另起第二套壳层设计
  - [x] SubTask 4.2: 对齐现有 `route-config`、导航元数据与页面治理口径到新前端宿主
  - [x] SubTask 4.3: 明确哪些共享资产仍保留在旧实现目录，哪些已由 `src/minix/` 正式承接

- [x] Task 5: 验证新前端壳已具备统一宿主能力。
  - [x] SubTask 5.1: 校验统一布局、导航和主要路径在 `React Router` 中均可访问
  - [x] SubTask 5.2: 校验现有 UI 展示风格、图标与信息架构未被重写
  - [x] SubTask 5.3: 运行本阶段所需最小校验，如 `npm run type-check`、`npm run lint`、必要的构建或路由访问验证

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2, Task 3
- Task 5 depends on Task 2, Task 3, Task 4

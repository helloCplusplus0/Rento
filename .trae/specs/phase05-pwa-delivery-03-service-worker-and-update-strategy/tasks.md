# Tasks

- [x] Task 1: 审计并收口 `service worker` 主边界
  - [x] SubTask 1.1: 审核 `phase05_pwa_delivery_architecture_plan.md`、`phase05_pwa_delivery_dev_plan.md`、`phase05_pwa_delivery_shared_baseline.md` 中与 SW、缓存边界、更新策略相关的口径是否一致
  - [x] SubTask 1.2: 盘点当前仓库中已有 `sw.js`、`workbox`、PWA 注册逻辑、离线页入口与相关 Next.js 配置的现状、职责与历史残留
    - 已确认 `public/sw.js` 是 `phase05-03` 的显式真相源，不能继续被 `.gitignore` 忽略；已移除忽略规则，确保后续可纳入版本控制
  - [x] SubTask 1.3: 明确本子任务只收口 SW、最小缓存、更新提示与调试说明，不提前进入完整离线业务、业务接口缓存或推送能力

- [x] Task 2: 冻结 SW 注册条件与启用环境
  - [x] SubTask 2.1: 明确本地开发环境默认禁用 SW 注册，不把 PWA 缓存行为作为日常开发前提
  - [x] SubTask 2.2: 明确受控测试环境与私有部署生产环境的 SW 启用条件
    - 已补齐 `middleware` 白名单，确保 `public/sw.js` 与 `manifest.json` 在受控生产形态下不会被登录重定向拦截
  - [x] SubTask 2.3: 明确 SW 注册失败、浏览器不支持或用户手动禁用时的退化路径

- [x] Task 3: 冻结最小缓存边界与离线兜底口径
  - [x] SubTask 3.1: 明确允许缓存的边界仅限应用壳静态资源、`manifest`、图标与最小离线兜底资源
  - [x] SubTask 3.2: 明确动态业务接口、鉴权态业务页面响应与其他动态数据不得进入默认缓存
  - [x] SubTask 3.3: 明确离线时只提供最小兜底页，不伪装为完整离线业务

- [x] Task 4: 冻结更新策略、版本切换提示与回滚说明
  - [x] SubTask 4.1: 明确新版本发现、提示展示、刷新生效与旧版本失效的统一口径
  - [x] SubTask 4.2: 明确更新失败、缓存异常或版本脏读时的最小回滚方式
  - [x] SubTask 4.3: 明确最小调试说明，帮助区分本地开发、受控测试与生产环境中的 SW 行为

- [x] Task 5: 完成文档级验收
  - [x] SubTask 5.1: 检查 `phase05-03` 的 spec 是否可直接作为实现与后续验收的上游输入
  - [x] SubTask 5.2: 检查 `phase05` 三份阶段文档与本子任务 spec 是否不存在越界到完整离线、推送或业务接口缓存的冲突
  - [x] SubTask 5.3: 完成本子任务 `spec.md`、`tasks.md`、`checklist.md` 的收口

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 1, Task 2, Task 3, Task 4

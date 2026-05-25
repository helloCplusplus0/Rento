# Tasks

- [x] Task 1: 审计并收口安装壳与 manifest 主语义
  - [x] SubTask 1.1: 审核 `phase05_pwa_delivery_architecture_plan.md`、`phase05_pwa_delivery_dev_plan.md`、`phase05_pwa_delivery_shared_baseline.md` 中与安装壳、manifest、图标、启动体验相关的边界是否一致
  - [x] SubTask 1.2: 盘点当前 `public/manifest.json`、`src/app/layout.tsx`、`public/icons/*` 与相关安装资源的现状、职责与缺口
  - [x] SubTask 1.3: 明确本子任务只收口安装壳和安装语义，不提前进入 SW 缓存、复杂离线或推送能力

- [x] Task 2: 冻结 manifest、图标与启动体验口径
  - [x] SubTask 2.1: 明确应用名称、短名称、图标、maskable icon、主题色、显示模式与启动入口的统一真相源
  - [x] SubTask 2.2: 明确 `manifest` 与 `layout.tsx` metadata 的职责边界，避免重复定义或口径漂移
  - [x] SubTask 2.3: 明确安装前后产品形态保持一致的验收口径

- [x] Task 3: 冻结安装态识别与最小安装引导边界
  - [x] SubTask 3.1: 明确安装态、浏览器态与未支持态的差异只允许落在最小壳层与引导层
  - [x] SubTask 3.2: 明确正式支持浏览器中的最小安装提示或安装引导边界
  - [x] SubTask 3.3: 明确不支持安装时的降级说明，不阻断普通 Web 主链使用

- [x] Task 4: 冻结最小离线壳资源入口与后续承接边界
  - [x] SubTask 4.1: 明确最小离线页壳资源入口只作为 `phase05-pwa-delivery-03` 的承接位
  - [x] SubTask 4.2: 明确当前阶段不实现复杂缓存策略、动态接口缓存或完整离线业务
  - [x] SubTask 4.3: 明确后续 SW 子任务如何复用本子任务的壳层成果

- [x] Task 5: 完成文档级验收
  - [x] SubTask 5.1: 检查 `phase05-02` 的 spec 是否可直接作为实现与后续验收的上游输入
  - [x] SubTask 5.2: 检查 `phase05` 三份阶段文档与本子任务 spec 是否不存在越界到 SW 或复杂离线的冲突
  - [x] SubTask 5.3: 完成本子任务 `spec.md`、`tasks.md`、`checklist.md` 的收口

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 1, Task 2, Task 3, Task 4

# Tasks
- [x] Task 1: 建立全局 mutation 影响矩阵
  - [x] SubTask 1.1: 审计 `src/app/api/**/*` 中所有会改变主链展示结果的写操作入口
  - [x] SubTask 1.2: 为合同、账单、房间、租客、仪表、设置等 mutation 定义统一受影响页面集合
  - [x] SubTask 1.3: 明确哪些页面需要 `revalidatePath`，哪些成功链路还需要客户端刷新

- [x] Task 2: 实现统一的服务端路径失效收口
  - [x] SubTask 2.1: 在关键 Route Handler 中接入统一的路径失效机制
  - [x] SubTask 2.2: 首先覆盖 fix_009 已确认的主链：合同创建、退租、续租、激活、账单变更
  - [x] SubTask 2.3: 补齐工作台、房源、合同、账单、租客等关联页面的失效路径

- [x] Task 3: 收口客户端成功跳转与预取策略
  - [x] SubTask 3.1: 审计创建、退租、续租、账单编辑等成功跳转页
  - [x] SubTask 3.2: 对必要入口补充 `router.refresh()` 或等效刷新策略
  - [x] SubTask 3.3: 对高频写后返回的关键列表页评估并调整 `prefetch`

- [x] Task 4: 验证普通 Web 与 PWA 一致性
  - [x] SubTask 4.1: 设计覆盖合同创建、退租、账单状态变更的生产模式回归路径
  - [x] SubTask 4.2: 分别验证普通 Web 与已安装 PWA 的表现一致
  - [x] SubTask 4.3: 执行 `npm run lint` 与 `npm run type-check`

## Audit Notes
- 2026-05-26: 复核关键 mutation 失效覆盖时，补齐了 `POST /api/meter-readings` 的统一路径失效，避免在未自动生成账单或账单生成部分失败时遗漏 `/contracts`、`/rooms`、`/bills`、`/meter-readings/*` 相关页面刷新。
- 2026-05-26: 普通 Web 入口已由自动化浏览器完成真实退租链路回归；已安装 PWA 入口由用户按最小回归路径人工验证通过，确认写后返回列表/工作台无需手动刷新即可看到最新结果。

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2]
- [Task 4] depends on [Task 3]

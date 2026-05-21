# Tasks

- [x] Task 1: 冻结 `phase04-02` 的性能热点与收口范围
  - [x] SubTask 1.1: 盘点关键列表接口与统计接口的查询路径，确认高优先级热点
  - [x] SubTask 1.2: 明确哪些查询可直接复用 `optimized-queries.ts`，哪些需要在现有接口内做最小收口
  - [x] SubTask 1.3: 确认 `phase04-02` 只处理数据库侧过滤、分页、排序、聚合和最小验证，不扩写缓存或新基础设施

- [x] Task 2: 收口关键列表接口的旧查询路径
  - [x] SubTask 2.1: 优先收口 `/api/bills` 的全量查询后内存过滤和分页问题
  - [x] SubTask 2.2: 优先收口 `/api/contracts` 的全量查询后内存搜索问题
  - [x] SubTask 2.3: 审视 `/api/rooms?includeMeters=true` 的全量房间 + 逐房查仪表问题，收口明显的 N+1 路径
  - [x] SubTask 2.4: 审视 `/api/renters` 无筛选分支的全量返回路径，收口为更清晰的数据库侧执行路径

- [x] Task 3: 收口必要的统计查询与性能验证路径
  - [x] SubTask 3.1: 审视 `queries.ts`、`optimized-queries.ts`、必要时 `dashboard-queries.ts` 中仍明显依赖全量读数后内存聚合的点
  - [x] SubTask 3.2: 保留或调整最小性能验证路径，证明关键接口至少不再继续沿用明显低效的旧实现
  - [x] SubTask 3.3: 确认验证方式服务于关键接口，不扩写成重型压测平台

- [x] Task 4: 完成实现级验收
  - [x] SubTask 4.1: 执行 `npm run lint`
  - [x] SubTask 4.2: 执行 `npm run type-check`
  - [x] SubTask 4.3: 执行至少一条性能或查询行为验证路径
  - [x] SubTask 4.4: 回写 `tasks.md` 与 `checklist.md`，收口本子任务验收结果

- [x] Task 5: 修复正式性能验证路径并重新验收
  - [x] SubTask 5.1: 修复 `scripts/benchmark.js` 的运行时错误与环境加载边界问题
  - [x] SubTask 5.2: 重新执行仓库内正式性能验证路径并记录结果
  - [x] SubTask 5.3: 复核 `phase04-02` checklist 中未通过项并完成最终收口

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 3, Task 4

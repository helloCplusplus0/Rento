# Tasks

- [x] 任务 1：确认 `phase10-03` 的查询收口范围与现状输入
  - [x] 子任务 1.1：复核 `dev_plan`、`architecture_plan`、`shared_baseline` 与 `phase10-01 inventory` 中关于查询分层的已有结论
  - [x] 子任务 1.2：核对 `queries.ts`、`optimized-queries.ts`、`dashboard-queries.ts`、`search-queries.ts`、`global-settings.ts`、`health-checker.ts` 的当前职责
  - [x] 子任务 1.3：核对 `phase09-06` route inventory 中 `keep-compat` 与 `defer-unmigrated` 的读接口依赖

- [x] 任务 2：冻结核心读取场景的 canonical read path
  - [x] 子任务 2.1：为合同列表 / 详情冻结 canonical read path
  - [x] 子任务 2.2：为账单列表 / 详情 / 明细冻结 canonical read path
  - [x] 子任务 2.3：为房间列表 / 详情冻结 canonical read path
  - [x] 子任务 2.4：为抄表列表 / 详情 / related bills 冻结 canonical read path
  - [x] 子任务 2.5：为 dashboard 统计冻结 canonical read path

- [x] 任务 3：收口 compat 查询与治理查询的长期定位
  - [x] 子任务 3.1：明确 `queries.ts` 中哪些能力仍保留为 compat 查询，哪些职责应继续退出写路径
  - [x] 子任务 3.2：明确 `optimized-queries.ts` 中哪些能力属于正式读取模型候选位，哪些仍只是兼容优化实现
  - [x] 子任务 3.3：明确 `dashboard-queries.ts`、`search-queries.ts` 的治理 / 辅助身份
  - [x] 子任务 3.4：明确 `global-settings.ts`、`health-checker.ts` 是否属于治理 / 脚本查询承接位

- [x] 任务 4：建立 route inventory 到查询层收口顺序的映射
  - [x] 子任务 4.1：把 `keep-compat` bucket 映射到 compat 查询收口顺序
  - [x] 子任务 4.2：把 `defer-unmigrated` bucket 映射到 canonical read path 优先级
  - [x] 子任务 4.3：确认查询分类与 `src/app/api/*` 当前依赖关系不冲突

- [x] 任务 5：补充验证并收口 `phase10-03` 输出
  - [x] 子任务 5.1：核对 route inventory 中 `keep-compat` 与 `defer-unmigrated` 项的查询依赖均已被分类
  - [x] 子任务 5.2：核对文档表述与现有查询文件职责不冲突
  - [x] 子任务 5.3：确认本子任务未越界到 legacy 查询删除、dashboard 宿主迁移或最终部署切线

- [x] 任务 6：修正 canonical read path 过度收口与 bucket 映射失真
  - [x] 子任务 6.1：修正 `closure.md` 中合同列表、账单列表、房间列表的 canonical read path 表述，使其与当前 SSR 页面、API 列表与 includeMeters 分支真实路径一致
  - [x] 子任务 6.2：修正 `global-settings.ts` 在 `keep-compat` bucket 中的错误映射，改为与 `legacy-route-inventory.ts` 一致的 `defer-unmigrated / governance` 归类
  - [x] 子任务 6.3：重新执行独立子代理验收，确认 canonical read path、bucket 映射与现有实现不再冲突

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1、任务 2
- 任务 4 依赖任务 1、任务 3
- 任务 5 依赖任务 2、任务 3、任务 4
- 任务 6 依赖任务 5

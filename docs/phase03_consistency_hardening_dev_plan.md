# Phase03 Consistency Hardening 开发规划

## 一、文档定位

本文档用于把 `phase03-consistency-hardening-*` 拆分为顺序执行的子任务，确保后续开发继续遵循：

- 真实租务流程优先
- 事实表达优先于最简关系
- 业务真实优先
- 服务端门禁优先
- 状态可解释优先
- 历史事实优先保留
- 历史可追溯优先
- 账务语义稳定优先
- 低复杂度优先

本文档不替代：

- [phase03_consistency_hardening_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase03_consistency_hardening_architecture_plan.md) 的阶段定位职责
- [phase03_consistency_hardening_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase03_consistency_hardening_shared_baseline.md) 的共享边界职责
- 具体 `.trae/specs/phase03-consistency-hardening-*` 的任务冻结与验收职责

## 二、总体推进结论

`phase03-consistency-hardening-*` 的执行顺序固定为：

```text
先冻结共享边界
    ->
再收紧删除门禁与历史保留
    ->
再收口账务查询与统计语义
    ->
最后写清迁移兼容与退出路径
```

原因如下：

- 若不先冻结共享边界，后续 `/spec` 很容易把“允许停用/归档”和“允许物理删除”混写
- 若不先收紧删除门禁，后续语义修复和统计修复仍会建立在错误行为之上
- 若不最后单独处理迁移兼容，极易把 schema 风险与业务改造混成一次高风险改动

## 三、任务拆分建议

## phase03-consistency-hardening-01-boundary-and-shared-baseline-freeze

### 目标

冻结 `phase03` 的共享边界、允许/禁止路线、共享判断标准与子任务顺序。

### 范围

- 同步顶层文档中的 `phase03` 当前下一步说明
- 生成并收口 `shared_baseline`
- 明确 `phase03` 的四个子任务顺序
- 明确哪些 schema 风险点只做记录，哪些应用层行为要优先收紧
- 允许同步收口“真实租务流程优先、事实表达优先于最简关系、业务真实 / 状态可解释 / 历史可追溯 / 实现低复杂度”这些后续评审判断标准

### 不在范围内

- 不直接修改服务端删除逻辑
- 不直接修复 dashboard 语义
- 不直接改动迁移锁或部署脚本

### DoD

- `phase03` 的共享边界已冻结
- 后续 `/spec` 可以直接引用 `shared_baseline`
- `phase03` 不再需要重新讨论“本阶段是否允许物理删除历史事实”
- 后续子任务对真实租务流程、事实表达、状态解释、历史追溯和实现复杂度的判断口径不再分叉

## phase03-consistency-hardening-02-delete-guard-and-history-preservation

### 目标

把房间、合同、账单、仪表主链中的高风险删除默认路径，从“物理删除”改为“拦截 / 停用 / 终止 / 归档 / 解绑”优先。

### 范围

- 收紧 `validation.ts` 的房间与合同删除检查
- 收紧 `queries.ts` 中的默认删除路径
- 修正房间、合同、账单、仪表详情 API 的删除行为
- 明确无法删除时返回的业务错误与替代动作

### 重点文件

- `src/lib/validation.ts`
- `src/lib/queries.ts`
- `src/app/api/rooms/[id]/route.ts`
- `src/app/api/contracts/[id]/route.ts`
- `src/app/api/meters/[meterId]/route.ts`
- `src/app/api/bills/[id]/route.ts`

### 不在范围内

- 不做 UI 提示样式改造
- 不做房间列表或合同列表的性能优化
- 不重写数据库关系

### DoD

- 高风险删除默认被拦截或转为非物理删除动作
- 历史 `Bill`、`BillDetail`、`MeterReading` 不再因清理当前业务关系而被默认清空
- 至少补一条覆盖账单/合同/仪表主链的可执行验证路径

## phase03-consistency-hardening-03-billing-query-and-dashboard-semantic-closure

### 目标

修复字段漂移，并收口账务金额、待收金额、状态流转和仪表盘统计的统一语义。

### 范围

- 修复 `optimized-queries.ts` 中与 schema 不一致的字段引用
- 收口 `dashboard-queries.ts` 的待收、趋势和状态口径
- 必要时补强账单详情或账单状态 API 的服务端语义
- 保证 `pendingAmount`、`receivedAmount` 与 `BillStatus` 的组合行为可解释

### 重点文件

- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/queries.ts`
- 必要时 `src/app/api/bills/[id]/status/route.ts`
- 必要时 `src/app/api/dashboard/stats/route.ts`

### 不在范围内

- 不处理 `rooms`、`contracts` 的性能优化
- 不扩展支出账单体系
- 不引入新的统计维度或新页面

### DoD

- 不再引用 `monthlyRent` / `idNumber` 等不存在字段
- `PENDING / PAID / OVERDUE / COMPLETED` 的统计口径可解释且一致
- 待收金额与趋势统计不再混合模糊语义

## phase03-consistency-hardening-04-migration-compatibility-exit-plan

### 目标

把 PostgreSQL 主线与 SQLite 历史兼容的关系写清楚，并形成正式退出条件。

### 范围

- 审视 `migration_lock.toml` 当前状态
- 审视 `migrate-and-seed.sh` 中的兼容分支
- 在文档中标注兼容项、当前作用与退出条件
- 决定本阶段是否只记录方案，还是补最小注释与说明收口

### 重点文件

- `prisma/migrations/migration_lock.toml`
- `scripts/migrate-and-seed.sh`
- `architecture_map.md`
- 必要时 `README.md`
- 必要时 `DEPLOYMENT.md`
- 必要时 `ENVIRONMENT_GUIDE.md`

### 不在范围内

- 不直接重建全部迁移基线
- 不在无充分验证时切掉 `db push` 兼容分支
- 不把迁移整改与业务规则修复混做成单一大改动

### DoD

- 兼容项的存在原因、当前作用、退出条件全部显式化
- 文档和脚本对迁移状态口径一致
- 后续若进入专项迁移整改，可直接以本子任务结论为上游输入

## 四、推荐实施顺序

建议严格按如下顺序推进：

```text
phase03-consistency-hardening-01-boundary-and-shared-baseline-freeze
phase03-consistency-hardening-02-delete-guard-and-history-preservation
phase03-consistency-hardening-03-billing-query-and-dashboard-semantic-closure
phase03-consistency-hardening-04-migration-compatibility-exit-plan
```

## 五、默认路线约束

`phase03-consistency-hardening-*` 的全部子任务都必须遵守：

- 默认优先贴合真实租务流程，而不是回退到理想化 CRUD
- 默认优先保持可追溯的事实表达，而不是为了最简关系压扁业务语义
- 默认优先收紧服务端门禁，不依赖前端按钮状态
- 默认要求状态流转可解释、可映射回合同链和账务链
- 默认优先保留历史事实，不用级联删除清理业务现场
- 默认不混入 `phase04` 的性能优化
- 默认不扩展 UI 视觉范围
- 默认由用户手动启动本地 dev server，AI 不主动后台运行 `npm run dev`

## 六、结语

`phase03` 的价值不在于“再做一轮大清理”，而在于：

```text
把当前已经发现的高风险主链漂移，
先冻结边界，
再按顺序逐个收回到可解释、可验证、可持续维护的服务端真相源。
```

# Fix 003 抄表换表主链收口 Spec

## Why

真实场景验证表明，当前“停用旧表 + 新增新表”的换表路径下，抄表提交会误报“今日已存在该仪表抄表记录”，并导致聚合水电账单缺少应纳入的电表项目。根因不只是一个校验条件写错，而是抄表记录类型、重复门禁、仪表移除语义与历史删除入口同时存在双重真相，需要先冻结共享边界，再进入实现。

## What Changes

- 为 `MeterReading` 引入结构化记录类型，明确区分合同初始底数、正常抄表和退租最终抄表
- 收口抄表重复校验为“同一仪表 + 同一业务日期 + 正式抄表类型”的精确门禁
- 收口批量抄表页的可录入仪表集合，只展示激活中的仪表，并与合同详情页抄表弹窗保持一致
- 收口批量抄表页“提交抄表”按钮状态逻辑，避免 DOM 直改和 React 状态流并存
- 调整抄表历史页与删除能力口径，消除“页面可删、查询层禁删”的伪能力
- 修正房间仪表管理的“移除”语义与文案，使其准确反映当前真实行为
- 补充面向历史数据的审计与安全边界，冻结当前数据库边界为“应用层精确门禁 + 历史重复审计”，避免直接自动清洗已有抄表与计费事实

## Impact

- Affected specs:
  - `fix_003`
  - 多仪表抄表主链
  - 仪表换表路径
  - 抄表历史与删除门禁
- Affected code:
  - `prisma/schema.prisma`
  - `src/app/api/meter-readings/route.ts`
  - `src/app/api/meter-readings/[id]/route.ts`
  - `src/app/api/contracts/route.ts`
  - `src/app/api/contracts/[id]/checkout/route.ts`
  - `src/components/business/SingleMeterReadingModal.tsx`
  - `src/components/pages/BatchMeterReadingPage.tsx`
  - `src/components/business/dashboard-home.tsx`
  - `src/components/pages/MeterReadingHistoryPage.tsx`
  - `src/components/business/RoomMeterManagement.tsx`
  - `src/app/api/meters/[meterId]/route.ts`
  - `src/lib/queries.ts`

## ADDED Requirements

### Requirement: 抄表记录必须具备结构化类型

系统 SHALL 为每条 `MeterReading` 记录保存明确的业务类型，而不是继续依赖 `remarks` 文本猜测“这是底数还是正式抄表”。

#### Scenario: 合同创建写入初始底数

- **WHEN** 用户创建合同并录入房间仪表初始读数
- **THEN** 系统写入的抄表记录类型必须为 `INITIAL_BASELINE`
- **AND** 该记录不会被当作正式抄表参与同日重复门禁

#### Scenario: 正常抄表录入

- **WHEN** 用户在合同详情页或批量抄表页提交仪表读数
- **THEN** 系统写入的抄表记录类型必须为 `REGULAR_READING`
- **AND** 只有该类型受“同一仪表同一业务日期不可重复提交”约束

#### Scenario: 退租最终抄表

- **WHEN** 用户执行退租并提交最终仪表读数
- **THEN** 系统写入的抄表记录类型必须为 `CHECKOUT_FINAL`
- **AND** 该记录不会被误判为普通日常抄表的重复

### Requirement: 抄表重复校验必须基于业务日期与仪表精确判断

系统 SHALL 基于提交的 `readingDate`、`meterId` 和正式抄表类型执行重复校验，不得继续使用服务器当前日期或全局分页结果替代。

#### Scenario: 换表后继续抄表

- **WHEN** 用户停用旧表、为同一房间新增新表，并在之后继续执行正式抄表
- **THEN** 新表的抄表提交不会被旧表或其他非正式读数误判为重复
- **AND** 所有有效仪表读数都会进入本次聚合账单

#### Scenario: 合同创建当天首次正式抄表

- **WHEN** 合同创建当天已经写入 `INITIAL_BASELINE`，随后同日提交一次 `REGULAR_READING`
- **THEN** 系统不得因为初始底数记录阻止正式抄表

### Requirement: 批量抄表页必须只展示激活中的仪表

系统 SHALL 让批量抄表页与合同详情页抄表弹窗遵守同一套激活仪表过滤语义，禁用仪表不得继续参与批量录入与计费。

#### Scenario: A101 的禁用冷水表

- **WHEN** `A101` 房间存在 `5` 个仪表，其中 `冷水1` 已被禁用
- **THEN** 合同详情页抄表弹窗与批量抄表页都只展示 `4` 个激活仪表
- **AND** 禁用的 `冷水1` 不会再出现在批量抄表录入列表中

### Requirement: 批量抄表提交按钮必须由声明式状态驱动

系统 SHALL 仅使用 React 状态流控制批量抄表页“提交抄表”按钮的启用、禁用和展示文本，不得再通过 DOM 直改改变按钮状态。

#### Scenario: 按钮状态切换

- **WHEN** 页面无任何有效输入
- **THEN** “提交抄表”按钮处于禁用状态
- **WHEN** 用户录入至少一条有效读数且不存在校验错误
- **THEN** “提交抄表”按钮变为可点击
- **WHEN** 页面出现任一校验错误
- **THEN** “提交抄表”按钮重新禁用

### Requirement: 抄表历史页必须按结构化类型展示

系统 SHALL 使用结构化 `recordType` 展示与筛选抄表历史，而不是继续依赖 `usage=0` 或备注关键字猜测记录类型。

#### Scenario: 历史页区分底数与正式抄表

- **WHEN** 用户打开抄表历史页
- **THEN** 系统能够稳定区分 `INITIAL_BASELINE`、`REGULAR_READING` 和 `CHECKOUT_FINAL`
- **AND** 不会因为备注文案变化导致记录误分类

### Requirement: 抄表删除入口与服务端门禁必须一致

系统 SHALL 保证抄表历史页的删除入口与查询层、API 的真实删除策略一致，禁止继续暴露不可执行的伪能力。

#### Scenario: 当前阶段不允许删除抄表历史

- **WHEN** 当前 fix 冻结的策略是不允许物理删除抄表历史
- **THEN** 页面不应继续展示可执行删除按钮
- **AND** 服务端不应对外表现为“允许删除但实际失败”

#### Scenario: 当前阶段允许有限删除

- **WHEN** 当前 fix 选择允许删除未出账的正式抄表记录
- **THEN** 页面、API 与查询层必须统一约束为同一套删除门禁
- **AND** 已出账或非正式抄表类型的历史记录不得被误删

## MODIFIED Requirements

### Requirement: 仪表移除的默认语义

当前系统中的“移除仪表”能力必须准确表达为“根据历史事实决定停用保留或硬删除”，不得继续在页面文案中把当前行为表述成真实解绑。

#### Scenario: 仪表已存在历史读数或账单关联

- **WHEN** 用户在房间详情页点击“移除仪表”
- **THEN** 系统应明确提示当前真实行为是“停用并保留历史”
- **AND** 不得让用户误以为历史绑定关系已经被结构化解绑

### Requirement: 聚合抄表账单的有效输入集合

聚合水电账单必须只基于本次提交中通过校验的正式抄表记录生成，且换表场景下不得因为误告警遗漏本应纳入的电表项目。

#### Scenario: 多仪表同次提交

- **WHEN** 用户在同一次抄表提交中录入多个有效仪表读数
- **THEN** 所有未命中真实重复门禁的 `REGULAR_READING` 都必须进入账单聚合
- **AND** 聚合结果不得遗漏任一有效电表或水表项目

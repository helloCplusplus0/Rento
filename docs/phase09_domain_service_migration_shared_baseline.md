# Phase09 Domain Service Migration Shared Baseline

## 一、文档目的
本文档用于冻结 `phase09-domain-service-migration` 全部子任务共享的边界、允许路线、禁止路线与统一判断标准，避免后续 `phase09` 子任务各自扩写出不同解释。

## 二、共享前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成当前轮文档治理收口
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口、旧运行线映射与退出条件冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、认证门禁、中间件链、错误处理、公开 API 白名单、环境变量“新主旧兼”口径与最小页面守卫收口
- 当前完整 `Hono` 版 Phase 路线图已冻结到根级 `plan.md`
- 当前仓库逻辑主线已切换为 `Rento-miniX`
- 当前旧实现代码仍是后续原地重构的直接参考基线

## 三、共享判断标准
- 默认优先冻结共享领域服务与正式宿主边界，而不是先迁完整页面或部署切线
- 默认优先保持合同锚点、账单语义、多仪表历史保留与删除门禁一致，而不是先追求接口数量迁移
- 默认优先保持页面预期、服务端生成结果与数据库事实一致，而不是先做 UI 改写
- 默认优先低复杂度、单仓库、单主线、单一真相源
- 默认优先把 `server/` 作为正式领域 API 宿主固定下来，再进入后续数据访问层与部署主线阶段
- 默认继续把 `Prisma + PostgreSQL` 主线保住，不在本阶段引入 ORM 再决策

## 四、允许路线
- 允许继续在 `server/` 中承接正式领域 API 路由外壳
- 允许在共享领域服务层承接并适配：
  - `src/lib/queries.ts`
  - `src/lib/validation.ts`
  - `src/lib/auto-bill-generator.ts`
  - `src/lib/checkout-settlement.ts`
  - `src/lib/bill-semantics.ts`
  - `src/lib/contract-activation.ts`
- 允许迁入主链领域服务：
  - 合同生命周期
  - 账单金额/状态语义
  - 支付周期账单生成
  - 仪表与抄表链路
  - 退租结算
  - 删除门禁
- 允许继续用 `GET /api/health` 作为唯一主健康入口
- 允许在文档中写清旧 `Next.js` 宿主的兼容保留边界与退出条件

## 五、禁止路线
- 禁止在 `phase09` 中直接迁移治理/辅助接口，例如 `validation`、`data-consistency`、细分健康检查等旧宿主辅助入口
- 禁止在 `phase09` 中切换最终部署主线
- 禁止在 `phase09` 中切换 ORM 或重写数据模型
- 禁止以“领域迁移”为由放宽历史数据保留、删除门禁或抄表禁删规则
- 禁止让 `src/minix` 在本阶段扩写为完整领域页面迁移承载层
- 禁止让 `server/` 与旧 `src/app/api/*` 同时继续争夺新增主链业务真相默认宿主职责

## 六、统一方案语义
- 新正式领域 API 宿主固定为：`server/`
- 新服务端运行时固定为：`Hono + @hono/node-server`
- 共享领域服务落点固定为：`src/lib/domain/` 或等价共享目录
- 当前认证与请求治理继续固定为 `phase08` 已冻结口径
- 当前前端门禁继续固定为：`src/minix` 最小登录守卫
- 当前数据访问主线继续固定为：`Prisma + PostgreSQL`

## 七、主链业务语义冻结
### 7.1 合同锚点
- `Contract` 是租务事实主锚点
- 账单、续租、退租、抄表、房态变化优先围绕合同表达
- 已生效、已到期、已终止合同默认优先保留为历史事实

### 7.2 账单语义
- `Bill.amount`：应收总额
- `Bill.receivedAmount`：已确认收款金额
- `Bill.pendingAmount`：仍待收的剩余金额
- `BillStatus` 继续按以下语义解释：
  - `PENDING / OVERDUE`：开放态
  - `PAID / COMPLETED`：结清态
- 部分收款继续通过金额字段表达，不额外引入新的状态枚举

### 7.3 支付周期与自动出账
- 押金、钥匙押金、卫生费、租金周期账单继续沿用既有生成语义
- 支付周期账单继续围绕合同期限、支付周期与签约事实生成
- 不允许为了“轻量迁移”把周期账单简化成一次性租金

### 7.4 仪表与抄表
- `Meter` 继续视为独立资产
- `MeterReading` 继续区分：
  - `INITIAL_BASELINE`
  - `REGULAR_READING`
  - `CHECKOUT_FINAL`
- 多仪表计费继续以 `BillDetail + MeterReading` 为正式追溯链
- `Bill.meterReadingId` 只保留为兼容字段，不回退为单仪表主真相

### 7.5 删除与历史保留
- 房间、合同、账单、抄表默认继续优先受门禁保护
- 业务上优先使用：
  - 拦截
  - 终止
  - 归档
  - 停用
  - 解绑
- 禁止把 schema 里的 `Cascade` 关系误读成“允许直接物理删除”

### 7.6 退租结算
- 退租结算继续以“账单、押金、欠费、最终抄表”联动为主
- 不拆成互不一致的局部流程
- 结算结果必须继续可追溯、可解释、可与账单状态语义一致消费

## 八、服务端承接口径
- `phase09` 服务端只承接：
  - 正式领域 API 路由外壳
  - 共享领域服务的正式消费入口
  - 主链读写编排与事务边界收口
  - 主链删除门禁与历史保留规则的正式执行入口
- `phase09` 服务端不承接：
  - 治理/辅助接口迁移
  - 最终生产部署切线
  - ORM 最终定案
  - 迁移链兼容项退出方案

## 九、前端承接口径
- `phase09` 前端只承接：
  - 现有页面预期继续作为验收输入
  - 新旧主链结果一致性验证
- `phase09` 前端不承接：
  - 完整领域页面迁移
  - 角色扩展框架
  - 页面数据加载全面切换
  - UI 设计语言重做

## 十、旧运行线映射口径
- `src/app` 与 `src/app/api/*` 在 `phase09` 期间仍是参考基线和存量运行线
- `src/app/api/*` 在 `phase09` 期间继续承担：
  - 未迁移接口
  - 治理/辅助接口
  - 已迁接口的兼容包装或只读参考实现
- `src/app/api/*` 在 `phase09` 期间不再默认承担：
  - 新增正式领域 API
  - 新增主链业务真相
- `src/middleware.ts` 在 `phase09` 期间继续服务于旧页面与旧 API 门禁
- `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs` 在 `phase09` 期间仍服务于旧宿主

### 10.1 退出条件
- 旧领域 API 宿主退出前，必须至少满足：
  - 新 `server/` 已稳定承接对应主链领域接口
  - 共享领域服务已成为单一真相源
  - 页面预期、服务端生成结果与数据库事实已完成一致性验证
  - 未迁移接口仍有明确兼容去向

## 十一、统一验证要求
- 至少确认：
  - 根级文档已切换到 `phase09` 规划口径
  - `phase09` 三份阶段文档已完整产出
  - 共享领域服务落点、正式宿主边界、历史数据保留规则与旧兼容宿主边界已统一冻结
  - 至少四条主链验证路径已明确
  - 旧宿主、新宿主与后续 `phase10` 的关系已明确
  - 主链删除门禁与历史保留原则已形成统一判断标准

## 十二、阶段停顿门禁
- `phase09` 阶段文档一旦产出完成，必须停止并等待审核
- 未经审核，不得直接进入 `phase09` 的 `/spec` 或实现
- 后续任何 `phase09` 子任务都不得绕开本共享基线重新定义共享服务落点、正式宿主边界、主链验证路径或历史保留原则

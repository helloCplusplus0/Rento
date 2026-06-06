# phase12 前端 parity 文档复核与调整计划

## Summary
- 目标：复核 [phase12_frontend_parity_and_shell_cutover_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md)、[phase12_frontend_parity_and_shell_cutover_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md)、[phase12_frontend_parity_and_shell_cutover_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md) 是否已经满足 [plan.md](file:///home/dell/Projects/Rento/plan.md#L194-L209) 对 `phase12-frontend-parity-and-shell-cutover` 的交付要求。
- 结论：**目前不完全符合预期，需要调整。**
- 核心判断：三份文档已经把“为什么要做 phase12、为什么 Prisma 保留、为什么 UI 必须沿用旧原型、为什么要一次性规划 phase12~15”解释清楚了，但还没有把 `phase12` 自身最关键的“真实页面清单、一一映射、迁移优先级、哪些先迁/延后”的事实层内容冻结下来，因此当前更像“规划框架草案”，还不是“可直接进入审核通过”的决策完成版。

## Current State Analysis
### 1. 与 `plan.md` 要求的对齐情况
- [plan.md](file:///home/dell/Projects/Rento/plan.md#L194-L209) 对 `phase12` 的关键交付写得很具体：
  - 旧 `src/app` 页面到 `src/minix` 路由承接位的一一映射
  - 页面装配层、导航壳、布局壳与数据加载边界的复用/迁移策略
  - 旧 UI 承接硬约束与允许的最小技术适配边界
  - `Prisma + PostgreSQL` 继续保留为正式数据访问主线的阶段继承口径
  - 后续 `phase13 ~ phase15` 的完整路线图与交付顺序
- 其中后 4 项在现有三份文档里已经基本成立，但**第一项“一一映射”仍未真实落地**。

### 2. 当前文档已经做对的部分
- [architecture plan](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md#L79-L148) 已经完成这些高价值判断：
  - 继续保留 `Prisma + PostgreSQL`
  - 旧 UI 继续作为默认原型参考
  - `phase12` 不吞掉 `phase13~15`
  - 页面 parity 先迁页面壳与页面装配边界
  - PWA parity 单独成阶段
- [dev plan](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md#L34-L209) 已经把 `phase12-01 ~ phase12-05` 的顺序拆开，方向是对的。
- [shared baseline](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md#L26-L152) 已经把 Prisma 保留、UI 保真、完整路线图一次性规划这些共享词汇冻结了。

### 3. 当前文档不满足预期的关键缺口
#### 3.1 缺少真实页面清单与页面分类结果
- 仓库内旧页面真实存在的入口并不是抽象概念，而是至少 **37 个** `src/app/**/page.tsx`。
- 现有 `dev plan` 只说“要盘点旧页面清单”，但**没有把盘点结果写出来**。
- 因此当前文档还不能回答 `plan.md` 验收条件中的这句：
  - “能清楚说明当前哪些正式页面仍在旧宿主、哪些页面先迁、哪些页面继续延后”

#### 3.2 缺少“旧页面 -> 新承接位”的一一映射表
- 当前新宿主真实路由结构见 [src/minix/router/index.tsx](file:///home/dell/Projects/Rento/src/minix/router/index.tsx#L17-L56)：
  - `/login`
  - `/offline`
  - `/loading`
  - `/error`
  - `/404`
  - `/`
  - `minixPrimaryRoutes` 对应的一组 `PlaceholderPage`
- 当前 `minixPrimaryRoutes` 的真实语义见 [route-manifest.tsx](file:///home/dell/Projects/Rento/src/minix/routes/route-manifest.tsx#L42-L63)：它们仍是“承接位/壳层”，不是正式页面 parity 的完成态。
- 现有 `phase12` 文档没有把旧页面逐项映射到：
  - 已有真实新路由壳
  - 需要新增的新路由壳
  - 可以继续延后的页面
- 这会导致后续 `/spec` 仍要自己做高影响决策，不符合“决策完成”的 `/plan` 要求。

#### 3.3 缺少“正式页面 / 治理辅助页 / dev-only / 待归档候选”的显式判定结果
- 现有 `dev plan` 第一个子任务要求做分类，但文档本身没有冻结分类结果。
- 这会直接影响：
  - `phase12` 的页面迁移范围
  - `phase13` 的 API parity 优先级
  - `phase15` 的人工验收范围

#### 3.4 缺少“页面 parity 与 retained-legacy API 的实际耦合清单”
- 当前 retained-legacy 的事实来源已经存在于 [legacy-route-inventory.ts](file:///home/dell/Projects/Rento/server/lib/legacy-route-inventory.ts#L45-L58)。
- 但 `phase12` 文档只说“页面-API 关系会影响 phase13”，**没有列出哪些页面先迁会直接牵动哪些 retained-legacy API 退出优先级**。
- 这会让 `phase13` 的上游输入仍然偏抽象。

#### 3.5 缺少对 `src/minix` 当前真实承接能力的更明确量化
- 当前 `src/minix/routes` 实际只有：
  - `HomePage`
  - `LoginPage`
  - `OfflinePage`
  - `LoadingPage`
  - `ErrorPage`
  - `NotFoundPage`
  - `PlaceholderPage`
  - `StatusPageShell`
  - `route-manifest`
- 现有文档虽提到“仍主要承担占位承接”，但没有把这种差距转成**可审核的迁移事实**。

### 4. 由以上缺口得出的判断
- 如果以“方向是否正确”为标准：**符合预期**
- 如果以“是否已经达到 `phase12` 当前轮可审核通过的决策完成状态”为标准：**不符合预期**
- 所以本轮应调整，而不是直接停止。

## Proposed Changes
### 需要调整的文件
- `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
- `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
- `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`
- 视调整幅度，可能还需同步：
  - `plan.md`
  - `AGENTS.md`
  - `README.md`
  - `architecture_map.md`
  但仅在阶段文档结论发生实质变化时才需要同步；如果只是把 `phase12` 内部事实表补齐，则顶层文档大概率无需改动。

### 具体调整方案
#### A. 调整 `architecture_plan`
- 增补一个“真实页面现状盘点”小节，至少包含：
  - 旧 `src/app/**/page.tsx` 页面清单
  - 当前新宿主 `src/minix/routes/*` 与 `router/index.tsx` 的真实承接结构
  - “旧宿主页面数量明显多于新宿主实际页面壳”的结论
- 增补一个“页面 parity 分层判断”小节，显式区分：
  - 正式业务页面
  - 状态页
  - 治理/辅助页面
  - dev-only/待归档候选
- 增补一个“旧页面 -> 新承接位映射原则示例表”，至少覆盖：
  - 首页
  - 登录/离线
  - 房源
  - 合同
  - 账单
  - 租客
  - 抄表
  - 设置
- 增补一个“为什么当前 phase12 尚未满足审核通过”的说明，避免读者误以为当前文档已经给出完整映射。

#### B. 调整 `dev_plan`
- 把 `phase12-01` 从“要盘点”升级为“盘点产物应该长什么样”，明确要求输出：
  - 页面分类表
  - 正式页面范围表
  - 待延后页面表
- 把 `phase12-02` 从抽象映射要求升级为“必须产出一一映射表”，字段至少应包含：
  - 旧页面路径
  - 页面类别
  - 对应新路由/承接位
  - 当前状态
  - 迁移优先级
  - 是否阻塞 `phase13`
- 在 `phase12-03` 里增加“页面装配层候选文件/目录”的真实落点说明，避免只说目录星号。
- 在 `phase12-05` 里增加“只有当前三份文档补齐真实清单与映射表后，才允许视为 phase12 规划完成”的门槛说明。

#### C. 调整 `shared_baseline`
- 增补一个“正式页面范围共享口径”小节，明确：
  - 哪些页面属于 `phase12 ~ phase15` 默认 parity 范围
  - 哪些属于治理/辅助/候选归档范围
- 增补一个“页面映射表是共享输入而不是实现细节”的说明，防止后续 `/spec` 再自行定义映射。
- 增补一个“页面 parity 与 retained-legacy API 优先级联动”的共享规则。

## Assumptions & Decisions
- 决策 1：当前正式数据访问主线继续固定为 `Prisma + PostgreSQL`，本轮不重开 Prisma 替换。
- 决策 2：当前 `Rento` 页面 UI 继续作为新宿主默认原型参考，本轮不把 parity 迁移扩写为 UI 重设计。
- 决策 3：当前 `phase12` 三份文档**需要调整**，不是直接停止。
- 决策 4：调整重点不是推翻现有 `phase12` 文档结构，而是在其现有框架上补足“真实页面清单、真实映射表、真实优先级、真实范围判定”。
- 假设 1：用户本轮要的是 `/plan` 级复核结论与调整方向，而不是马上进入文档实现或 `/spec`。
- 假设 2：只要补齐上述事实层内容，现有 `phase12` 文档框架可以继续沿用，不需要重写成另一套结构。

## Verification
- 复核 [plan.md](file:///home/dell/Projects/Rento/plan.md#L194-L209) 与 `phase12` 三份文档之间是否已经满足：
  - 页面一一映射
  - 哪些先迁 / 延后
  - 不重做 UI 的迁移策略
  - `phase12 ~ phase15` 的职责边界
- 复核仓库真实事实是否被文档吸收：
  - `src/app/**/page.tsx` 真实页面入口清单
  - [src/minix/router/index.tsx](file:///home/dell/Projects/Rento/src/minix/router/index.tsx#L17-L56) 的真实路由承接结构
  - [route-manifest.tsx](file:///home/dell/Projects/Rento/src/minix/routes/route-manifest.tsx#L42-L63) 的当前“承接位/占位”事实
  - [legacy-route-inventory.ts](file:///home/dell/Projects/Rento/server/lib/legacy-route-inventory.ts#L45-L58) 的 retained-legacy / compat-wrapper / formal-host-owned 分类
- 只有在三份 `phase12` 文档补齐以上事实层内容后，才建议视为“符合预期，可停止并交由用户执行”。

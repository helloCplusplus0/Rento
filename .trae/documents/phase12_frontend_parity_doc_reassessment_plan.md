# phase12 文档复核与微调计划

## Summary
- 本次复核对象为：
  - `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`
- 复核基准为 `plan.md` 中 `phase12-frontend-parity-and-shell-cutover` 的目标、关键交付与验收条件，以及当前仓库真实代码现状。
- 结论：三份文档的主体结构、阶段边界、页面范围、映射思路、UI 保真约束、`Prisma + PostgreSQL` 保留口径与 `phase12 ~ phase15` 路线图已经基本符合预期，但仍有两处需要同步修正后，才适合视为“完全符合预期”的当前轮规划产物。

## Current State Analysis

### 1. 已满足 `plan.md` 预期的部分
- 已明确 `phase12` 目标仍是“页面 parity + 页面装配承接 + 路线图冻结”，没有把 `phase13 ~ phase15` 的职责重新混写进来。
- 已写出旧 `src/app/**/page.tsx` 的真实页面清单，并与仓库现状对齐：
  - 通过 `src/app/**/page.tsx` 文件盘点，当前真实页面入口为 37 个。
- 已写出页面分类、优先级与首批 parity 范围，能回答：
  - 哪些页面仍在旧宿主
  - 哪些页面先迁
  - 哪些页面继续延后
- 已写出旧页面到 `src/minix` 的承接基线，并与当前路由现状对齐：
  - `src/minix/router/index.tsx` 当前真实挂载了 `/`、`/login`、`/offline`、`/loading`、`/error`、`/404` 与主导航 placeholder 路由。
- 已写出页面 parity 与 retained-legacy API 的联动基线，并与 `server/lib/legacy-route-inventory.ts` 的分类体系一致。
- 已保持 `Prisma + PostgreSQL` 为正式数据访问主线，并保持 UI 保真约束，没有重新打开 Prisma 替换或 UI 重设计议题。
- 已完成三份文档互链，且整体方向与 `plan.md`、`AGENTS.md`、`project_rules.md` 当前口径一致。

### 2. Context7 复核结果
- React Router 最新资料继续支持 `createBrowserRouter` + `RouterProvider` 的 data router 组织方式，也支持用 `lazy` / route module 方式逐步承接页面与 loader。
- `vite-plugin-pwa` 最新资料继续支持通过 Vite 插件冻结 manifest、service worker、注册方式、自动更新与更新提示。
- 因此三份文档中关于“`src/minix` 继续作为前端宿主承接位”与“PWA parity 应在后续阶段以 `vite-plugin-pwa` 单独承接”的技术判断仍成立。

### 3. 当前仍不完全符合预期的点

#### 3.1 `architecture_plan` 存在一个格式瑕疵
- 文件：`docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
- 位置：`3.1` 结论段
- 当前问题：
  - 文案写成了 `Docker-heavy``，反引号不平衡。
- 影响：
  - 不影响阶段判断本身，但会影响文档可读性与正式性。

#### 3.2 `dev_plan` 存在一段过期状态描述
- 文件：`docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
- 位置：`phase12-05-roadmap-consistency-and-phase12-to-phase15-closure` 的“当前事实基线”
- 当前问题：
  - 仍写着“当前 `phase12` 三份文档已把原则写清，但仍缺：真实页面清单、真实页面分类、一一映射表、页面 parity 与 retained-legacy API 的联动说明”。
- 真实情况：
  - 上述事实层内容已经写入三份文档，继续保留“仍缺”表述会与当前文档状态自相矛盾。
- 影响：
  - 这会削弱本轮复核结论的可信度，也会让后续 `/spec` 或执行者误判当前阶段尚未完成事实层冻结。

## Proposed Changes

### 1. 修正 `architecture_plan` 的格式问题
- 文件：`docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
- What:
  - 把 `Docker-heavy`` 修正为 `Docker-heavy`。
- Why:
  - 消除反引号不平衡导致的文档格式瑕疵。
- How:
  - 只做单行文本修正，不改动该段的阶段结论和技术口径。

### 2. 更新 `dev_plan` 的过期状态段落
- 文件：`docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
- What:
  - 将“仍缺真实页面清单 / 分类 / 映射 / API 联动说明”的旧描述，改为“这些事实层内容已写入三份文档，因此当前轮规划完成的关键要求已具备；后续执行只允许在此基础上进入 `/spec`”。
- Why:
  - 让 `dev_plan` 与当前文档真实状态保持一致，避免形成内部矛盾。
- How:
  - 仅替换 `phase12-05` 的“当前事实基线”段落，不改动任务顺序、DoD、验证要求与阶段边界。

### 3. 执行后复核
- 文件：
  - `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`
- What:
  - 再做一次互链、一致性与路径存在性复核。
- Why:
  - 确认微调后不存在新的状态漂移。
- How:
  - 重点检查：
    - `phase12` 三份文档是否仍保持单一判断标准
    - “Prisma 保留、UI 保真、页面映射表、phase12~phase15 路线图”是否仍表述一致

## Assumptions & Decisions
- 决策：本次问题属于“文档微调”，不是阶段方向错误，也不是需要重写三份文档的级别。
- 决策：`phase12` 的核心预期已经达成，当前剩余问题不涉及重新定义页面范围、映射策略或阶段边界。
- 假设：用户希望得到的是“是否已经达到可审核交付标准”的严谨判断，而不是直接进入实现。
- 决策：在未修正上述两处问题前，本轮文档应判定为“基本符合预期，但尚未达到完全收口”。
- 决策：修正完成后，可判定为“符合预期，可停止，由用户决定后续是否进入 `/spec` 或执行”。

## Verification Steps
- 复核 `plan.md` 中 `phase12` 的关键交付与验收条件，确认三份文档仍完整覆盖。
- 复核 `src/app/**/page.tsx` 页面清单与 37 个页面入口统计是否与文档一致。
- 复核 `src/minix/router/index.tsx` 与 `src/minix/routes/route-manifest.tsx`，确认新宿主当前承接位描述仍准确。
- 复核 `server/lib/legacy-route-inventory.ts`，确认页面 parity 与 retained-legacy API 联动说明仍成立。
- 复核三份文档互链与被引用路径存在性，确认没有新引入的路径漂移。

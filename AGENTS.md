# AGENTS.md

> 职责：项目入口摘要与协作约束。
> 阶段状态只看 `plan.md`，硬规则只看 `project_rules.md`，代码/目录落点只看 `architecture_map.md`。

## 1. 项目定位
- 项目名称：`Rento-miniX`
- 当前定位：在现有 `Rento` 仓库上完成原地重构后的正式主线，服务于私有部署、自有房源经营与低配服务器落地。
- 核心要求：保留真实租务主链、保留旧 `Rento` UI 原型价值、保持单仓库单主线单一真相源。
- 非目标：公开 SaaS、开放注册、多套部署主线、回退到 SQLite 主路径。

## 2. 当前状态
- `phase16` 已完结且通过；当前没有新的 `phase` 在推进。
- 当前默认工作模式：`post-phase16` 独立迭代期，以 fix、小步增强和专项治理为主。
- `Rento-miniX` 是唯一正式主线；旧 `Rento` 与 legacy 资产仅保留只读参考 / 差异对照价值。
- 阶段顺序、当前结论和后续是否新开 `phase`，统一以 `plan.md` 为准。

## 3. 核心基线
- 业务主链：`Building -> Room -> Meter` 与 `Renter -> Contract -> Bill/BillDetail -> MeterReading`
- 正式技术主线：`React + Vite + React Router + Hono + Prisma + PostgreSQL`
- 正式部署主线：`Caddy + systemd + Hono + PostgreSQL + GitHub Release deploy bundle`
- UI 承接原则：任何迁移或重构默认以旧 `Rento` 源代码为直接原型，非必要不改变信息结构与交互节奏。

## 4. 文档分工
- `AGENTS.md`：入口摘要、阅读顺序、协作约束
- `plan.md`：阶段路线图、阶段状态、当前下一步
- `project_rules.md`：硬约束、发布门禁、禁止事项
- `architecture_map.md`：目录结构、运行时落点、正式/legacy 边界
- `global_skills.md`：通用工作方法与执行策略
- `project_skills.md`：Rento 专属业务知识与迁移经验

## 5. 默认工作流
### `phase` 推进链
- 第一步：先在 `plan.md` 做整体规划；可一次只规划一个 `phase`，也可针对明确且跨度大的目标一次规划多个连续 `phase`。
- 第二步：当某个 `phase` 被选为当前执行对象后，先对该 `phase` 执行 `/plan`，并同步根级 6 份文档。
- 第三步：`/plan` 阶段至少产出三份阶段文档：`docs/phase*_architecture_plan.md`、`docs/phase*_dev_plan.md`、`docs/phase*_shared_baseline.md`。
- 第四步：阶段文档经审核通过后，再按 `phase*_dev_plan.md` 的子任务顺序逐一执行 `/spec`、开发、验收与收口。

### `fix` 推进链
- 当前没有新的 `phase` 时，默认进入 `fix` 工作模式。
- 第一步：先由用户在 `docs/fix/` 下填写 `fix_issue_template.md` 对应的 issue 文档，记录现象、影响面与复现条件。
- 第二步：再基于 issue 文档产出 `fix_analysis_template.md` 对应的 analysis 文档，完成系统性根因分析、候选方案对比、推荐方案、验收标准与回滚条件。
- 第三步：analysis 文档确认后，再针对该 fix 执行 `/spec`、开发与验收。

## 6. 协作规则
- 开启新 `phase` 前，先同步上述 6 份根级文档，再进入 `/plan`。
- 没有新 `phase` 时，fix 或小型增强直接实施，但必须遵守 `project_rules.md` 并保持根级文档一致。
- 不允许让同一结论同时由多份根级文档重复承载；一份文档只回答一类问题。
- 任何运行入口、部署方式、安全边界、目录落点变化，都必须同步更新相关真相源。
- 不允许重新引入第二套规划目录、第二套默认 remote 或第二套正式部署入口。

## 7. 推荐阅读顺序
1. `AGENTS.md`
2. `project_rules.md`
3. `plan.md`
4. `architecture_map.md`
5. `global_skills.md`
6. `project_skills.md`
7. `README.md`
8. `docs/phase06_* ~ docs/phase16_*`

## 8. 常用入口
- 项目总览：`README.md`
- 正式部署：`DEPLOYMENT.md`
- 操作手册：`DEPLOY_RUNBOOK.md`
- 阶段文档：`docs/phase06_* ~ docs/phase16_*`
- fix issue 模板：`docs/fix/fix_issue_template.md`
- fix analysis 模板：`docs/fix/fix_analysis_template.md`
- 归档入口：`docs/archive/README.md`

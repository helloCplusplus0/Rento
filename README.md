# Rento-miniX

Rento-miniX 是一个面向房东和运营者的私有化租赁管理后台重构主线，目标是在保留当前 `Rento` 业务骨架、UI 展示效果与主链规则的前提下，完成轻量化、低部署门槛的原地重构。

## 当前状态
- 当前仓库已经从原 `Rento` 主仓切换为 `Rento-miniX` 主线仓。
- 原 `Rento` 已通过 GitHub import 方式保留为备份仓：[`Rento-legacy`](https://github.com/helloCplusplus0/Rento-legacy)。
- 当前本地目录仍位于 `/home/dell/Projects/Rento`，但逻辑主线已切换到 `Rento-miniX`。
- 当前仓库的 `git origin` 已收口到 `https://github.com/helloCplusplus0/Rento-miniX.git`，后续提交与实现默认只围绕当前主仓展开。
- 当前默认工作流已从“真实场景验证与 fix 闭环”切换到 `phase06-minix-replatform` 规划阶段；现阶段先冻结顶层真相源与阶段文档，不直接进入实现。

## 项目定位
- 产品定位固定为受控私有部署的租赁管理后台，不面向公网匿名访问。
- 核心业务链继续覆盖房源、租客、合同、账单、仪表与抄表。
- 当前 `Rento` 前端 UI 展示效果已符合预期，`Rento-miniX` 默认承接该展示效果，非必要不擅自改变。
- 数据库主线继续固定为 PostgreSQL，不因轻量化而回退到 SQLite。

## 重构目标
- 移除当前 `Next.js + Prisma + Redis + Docker-heavy` 运行形态带来的部署门槛。
- 收口到更轻量的目标方案：`React + Vite + Hono + PostgreSQL + Caddy + systemd`。
- 保持合同、账单、支付周期、多仪表、删除门禁、历史保留等主链语义不失真。
- 默认坚持云端不构建，只运行预构建产物。

## 当前阅读入口
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md)：项目入口摘要与执行总约束
- [project_rules.md](file:///home/dell/Projects/Rento/project_rules.md)：刚性规则、门禁与禁止事项
- [architecture_map.md](file:///home/dell/Projects/Rento/architecture_map.md)：当前仓库结构、运行形态与重构承接位
- [plan.md](file:///home/dell/Projects/Rento/plan.md)：整体阶段总览与当前默认入口
- [phase06_minix_replatform_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_architecture_plan.md)：`phase06` 架构规划
- [phase06_minix_replatform_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_dev_plan.md)：`phase06` 开发规划
- [phase06_minix_replatform_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_shared_baseline.md)：`phase06` 共享基线

## 当前说明
- 仓库内原有的 `Rento-miniX/` 目录已在完成内容吸收与引用复核后删除，不再作为长期真相源或临时输入目录保留。
- 当前等待 `phase06` 文档整体审核；审核通过后，再决定正式实现起步顺序。
- `Rento-legacy` 只承担旧主线历史备份与只读对照参考职责，不作为当前阶段默认 remote、推送目标或文档真相源。
- 原容器化部署链仍作为当前存量运行线的可运行基线与回滚参考保留，不自动等同于 `Rento-miniX` 的未来部署主线。
- `phase06` 的 remote 收口边界固定为：主动开发默认只保留 `origin -> Rento-miniX`；若需查看旧主线材料，应按临时只读参考处理，不重新引入并行双 remote 工作流。

# project_rules.md

> 职责：项目刚性规则、发布门禁与禁止事项。
> 阶段状态不在此处播报；阶段状态统一以 `plan.md` 为准。

## 1. 范围与边界
- 项目定位固定为私有租赁管理后台原地重构主线，默认服务于自有房源经营，不以开放注册 SaaS 为目标。
- 所有设计都必须围绕真实租务流程：房源、租客、合同、账单、仪表、抄表、退租、续租。
- 正式数据访问主线固定为 `Prisma + PostgreSQL`，不得以“轻量化”为由回退到 SQLite 主路径。
- 正式部署主线固定为 `Caddy + systemd + Hono + PostgreSQL + GitHub Release deploy bundle`。
- `Rento-miniX` 是唯一正式主线；旧 `Rento` 与相关 legacy 资产仅保留只读参考 / 差异对照职责。

## 2. 安全与发布规则
- 在完整安全边界未收口前，禁止把应用作为公网匿名可访问后台部署。
- 生产环境必须使用私有 `.env`；`.env.example` 仅作为模板，不允许回写真实主机地址、密码与密钥。
- 正式服务器环境文件固定为 `/etc/rento-minix/rento-minix.env`；正式应用目录固定为 `/opt/rento-minix/current`。
- 任何涉及认证、会话、来源限制、CORS 的调整，都必须同时更新实现、环境模板与相关文档。
- 新增管理页、调试入口或迁移辅助入口时，必须先明确门禁边界。

## 3. 数据与模型规则
- `Contract` 是租务事实主锚点；账单、续租、退租、抄表与房态变化必须优先围绕合同表达。
- `Meter` 必须被视为独立资产；移除房间绑定不等于删除历史数据。
- `MeterReading`、`Bill`、`BillDetail` 的历史记录优先保留，禁止用级联删除掩盖业务历史。
- 涉及账务的金额字段必须保持语义稳定；“月租金”“总租金”“首期应收”等概念必须明确区分。
- 删除房间、删除合同、退租、续租等破坏性操作，必须经过服务端业务门禁校验，而不是只看页面状态。

## 4. UI 与交互规则
- 当前 `Rento` 前端 UI 展示效果视为默认承接资产，不做无明确收益的重设计。
- 允许的 UI 变更仅限：宿主适配、明显 bug 修复、移动端可用性改善、最小信息架构优化。
- 任何迁移或重构都必须以旧 `Rento` 源代码为直接原型；除显式批准的最小技术适配外，必须尽量保持页面信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义稳定。
- 新功能或新承载层优先复用既有页面模式和组件表达，避免出现第二套设计系统。

## 5. 文档与目录治理规则
- 根目录只保留当前有效入口文档、配置文件和运行资产；历史任务文档迁入 `docs/archive/`，历史性脚本迁入 `scripts/archive/`。
- `src/app` 中非正式业务入口页面，应继续标注为开发辅助或待归档候选。
- 不允许重新引入新的内嵌规划目录或任何同类第二套真相源。
- 根级文档必须各司其职：
  - `AGENTS.md` 只承接入口摘要与协作约束
  - `plan.md` 只承接阶段路线图与状态
  - `project_rules.md` 只承接硬规则
  - `architecture_map.md` 只承接结构与落点说明
  - `global_skills.md` 只承接通用方法
  - `project_skills.md` 只承接项目专属经验
- 若运行入口、部署方式、数据库主线、安全边界或目录结构发生变化，必须同步更新相关真相源。

## 6. 工作流强制规则
- 若要推进新的目标型任务，必须先判断它应作为 `phase` 还是 `fix` 处理；禁止在两种工作流之间模糊推进。
- `phase` 工作流必须遵守以下顺序：
  - 先在 `plan.md` 完成整体规划，可按目标大小一次规划一个或多个连续 `phase`
  - 再对当前执行的 `phase` 执行 `/plan`
  - 先同步根级 6 份文档，再产出 `docs/phase*_architecture_plan.md`、`docs/phase*_dev_plan.md`、`docs/phase*_shared_baseline.md`
  - 文档经审核通过后，再按 `phase*_dev_plan.md` 的子任务顺序逐一执行 `/spec`、开发与验收
- `fix` 工作流必须遵守以下顺序：
  - 先在 `docs/fix/` 下填写 `fix_*_issue_*.md`
  - 再基于 issue 文档产出 `fix_*_analysis_*.md`
  - analysis 文档确认后，再进入该 fix 的 `/spec`、开发与验收
- 未形成对应的 phase 三件套或 fix 的 issue + analysis 文档前，不得直接进入 `/spec` 或实现。
- `phase` 子任务的 `/spec` 目录必须落在 `.trae/specs/phaseX-<workflow>-<nn>-<task-name>/`。
- `fix` 修复项的 `/spec` 目录必须落在 `.trae/specs/fix-<nn>-<task-name>/`。
- `phase` spec 的 `<nn>` 必须与对应 `phase*_dev_plan.md` 中的子任务编号一致；`fix` spec 的 `<nn>` 必须与对应 issue / analysis 文档中的 fix 编号一致。
- `<task-name>` 必须使用稳定、可读、kebab-case 的英文短语，不得使用临时占位名、中文目录名或无语义缩写。

## 7. 变更与 legacy 资产规则
- 旧容器化运行线相关文档、脚本与部署资产，只承担历史运行参考、差异对照与未来归档前审计职责。
- `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs` 当前统一视为只读参考 / 差异对照资产。
- 在明确完成参考内容吸收、差异审计与独立归档决策前，不得把上述资产误写为“已退出”“已归档完成”或“可删除”。
- `Rento-legacy` 只承担 GitHub 侧只读历史备份与参考职责，不得重新引入为默认 remote、默认上游、部署入口或第二真相源。

## 8. 验证与发布门禁
- 提交前至少完成：`npm run lint`、`npm run type-check`。
- 发布前至少完成：构建通过、`/api/health` 可用、核心业务流 smoke test。
- 若变更涉及账单、合同、仪表、抄表任一主链，必须补充至少一条可执行验证路径。
- 若当前提交对应某个已批准 `spec` 子任务，还必须附带独立审核通过结论；未通过审核验收，不得提交或推送。

## 9. 当前治理债务
- 最小鉴权门禁已落地，但角色控制、最小审计与公网发布所需的完整安全边界仍未全部完成。
- 迁移锁与早期迁移文件仍带有 SQLite 历史痕迹，仍需后续专项治理收口。
- legacy 参考资产仍在仓库中保留，其最终归档或移除审计需在后续独立治理任务中完成。
- 需要持续防止把旧 `Rento` 地址、旧部署路径或旧 remote 重新引回主动开发主线。

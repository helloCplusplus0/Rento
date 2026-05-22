- 运行时产物目录如 `logs/`、`backups/`、`nginx/ssl/`、本地数据库文件，不应继续作为版本控制主路径的一部分。

## 6. 文档规则
- `README.md` 负责对外总览与启动说明，不承载过细的历史任务细节。
- `AGENTS.md` 负责入口摘要与执行总约束。
- `project_rules.md` 负责刚性规则与门禁。
- `architecture_map.md` 负责代码向结构映射与目录说明。
- `plan.md` 负责当前阶段顺序、目标、验收与近期行动计划。
- 阶段级设计文档模板固定为 `docs/phaseX_<workflow>_architecture_plan.md`、`docs/phaseX_<workflow>_dev_plan.md`，必要时补充 `docs/phaseX_<workflow>_shared_baseline.md`。
- 子任务 `spec` 目录模板固定为 `.trae/specs/phaseX-<workflow>-<nn>-<task-name>/`。
- 真实场景验证问题报告模板固定为 `docs/fix/fix_XXX_issue_<topic>.md`，只记录问题事实、复现路径、预期与实际差异，不写实施方案。
- 根因与方案分析文档模板固定为 `docs/fix/fix_XXX_analysis_<topic>.md`，必须明确根因、证据链、影响面、数据修复策略、验收标准与回滚条件。
- `docs/fix/fix_issue_template.md` 与 `docs/fix/fix_analysis_template.md` 分别作为 `issue` 与 `analysis` 的模板真相源。
- 当用户发起 `/plan` 后，必须先同步顶层规范文档，再产出阶段级设计文档；文档产出后必须停下，等待用户审核后才能进入 `/spec`。
- `phase04-performance-and-ops-01-*` 只允许冻结共享边界、页面初始分类口径与验收方向，不允许提前进入查询优化、观测补强或页面门禁实现。
- 归档文档默认只读，不再作为当前实现依据。

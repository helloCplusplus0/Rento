# Tasks
- [x] Task 1: 收口 `phase12 ~ phase15` 的完整路线图与前后依赖。
  - [x] SubTask 1.1: 复核 `plan.md`、`docs/phase12_*`、`docs/phase10_*`、`docs/phase11_*` 当前对 `phase12 ~ phase15` 的表述。
  - [x] SubTask 1.2: 明确 `phase12`、`phase13`、`phase14`、`phase15` 的职责、继承输入、DoD 与退出条件。
  - [x] SubTask 1.3: 形成后续 `/spec` 可直接复用的多阶段路线图说明。

- [x] Task 2: 收口顶层真相源与阶段文档一致性。
  - [x] SubTask 2.1: 复核 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*` 当前状态是否一致。
  - [x] SubTask 2.2: 必要时同步顶层真相源与阶段文档的阶段状态、路线图口径和验证要求。
  - [x] SubTask 2.3: 保持范围只到文档收口，不提前进入页面迁移、API 切流、PWA 迁移或 cutover 实现。

- [x] Task 3: 冻结文档轮次的最小验证要求。
  - [x] SubTask 3.1: 明确 `docs/phase12_*` 三份文档互链复核要求。
  - [x] SubTask 3.2: 明确被引用路径与文件存在性复核要求。
  - [x] SubTask 3.3: 明确顶层真相源与阶段文档状态一致性复核要求。

- [x] Task 4: 完成 `phase12-05` 的验证并等待独立子代理终审；终审明确通过前不得标记完成。
  - [x] SubTask 4.1: 复核 `phase12 ~ phase15` 路线图已具备单一解释。
  - [x] SubTask 4.2: 复核顶层真相源与阶段文档状态一致，且文档轮次最小验证要求清晰可执行。
  - [x] SubTask 4.3: 指定独立子代理执行终审，并仅在子代理明确给出“通过”结论后，才允许将 Task 4 标记完成。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2 and Task 3

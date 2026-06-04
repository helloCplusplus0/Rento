# Tasks

- [x] Task 1: 盘点内嵌 `Rento-miniX/` 目录的现有材料，建立统一分类基线。
  - [x] SubTask 1.1: 盘点顶层治理文档，包括 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md` 与 `plan.md`
  - [x] SubTask 1.2: 盘点方案与阶段文档，包括 `docs/rento_minix_solution_overview.md`、`docs/rento_to_minix_transition_workflow.md` 与 `docs/phase01_*`
  - [x] SubTask 1.3: 输出每份材料的当前角色判断，区分“可抽取内容”与“临时输入材料”

- [x] Task 2: 冻结内嵌目录与根级真相源之间的职责边界。
  - [x] SubTask 2.1: 在 `phase06` 相关文档或对应治理文档中明确 `Rento-miniX/` 目录不再作为长期并行主线
  - [x] SubTask 2.2: 明确根级真相源应承接哪些内容，避免后续再次从内嵌目录直接驱动阶段实现
  - [x] SubTask 2.3: 明确保留为临时输入材料的文件范围及其仍可被引用的条件

- [x] Task 3: 冻结目录清理的顺序与前置门禁。
  - [x] SubTask 3.1: 明确后续必须遵守“抽取 -> 复核 -> 清理”的顺序
  - [x] SubTask 3.2: 明确删除前必须满足“有效内容已吸收”“引用已复核完成”两类条件
  - [x] SubTask 3.3: 明确本子任务不直接删除目录、不创建归档目录、不进入业务实现

- [x] Task 4: 完成文档级验收，确保用户能直接理解该目录当前角色。
  - [x] SubTask 4.1: 核对内嵌目录已被统一定义为“前置规划输入材料”
  - [x] SubTask 4.2: 核对用户能直接分辨“应抽取内容”与“临时保留材料”
  - [x] SubTask 4.3: 核对删除时机与前置条件已可直接理解

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 1, Task 2, Task 3

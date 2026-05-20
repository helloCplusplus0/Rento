# Tasks

- [x] Task 1: 校准 `phase03` 阶段文档的边界表达
  - [x] SubTask 1.1: 调整 `docs/phase03_consistency_hardening_architecture_plan.md`，补强“真实租务流程优先、事实表达优先于最简关系”的理由
  - [x] SubTask 1.2: 调整 `docs/phase03_consistency_hardening_dev_plan.md`，把子任务 01 的范围扩展为允许同步吸收上述判断标准
  - [x] SubTask 1.3: 调整 `docs/phase03_consistency_hardening_shared_baseline.md`，把“业务真实、状态可解释、历史可追溯、实现低复杂度”写成共享评审基线

- [x] Task 2: 补齐 `AGENTS.md` 的高层判断标准
  - [x] SubTask 2.1: 在 `AGENTS.md` 中补入“正确设计优先追求真实经营流程与长期可维护的事实表达，而不是最简化数据关系”
  - [x] SubTask 2.2: 明确后续 `phase03` 与其他阶段在评审边界时默认优先考虑业务真实、状态可解释、历史可追溯、实现低复杂度

- [x] Task 3: 完成文档一致性与最小验证
  - [x] SubTask 3.1: 核对 `AGENTS.md` 与三份 `phase03` 文档对同一判断标准的表述一致
  - [x] SubTask 3.2: 运行文档相关诊断检查，确认没有新增格式或编辑器错误

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 3] depends on [Task 2]

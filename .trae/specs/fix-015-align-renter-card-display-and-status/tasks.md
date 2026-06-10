# Tasks
- [x] Task 1: 冻结租客卡片与详情状态区块的信息边界。
  - [x] SubTask 1.1: 明确租客卡片中哪些字段属于租客基础资料，哪些字段属于当前生效合同快照。
  - [x] SubTask 1.2: 明确租客详情页“当前状态”区块至少需要承载哪些信息，以及需要对齐的同类 UI 基线。

- [x] Task 2: 修正租客列表查询、序列化与前端标准化链路，确保卡片可获得真实活跃合同月租信息。
  - [x] SubTask 2.1: 盘点列表查询当前缺失的合同字段，并补齐最小所需字段。
  - [x] SubTask 2.2: 复核服务端序列化与前端标准化逻辑，避免缺字段时把金额静默回退成 `0`。
  - [x] SubTask 2.3: 验证有生效合同和无生效合同两类租客在卡片上的展示结果。

- [x] Task 3: 对齐租客详情页“当前状态”区块的信息层级与视觉表达。
  - [x] SubTask 3.1: 调整当前状态区块结构，使其包含状态 badge、关联房间/合同摘要与解释文本。
  - [x] SubTask 3.2: 保持既有详情页整体结构不变，只做最小层级优化与同类基线对齐。

- [x] Task 4: 收紧租客列表与详情相关组件的类型约束，降低静默回归风险。
  - [x] SubTask 4.1: 为卡片、列表网格、详情状态区块、合同历史等组件接入明确的客户端 DTO 或裁剪后的 view-model。
  - [x] SubTask 4.2: 复核类型收口不会破坏当前页面装配层和旧原型承接边界。

- [ ] Task 5: 完成最小验证并复核 fix 范围未越界。
  - [x] SubTask 5.1: 执行 `npm run lint` 与 `npm run type-check`。
  - [ ] SubTask 5.2: 人工复核 `/renters` 与 `/renters/:id`，至少覆盖“有生效合同租客”和“无生效合同租客”两类样例。
  - [x] SubTask 5.3: 确认本次 fix 未扩写为租客列表服务端搜索重构、详情页大改版或新的 API phase。

- [ ] Task 6: 修复活跃租客卡片仍未展示真实月租的问题，并补完人工复核。
  - [ ] SubTask 6.1: 追查当前活跃租客样例仍显示“租金待补全”的真实原因，确认是查询字段、数据映射还是样例数据链未命中。
  - [ ] SubTask 6.2: 修复后重新人工复核 `/renters` 与 `/renters/:id`，确保活跃租客展示真实月租、空闲租客不展示误导性快照。
  - [ ] SubTask 6.3: 复核“当前状态”区块视觉层级与说明文本，确认 checklist 剩余未勾选项全部满足。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2 and Task 3
- Task 5 depends on Task 2, Task 3, and Task 4
- Task 6 depends on Task 5

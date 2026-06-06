# Tasks
- [x] Task 1: 冻结 `phase12-02` 的页面到 Minix 路由映射范围。
  - [x] SubTask 1.1: 复核 `src/app/**/page.tsx` 与 `src/minix/router/index.tsx`、`src/minix/routes/route-manifest.tsx` 的当前承接现状。
  - [x] SubTask 1.2: 明确哪些正式页面已有新宿主路由承接位，哪些仍缺失正式落点。
  - [x] SubTask 1.3: 明确缺失承接位的统一命名规则，保证目标新路由/承接位字段可追溯。

- [x] Task 2: 补齐正式页面映射表字段并冻结迁移优先顺序。
  - [x] SubTask 2.1: 在 `docs/phase12_*` 中把正式页面映射表扩展为包含 `目标新路由/承接位`、`是否阻塞 phase13` 的完整表。
  - [x] SubTask 2.2: 为登录、首页、核心主链列表/详情/编辑页写明单一可解释的优先顺序。
  - [x] SubTask 2.3: 为延后页面和不进入正式 parity 的页面保持边界说明，不扩大到页面实现迁移。

- [x] Task 3: 对齐 `phase13 ~ phase15` 的共享输入口径。
  - [x] SubTask 3.1: 确保映射表与 `shared_baseline` 的页面-API 联动规则一致。
  - [x] SubTask 3.2: 明确哪些页面会直接阻塞 `phase13` retained-legacy API 退出顺序。
  - [x] SubTask 3.3: 确保 `dev_plan` 与 `architecture_plan` 对本子任务的 DoD、验证要求和事实表口径一致。

- [x] Task 4: 完成 `phase12-02` 的验证与验收闭环。
  - [x] SubTask 4.1: 复核映射表中引用的旧页面真实存在。
  - [x] SubTask 4.2: 复核映射表中的已有新承接位真实存在，缺失承接位有明确命名依据。
  - [x] SubTask 4.3: 指定独立子代理执行审核验收，并在通过后才标记本子任务完成。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2 and Task 3

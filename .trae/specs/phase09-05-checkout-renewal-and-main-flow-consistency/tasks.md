# Tasks
- [x] Task 1: 抽取退租结算共享服务，建立退租主链的正式承接位。
  - [x] SubTask 1.1: 基于 `src/lib/checkout-settlement.ts` 与 `src/app/api/contracts/[id]/checkout/route.ts` 梳理退租结算计算器、旧账单收口、房态回空与终抄事务边界。
  - [x] SubTask 1.2: 在 `src/lib/domain/contracts/*` 中创建退租结算与事务编排服务入口，保持路由层只负责请求适配。
  - [x] SubTask 1.3: 让 `server/routes/checkout.ts` 为退租结算正式承接位，并明确 compat 边界说明。

- [x] Task 2: 抽取续租与补账单关联共享服务，冻结合同主链延续编排。
  - [x] SubTask 2.1: 基于 `src/app/api/contracts/[id]/renew/route.ts` 与 `src/app/api/contracts/[id]/generate-bills/route.ts` 提炼原合同收口、新合同创建、补账单和房态联动规则。
  - [x] SubTask 2.2: 在 `src/lib/domain/contracts/*` 中创建续租与补账单关联服务入口。
  - [x] SubTask 2.3: 让 `server/routes/contracts.ts` 或相关正式宿主消费新的续租与补账单共享服务，并保留 compat 边界说明。

- [x] Task 3: 收口主链查询与写路径一致性，避免页面、服务端与数据库事实脱节。
  - [x] SubTask 3.1: 识别新签合同、续租、退租结算、多仪表抄表出账四条主链的关键查询入口和写路径出口。
  - [x] SubTask 3.2: 修正不一致的查询/写路径关系，使页面预期、服务端结果与数据库事实口径统一。
  - [x] SubTask 3.3: 写清旧兼容宿主与正式宿主的保留边界清单，不新增第二套主链解释规则。

- [x] Task 4: 收口旧合同宿主 compat wrapper，使旧入口不再独占退租和续租主链真相。
  - [x] SubTask 4.1: 更新 `src/app/api/contracts/[id]/checkout/route.ts`，使其通过共享领域服务或正式宿主消费退租结算结果。
  - [x] SubTask 4.2: 更新 `src/app/api/contracts/[id]/renew/route.ts` 与 `generate-bills/route.ts`，使其通过共享服务消费续租和补账单结果。
  - [x] SubTask 4.3: 在旧入口中补足 compat wrapper 的存在原因与退出条件，不新增第二套事务编排。

- [x] Task 5: 补齐主链 smoke 验证路径并完成实现校验。
  - [x] SubTask 5.1: 为新签合同、续租、退租结算、多仪表抄表出账四条主链补齐至少四条可执行 smoke 验证路径。
  - [x] SubTask 5.2: 让验证入口落到真实脚本、验证器或可执行清单，而不是停留在口头说明。
  - [x] SubTask 5.3: 运行 `npm run lint`。
  - [x] SubTask 5.4: 运行 `npm run type-check`。
  - [x] SubTask 5.5: 复核页面预期、服务端结果与数据库事实在四条主链上均可解释。
  - [x] SubTask 5.6: 确认本子任务未切 ORM、未切最终部署主线、未迁移完整前端页面壳。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 3, Task 4

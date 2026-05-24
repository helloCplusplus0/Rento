# Tasks

- [x] Task 1: 冻结抄表记录结构化语义。为 `MeterReading` 增加明确的记录类型，并打通合同创建、正常抄表、退租最终抄表三条写入路径。
  - [x] SubTask 1.1: 调整 `prisma/schema.prisma` 与相关类型定义，引入结构化 `recordType`
  - [x] SubTask 1.2: 调整 `src/app/api/contracts/route.ts`，将合同初始底数写为 `INITIAL_BASELINE`
  - [x] SubTask 1.3: 调整 `src/app/api/meter-readings/route.ts`，将日常抄表写为 `REGULAR_READING`
  - [x] SubTask 1.4: 调整 `src/app/api/contracts/[id]/checkout/route.ts`，将退租最终抄表写为 `CHECKOUT_FINAL`

- [x] Task 2: 收口正式抄表重复门禁与聚合输入。确保重复校验基于 `meterId + readingDate + REGULAR_READING` 精确判断，换表后有效读数不会被误跳过。
  - [x] SubTask 2.1: 重写 `src/app/api/meter-readings/route.ts` 的重复判断，移除“服务器今天 + limit 1 + 内存过滤”的错误实现
  - [x] SubTask 2.2: 调整 `src/lib/queries.ts`，提供数据库侧精确查询或等价共享能力，避免全量/分页后内存判断
  - [x] SubTask 2.3: 评估并落实正式抄表的数据库级或等价稳定唯一门禁，必要时增加历史数据审计前置说明
  - [x] SubTask 2.4: 确认聚合账单只遗漏真实重复记录，不遗漏换表后本应纳入的有效仪表项目
  - [x] SubTask 2.5: 补齐 `fix_003` 迁移 SQL，使 `recordType` 数据库字段与当前 PostgreSQL 同步路径保持一致
  - [x] SubTask 2.6: 对现有 PG 历史数据执行重复审计；在存在历史重复组时，冻结为“应用层精确门禁 + 审计清单”的兼容路径，而不强行落数据库唯一约束

- [x] Task 3: 收口抄表历史页与删除能力口径。消除历史页“可删但永远失败”的伪能力，并改为基于结构化类型展示记录。
  - [x] SubTask 3.1: 调整 `src/components/pages/MeterReadingHistoryPage.tsx`，使用结构化 `recordType` 替代备注关键字判断
  - [x] SubTask 3.2: 对齐 `src/app/api/meter-readings/[id]/route.ts` 与 `src/lib/queries.ts` 的删除策略
  - [x] SubTask 3.3: 根据冻结边界决定“隐藏删除按钮”或“开放有限删除”，并让页面与服务端口径一致
  - [x] SubTask 3.4: 修复历史页对存量/未知 `recordType` 的兼容渲染，避免运行时崩溃

- [x] Task 4: 修正房间仪表管理中的“移除”表达与换表说明。让页面文案准确反映当前真实行为：有历史则停用保留，无历史才可硬删除。
  - [x] SubTask 4.1: 调整 `src/components/business/RoomMeterManagement.tsx` 与相关卡片文案
  - [x] SubTask 4.2: 对齐 `src/app/api/meters/[meterId]/route.ts` 的返回语义与前端提示
  - [x] SubTask 4.3: 确保换表默认路径清晰表达为“停用旧表 + 新增新表”

- [x] Task 5: 完成主链验证与验收回写。验证换表后抄表、同日底数后正式抄表、历史页展示与删除能力口径全部通过。
  - [x] SubTask 5.1: 执行 `npm run lint`
  - [x] SubTask 5.2: 执行 `npm run type-check`
  - [x] SubTask 5.3: 补并执行至少一条“停用旧表 + 新增新表 + 再次抄表 + 聚合账单完整”的验证路径
  - [x] SubTask 5.4: 补并执行至少一条“合同创建当天底数 + 同日正式抄表不误判重复”的验证路径
  - [x] SubTask 5.5: 排查并修复真实页面“提交抄表后 about:blank / 未返回成功回执”的阻塞问题
  - [x] SubTask 5.6: 验证主页快捷操作 -> `批量抄表` 入口可达，且批量抄表页已适配 fix_003 的提交与回执结构
  - [x] SubTask 5.7: 回写 `tasks.md` 与 `checklist.md`

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] can run in parallel with [Task 2]
- [Task 5] depends on [Task 2]
- [Task 5] depends on [Task 3]
- [Task 5] depends on [Task 4]

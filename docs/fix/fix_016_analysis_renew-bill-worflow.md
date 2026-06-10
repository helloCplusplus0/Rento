# Fix 016 Analysis - 续租流程账单联动调整

## 1. 问题摘要
- 对应问题：`fix_016`
- 问题级别：`P1`
- 是否阻断修复：是

## 2. 根因结论
- 根因一：续租主链在服务端没有独立的账单语义，仍把“续租合同”当作“首次新增合同”执行基础账单生成。
  - [contracts.ts](file:///home/dell/Projects/Rento/server/routes/contracts.ts#L675-L745) 的 `POST /:id/renew` 只负责接收续租表单并调用 `contractDomainService.renewContract(...)`，没有任何“续租押金续押”的账单过滤规则。
  - [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L885-L918) 在续租事务成功后直接调用 `generateContractBills(newContract.id, { mode: 'auto' })`。
  - [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L677-L720) 的 `generateContractBills()` 在新合同没有账单时总是落到 `generateBaseBillsForContract()`，其一致性标签仍写成 `NEW_SIGN_CONTRACT`，说明当前实现没有区分“新签”和“续租”的账单事实。
- 根因二：基础账单生成真相层没有“账单生成上下文”，只按合同金额字段机械出账。
  - [billing/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/billing/index.ts#L559-L630) 的 `buildContractBaseBillDrafts()` 会无条件按 `deposit > 0` 生成押金账单，按 `keyDeposit > 0` 生成钥匙押金账单，按 `cleaningFee > 0` 生成卫生费账单，并按支付周期生成租金账单。
  - [billing/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/billing/index.ts#L898-L940) 的 `generateBaseBillsForContract()` 直接持久化这些草案，没有来源类型、上下文模式或业务例外参数。
  - 因此只要续租新合同的 `deposit` 或 `keyDeposit` 字段仍大于 `0`，押金账单和钥匙押金账单都会被再次生成。
- 根因三：续租页面预览与表单默认值也完全复用了首次签约心智，提前把错误账单语义展示给用户。
  - [RenewContractPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenewContractPage.tsx#L103-L117) 会把原合同的 `deposit`、`keyDeposit`、`cleaningFee` 默认继承到续租表单。
  - [RenewContractPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenewContractPage.tsx#L758-L773) 直接复用 [ContractBillPreview.tsx](file:///home/dell/Projects/Rento/src/components/business/ContractBillPreview.tsx#L53-L107)，而该组件会在 `deposit > 0` 时预览押金账单、在 `keyDeposit > 0` 时预览钥匙押金账单。
  - 结果是“续租不应再自动生成押金账单和钥匙押金账单”的业务规则，在页面预览层就已经被违背。
- 根因四：当前系统没有把“续租合同字段可编辑”和“押金/钥匙押金不自动出账，改由新增账单兜底”这两条规则一起落地。
  - [RenewContractPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenewContractPage.tsx#L561-L610) 允许在续租页编辑押金和钥匙押金。
  - [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L818-L829) 会把 `newDeposit/newKeyDeposit/newCleaningFee` 持久化到新合同。
  - 但当前系统没有同时补上“续租不自动生成押金/钥匙押金账单，若需补收改走新增账单”的明确执行边界与页面提示，导致操作者会误以为修改押金字段后系统仍会像首次签约一样自动出账。

## 3. 证据链
- 页面预展示链路：
  - 合同详情页“续租”入口在 [ContractDetailPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/ContractDetailPage.tsx#L45-L48) 与 [EnhancedContractDetail.tsx](file:///home/dell/Projects/Rento/src/components/business/EnhancedContractDetail.tsx#L330-L340)。
  - 续租页面由 [ContractRenewRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/contracts/ContractRenewRoute.tsx#L22-L35) 装配，主体组件是 [RenewContractPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenewContractPage.tsx#L62-L227)。
  - 续租页账单预览直接复用 [ContractBillPreview.tsx](file:///home/dell/Projects/Rento/src/components/business/ContractBillPreview.tsx#L53-L107)，当前会把押金账单一并展示。
- 服务端实际创建链路：
  - 正式宿主是 [contracts.ts](file:///home/dell/Projects/Rento/server/routes/contracts.ts#L675-L745)。
  - 续租业务真相在 [renewContract()](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L723-L920)。
  - 续租完成后账单生成走 [generateContractBills()](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L677-L720) -> [generateBaseBillsForContract()](file:///home/dell/Projects/Rento/src/lib/domain/billing/index.ts#L898-L940)。
- 数据模型映射：
  - `Contract.deposit` 是合同事实字段，不是账单聚合字段，见 [schema.prisma](file:///home/dell/Projects/Rento/prisma/schema.prisma#L147-L168)。
  - `Contract.isExtended` 当前只标识“原合同已续租”，并不会给新合同提供“续租来源”语义，见 [schema.prisma](file:///home/dell/Projects/Rento/prisma/schema.prisma#L142-L146) 与 [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L858-L869)。
  - 退租结算以合同上的 `deposit/keyDeposit` 作为退款事实输入，见 [checkout-settlement.ts](file:///home/dell/Projects/Rento/src/lib/checkout-settlement.ts#L167-L209)。
- 关键代码位置：
  - 续租表单默认值：[RenewContractPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenewContractPage.tsx#L103-L117)
  - 续租页面账单预览：[RenewContractPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenewContractPage.tsx#L758-L773)
  - 账单预览押金草案：[ContractBillPreview.tsx](file:///home/dell/Projects/Rento/src/components/business/ContractBillPreview.tsx#L60-L101)
  - 续租 API：[contracts.ts](file:///home/dell/Projects/Rento/server/routes/contracts.ts#L675-L745)
  - 续租服务：[contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L723-L920)
  - 基础账单草案生成：[billing/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/billing/index.ts#L559-L630)
- 是否存在历史脏数据：
  - 待确认，但高概率存在。
  - 代码已经证明：凡是续租后走到 `generateBaseBillsForContract()`，且新合同 `deposit > 0` 或 `keyDeposit > 0`，都会生成对应的押金账单或钥匙押金账单。
  - 我尝试通过本地 Prisma 直接抽样续租合同验证历史数据，但当前 CLI 环境数据库连接串解析失败，无法在 analysis 阶段完成样本核查；因此本轮结论应按“存在历史误生成风险，需专项盘点”处理。

## 4. 影响面分析
- 新创建合同：
  - 不应受影响。
  - 首次新增合同继续生成“租金 + 卫生费 + 钥匙押金 + 押金”账单，仍符合当前业务规则。
- 续租：
  - 直接受影响。
  - 当前续租会错误生成押金账单与钥匙押金账单，导致操作者被迫把并不存在的押金/钥匙押金收款记入系统。
- 手工生成账单：
  - 受影响。
  - 即使续租接口本身改成“不自动生成押金账单/钥匙押金账单”，如果后续对该续租合同再调用 [POST /:id/generate-bills](file:///home/dell/Projects/Rento/server/routes/contracts.ts#L768-L789)，现有共享账单生成逻辑仍可能把这两类账单补回来。
- 历史已生成账单：
  - 可能受影响。
  - 既有续租合同如果已经被系统自动生成并收取押金账单或钥匙押金账单，会污染应收、已收与财务统计。
- 统计 / 仪表盘：
  - 受影响。
  - 多余押金账单会抬高账单总应收；若操作者为了关单而登记收款，又会同步抬高已收金额，破坏真实现金流统计。
- 退租结算：
  - 高风险关联。
  - 如果续租场景允许修改 `deposit`，却不同时定义“是否需要重新收押”，退租结算会按新的合同押金值退款，可能和历史真实收款不一致。
- 其他入口：
  - 是。
  - 续租页面账单预览、续租成功后的自动出账、合同详情页手工“生成账单”入口，三者都共享同一套账单真相，必须一起收口。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 只在续租 API 成功后，把自动生成账单结果中过滤掉 `DEPOSIT` 类型；页面预览暂不调整，共享账单服务不改。
- 优点：
  - 改动最小，能快速阻止一部分续租押金账单继续落库。
- 风险：
  - 页面预览仍会错误展示押金账单，前后不一致。
  - 手工“生成账单”仍会重新补出押金账单。
  - 没有解决“续租合同押金字段仍可编辑”的语义冲突。

### 方案 B
- 做法：
  - 把续租页面中的 `newDeposit/newKeyDeposit` 直接隐藏或锁定为只读，续租统一继承旧合同押金/钥匙押金且不允许调整；同时在续租自动出账和账单预览中排除这两类账单。
- 优点：
  - 语义最稳定，能保证“续租不自动补收押金/钥匙押金”不发生误解。
  - 账单真相最容易保持一致。
- 风险：
  - 与你已明确的业务前提“续租页所有字段默认继承且可编辑”不一致。
  - 会不必要地缩小续租页可编辑范围，不符合当前 fix 的业务目标。

### 方案 C
- 做法：
  - 在账单真相层引入“合同账单生成上下文”，显式区分 `NEW_SIGN` 与 `RENEWAL`。
  - `NEW_SIGN` 继续生成押金、钥匙押金、卫生费、租金账单。
  - `RENEWAL` 默认只生成租金、卫生费账单，不生成钥匙押金账单，也不生成押金账单。
  - 续租页账单预览同步接受上下文参数，和后端保持同一条规则。
  - 续租页继续保留所有合同字段默认继承且可编辑，但要同步补一条明确规则：续租不会再自动生成押金/钥匙押金账单；若后续需要补收相关费用，应由操作者通过“新增账单”单独处理。
- 优点：
  - 能完整覆盖页面预览、自动出账、手工补账三条入口。
  - 保持首次签约规则不变，同时让续租形成独立语义，不会再被 `generate-bills` 补回押金/钥匙押金账单。
  - 与你明确澄清的业务规则完全一致：续租默认只自动出“租金 + 卫生费”，其余补收通过新增账单兜底。
- 风险：
  - 改动面比局部 if/else 更大，需要同步修改预览、服务、共享账单层和验证逻辑。
  - 需要明确历史数据清理策略，否则新旧规则混用会造成存量误差。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 C：在账单真相层引入续租上下文，统一把“续租默认只生成租金 + 卫生费，不再自动生成钥匙押金/押金”下沉到共享生成规则**。
  - 这条方案最符合当前项目“合同是租务事实主锚点、账务语义必须稳定、删除和修正必须由服务端规则保障”的约束。
  - 它不是只改一个接口返回，而是把“续租 != 首次签约”的业务差异落实到页面预览、自动出账、手工补账三条主路径，能避免修完后从其他入口再次复发。
- 实施边界：
  - 账单真相层：
    - 为基础账单草案生成增加明确上下文，例如 `NEW_SIGN` / `RENEWAL`。
    - `RENEWAL` 模式下排除 `DEPOSIT` 与“其他-钥匙押金”草案，只保留租金、卫生费草案。
    - `generateContractBills()` 与 `generateBaseBillsForContract()` 需要能识别合同来源或显式接收上下文，避免“手工生成账单”绕过规则。
  - 续租服务层：
    - `renewContract()` 调用账单生成时必须显式传入 `RENEWAL` 上下文。
  - 页面预览层：
    - 续租页账单预览必须与后端共享同一条规则，不再展示押金账单和钥匙押金账单。
    - 同步补一条说明文案，明确“续租默认只自动生成租金与卫生费；若需补收押金或钥匙押金，请在合同创建后通过新增账单处理”。
  - 页面表单层：
    - 保留旧合同字段默认继承。
    - 保留所有字段可编辑，不额外缩小续租页可填写范围。
    - 但需要通过文案和交互明确“字段可编辑”不等于“系统会自动为该字段生成对应账单”。
  - 验证与治理层：
    - 需要补一份最小历史盘点脚本或人工核查策略，识别既有“续租合同 + 押金账单/钥匙押金账单”样本。
- 明确不在本次修复范围内的内容：
  - 不重构首次新增合同账单生成规则。
  - 不在本次 fix 中设计“续租字段变更后自动推导补收账单”的复杂编排。
  - 不修改退租结算整体算法，只保证本次修复不再继续自动生成错误的押金/钥匙押金账单。
  - 不扩大为合同模块全面重构或新的 phase。

## 7. 数据修复策略
- 是否需要修历史数据：需要，至少需要盘点并分类处理。
- 若需要，修复范围：
  - 所有“来源为续租合同”的合同样本中，系统自动生成的 `DEPOSIT` 类型押金账单，以及 `OTHER + itemLabel=钥匙押金` 类型账单。
  - 优先盘点以下两类：
    - 已生成但未收款的押金/钥匙押金账单：可作为候选清理对象。
    - 已生成且已登记收款的押金/钥匙押金账单：必须人工逐单核实真实是否发生过补收，再决定是否冲销或保留。
- 修复原则：
  - 不能直接批量删除全部续租押金/钥匙押金账单。
  - 必须先区分“误生成但未实际收款”与“真实存在补收”的样本；后者即使未来要专项治理，也不能在本次 fix 中粗暴抹除。
- 若暂时不能立即修复全部历史数据：
  - 至少先冻结新规则，阻止新增错误账单继续产生。
  - 同时输出一份盘点清单，供后续专项处理历史样本。

## 8. 验收标准
- 页面预览层满足：
  - 续租页面默认继承原合同字段。
  - 在不调整其他费用前提下，续租页账单预览不再出现押金账单与钥匙押金账单。
  - 续租页需明确提示“续租默认只自动生成租金与卫生费，若需补收押金或钥匙押金，请通过新增账单处理”。
- 服务端账单层满足：
  - 续租成功后自动生成的账单只包含：
    - 分期租金账单
    - 卫生费账单（若 `cleaningFee > 0`）
  - 不再自动生成 `DEPOSIT` 类型押金账单。
  - 不再自动生成“其他-钥匙押金”账单。
- 其他入口一致性满足：
  - 对续租生成的新合同执行“手工生成账单”时，也不得再补出押金账单或钥匙押金账单。
  - 首次新增合同继续按原规则生成押金账单，不得被本次 fix 误伤。
- 首次签约规则满足：
  - 首次新增合同继续按原规则生成：
    - 多个分期租金账单
    - 1 个其他-卫生费账单
    - 1 个其他-钥匙押金账单
    - 1 个押金账单
- 工程校验层满足：
  - `npm run lint` 通过。
  - `npm run type-check` 通过。
  - 至少完成一轮人工复核：
    - 合同详情页 -> 续租页预览
    - 续租提交后的新合同账单列表
    - 合同详情页“生成账单”对同一续租合同的二次验证
    - 首次新增合同创建页账单预览和创建后账单结果

## 9. 回滚条件
- 若修复后首次新增合同也不再生成押金账单，应立即停止并回滚。
- 若仅修复了续租自动出账，但手工“生成账单”仍会为续租合同补出押金账单或钥匙押金账单，应停止并回滚。
- 若续租页和后端规则不一致，例如页面预览不显示押金/钥匙押金，但后端仍自动生成这两类账单，应停止并回滚。
- 若历史账单处理采用批量硬删，破坏既有账务历史可追溯性，应停止并回滚。

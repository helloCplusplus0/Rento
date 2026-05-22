# Fix 001 合同支付周期与账单生成对齐 Spec

## Why
真实场景验证发现：合同创建页的账单预展示与实际落库账单不一致，`半年付` 被错误拆成 `12` 条月租账单。该问题不是单点展示偏差，而是合同支付周期在前端预展示、后端生成、续租与补账单路径上的真相源断裂，必须先收口共享逻辑再实施修复。

## What Changes
- 新增统一的合同支付周期标准化能力，兼容中文值和历史英文值，并输出单一内部周期口径
- 统一租金账单的账期切分与每期金额计算，供前端预展示与后端生成共享复用
- 修改合同创建、续租、手工重新生成账单、缺失租金账单补齐路径，全部使用同一套周期逻辑
- 增加历史错误账单识别与安全修复边界，只允许对未支付且无收款历史的错误 RENT 账单执行自动修复
- **BREAKING** 不再允许各处自行解释 `Contract.paymentMethod` 的支付周期语义；支付周期生成主链必须统一走共享工具

## Impact
- Affected specs:
  - 合同创建账单预展示
  - 合同签订后的自动账单生成
  - 续租后的自动账单生成
  - 手工重新生成账单
  - 缺失租金账单补齐
  - 历史错误 RENT 账单识别与安全修复
- Affected code:
  - `src/components/business/ContractBillPreview.tsx`
  - `src/lib/auto-bill-generator.ts`
  - `src/app/api/contracts/route.ts`
  - `src/app/api/contracts/[id]/renew/route.ts`
  - `src/app/api/contracts/[id]/generate-bills/route.ts`
  - `src/lib/bill-calculations.ts`
  - `prisma/schema.prisma`（仅影响理解与兼容读取，不在本次 fix 中迁移 schema）

## ADDED Requirements
### Requirement: Unified Contract Payment Cycle
系统 SHALL 提供统一的合同支付周期标准化能力，兼容 `月付/季付/半年付/年付` 与历史英文值，并输出单一内部周期值用于账单生成。

#### Scenario: Normalize Chinese payment method
- **WHEN** 合同记录中的 `paymentMethod` 为 `半年付`
- **THEN** 系统返回统一内部周期值 `SEMI_YEARLY`

#### Scenario: Normalize historical English payment method
- **WHEN** 合同记录中的 `paymentMethod` 为 `semi_annually`、`SEMI_YEARLY` 或语义等价历史值
- **THEN** 系统返回统一内部周期值 `SEMI_YEARLY`

### Requirement: Shared Rent Bill Calculation
系统 SHALL 使用同一套租金账期切分与每期金额计算逻辑，供前端预展示、合同创建、续租、手工重新生成账单和缺失账单补齐复用。

#### Scenario: Preview matches persisted bills
- **WHEN** 用户创建一个 `12` 个月、`半年付` 的合同
- **THEN** 预展示必须显示 `2` 条 RENT 账单
- **AND** 实际落库也必须生成 `2` 条 RENT 账单
- **AND** 每条金额必须等于 `monthlyRent * 6`

#### Scenario: Renew path uses shared cycle logic
- **WHEN** 用户续租合同且支付方式为 `季付`
- **THEN** 续租后的自动生成 RENT 账单必须按 `3` 个月一期切分
- **AND** 不得与创建合同路径产生不同账期数量或金额

### Requirement: Safe Historical Repair Boundary
系统 SHALL 对历史错误 RENT 账单提供识别规则，并将自动修复严格限制在安全范围内。

#### Scenario: Identify auto-fixable erroneous bills
- **WHEN** 合同 `paymentMethod` 为 `季付`、`半年付` 或 `年付`
- **AND** 现有 RENT 账单条数或金额与理论周期不匹配
- **AND** 这些 RENT 账单全部为 `PENDING`
- **AND** `receivedAmount = 0`
- **THEN** 系统允许把该合同标记为“可自动修复”

#### Scenario: Paid historical bills are not auto-rewritten
- **WHEN** 历史错误 RENT 账单已支付、部分支付、已完成或存在人工修改痕迹
- **THEN** 系统只输出审计清单
- **AND** 不自动批量重写这些账单

## MODIFIED Requirements
### Requirement: Contract Bill Preview
合同创建页的账单预展示必须与服务端最终账单生成逻辑保持一致，禁止继续维护独立的支付周期解释与账期切分实现。

### Requirement: Contract Payment Method Usage
`Contract.paymentMethod` 在本次 fix 中继续作为存量兼容输入字段保留，但涉及支付周期的生成逻辑必须先标准化后使用，禁止直接把原始值传入账期计算函数。

### Requirement: Bill Generation Entry Points
所有复用 RENT 账单生成能力的入口，包括合同创建、续租、手工重新生成账单与缺失账单补齐，都必须通过共享的支付周期与账单计算真相源生成结果。

## REMOVED Requirements
### Requirement: Independent Cycle Parsing Per Entry
**Reason**: 前端预展示、后端生成、缺失账单补齐分别维护自己的周期解释逻辑，已经造成真实账单错误，必须移除这种多真相源模式。  
**Migration**: 将各入口的周期解释与账单计算逐步收口到统一工具，仅保留兼容输入解析，不再允许入口私自定义周期值域。

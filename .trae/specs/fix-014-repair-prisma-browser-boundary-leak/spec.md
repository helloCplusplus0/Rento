# 修复前端 Prisma 浏览器边界泄漏 Spec

## Why
真实云服务器部署后的 `Rento-miniX` 在访问根路径时出现首页白屏，浏览器控制台报出 `.prisma/client/index-browser` 相关错误。问题根因不是部署链失效，而是前端浏览器包误把服务端 Prisma 账务域模块带入客户端依赖图，必须通过源码层 shared/server 边界收口来系统修复。

## What Changes
- 拆分账务展示共享语义与服务端账务领域模块，禁止前端运行时通过兼容包装层触达 Prisma
- 重构退租结算共享逻辑，使其只依赖 shared DTO 与 shared 账务语义，不再依赖 Prisma 类型或服务端实现
- 清理前端可达链路中的 Prisma 类型直连，收口面向客户端的 DTO / view-model 类型边界
- 评估并收口路由首包装载边界，确保首页启动不再因账单或退租模块污染而白屏
- 补齐构建与浏览器验证，确认首页、账单页和退租页不再触发 Prisma 浏览器依赖错误

## Impact
- Affected specs:
  - 前端运行时边界
  - 账单展示共享语义
  - 退租结算共享逻辑
  - 客户端共享类型边界
  - 路由首包装载安全性
- Affected code:
  - `src/lib/bill-semantics.ts`
  - `src/lib/domain/billing/index.ts`
  - `src/lib/checkout-settlement.ts`
  - `src/types/database.ts`
  - `src/components/pages/BillListPage.tsx`
  - `src/components/pages/CheckoutContractPage.tsx`
  - `src/minix/router/index.tsx`

## ADDED Requirements
### Requirement: 浏览器包不得包含 Prisma 服务端运行时
系统必须保证前端浏览器运行时不会通过共享模块、兼容包装层或页面依赖链触达 `@prisma/client`、Prisma 单例或事务层。

#### Scenario: 首页启动不再触发 Prisma 浏览器错误
- **WHEN** 用户访问 `/`
- **THEN** 前端应用必须正常启动
- **AND** 浏览器控制台不得出现 `.prisma/client/index-browser` 相关报错

#### Scenario: 客户端页面复用共享语义
- **WHEN** 客户端页面复用账单展示语义或退租结算逻辑
- **THEN** 这些共享逻辑必须只依赖 shared DTO、shared enum 与纯函数
- **AND** 不得运行时依赖 Prisma 领域服务实现

### Requirement: 账务 shared 与 server-only 边界必须分离
系统必须把前端可复用的账单展示语义与服务端账务领域服务拆分为独立边界。

#### Scenario: 账单展示语义供前端使用
- **WHEN** `BillListPage`、账单统计或其他客户端页面导入账单展示能力
- **THEN** 导入源必须是纯 shared 账单语义模块
- **AND** 不得通过兼容包装层间接导入 `src/lib/domain/billing/index.ts`

#### Scenario: 服务端账务域继续承接正式真相
- **WHEN** 服务端需要执行账务写事务、删除门禁或数据库查询
- **THEN** 继续由服务端账务域模块承接正式真相
- **AND** 前端运行时不得直接消费该模块

### Requirement: 退租结算共享逻辑不得依赖 Prisma 类型
系统必须让退租结算预览与提交前校验逻辑只依赖前端可运行的数据结构，而不是 Prisma 生成类型。

#### Scenario: 退租页加载与结算预览
- **WHEN** 用户访问 `/contracts/:id/checkout`
- **THEN** 页面必须正常渲染并展示结算预览
- **AND** 结算逻辑不得通过 `@prisma/client` 类型或账务服务端实现触发浏览器运行时错误

### Requirement: 首包不受非当前页面模块污染
系统必须确保首页启动不会因为账单页、退租页或其他高风险模块的错误依赖链而整体崩溃。

#### Scenario: 路由首包装载
- **WHEN** 前端路由初始化并装载首页运行时
- **THEN** 首页首包不得被 server-only 模块污染
- **AND** 即使账单页与退租页存在共享逻辑，也不得阻断根路径访问

## MODIFIED Requirements
### Requirement: 账单展示共享语义
账单展示共享语义不再允许通过 `bill-semantics` 兼容包装层运行时转导服务端账务域模块，而必须显式收口为前端可运行的纯 shared 账单语义能力；服务端账务真相仍由 `src/lib/domain/billing/index.ts` 承担，但只能在服务端消费。

### Requirement: 客户端共享类型边界
客户端页面、组件与路由可达模块不再直接依赖 `@prisma/client` 生成类型，而必须使用面向前端的 DTO / view-model 类型，确保浏览器构建图与 Prisma 生成产物解耦。

## REMOVED Requirements
### Requirement: `bill-semantics` 作为账务域 compat 运行时转导层
**Reason**: 当前实现把服务端账务域模块直接暴露给前端页面，是导致 Prisma 进入浏览器依赖图的核心原因。
**Migration**: 将前端可复用能力拆到纯 shared 模块，服务端继续直接依赖 `src/lib/domain/billing/index.ts`，不再允许客户端运行时通过 compat wrapper 间接转导。

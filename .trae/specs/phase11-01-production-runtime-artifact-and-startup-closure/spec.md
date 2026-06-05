# Phase11-01 生产运行时产物与启动收口 Spec

## Why
当前 `Rento-miniX` 已具备 `Vite + Hono` 的新运行时承接位，但正式生产入口仍通过 `tsx server/index.ts` 直接运行 TypeScript 源码，`build:minix` 也只覆盖前端 `dist/`。这与项目已冻结的“云端不构建、只运行预构建产物”部署底线不一致，因此需要先把服务端预构建产物链、联合构建命令与正式启动入口收口清楚。

## What Changes
- 冻结 `build:minix`、`start:minix`、`dev:minix` 在开发态与生产态的职责边界
- 为 Hono Node 运行时补齐服务端预构建产物链的需求定义
- 将正式生产启动入口从“直接运行源码”改为“运行已编译的服务端产物”
- 明确 `scripts/start-minix.mjs`、`server/index.ts`、`server/app.ts`、`server/lib/static.ts` 与 `tsconfig` 的承接关系
- 明确本任务不新增 `Caddy` / `systemd` 配置、不切换最终部署主线、不调整业务 API 与领域语义

## Impact
- Affected specs:
  - `phase11-deployment-cutover-and-cutline-closure`
  - `phase11-01-production-runtime-artifact-and-startup-closure`
- Affected code:
  - `package.json`
  - `scripts/start-minix.mjs`
  - `scripts/dev-minix.mjs`
  - `server/index.ts`
  - `server/app.ts`
  - `server/lib/static.ts`
  - `tsconfig.json`
  - 可能新增独立的服务端构建配置文件，例如 `tsconfig.minix-server.json`

## ADDED Requirements
### Requirement: 生产运行时必须具备预构建服务端产物链
系统 SHALL 为 `Rento-miniX` 的 Hono Node 运行时提供可复现、可解释的服务端预构建产物链，使正式生产部署不再依赖 `tsx` 直接运行 TypeScript 源码。

#### Scenario: 生产构建成功
- **WHEN** 维护者执行正式构建命令
- **THEN** 前端 `dist/` 与服务端运行产物都会被一并生成
- **AND** 服务端产物可被正式生产启动入口直接消费

#### Scenario: 生产启动成功
- **WHEN** 维护者执行 `npm run start:minix`
- **THEN** 启动入口读取已构建的前端与服务端产物
- **AND** 不再通过 `npx tsx server/index.ts` 直接运行源码

### Requirement: 开发态与生产态脚本职责必须分离
系统 SHALL 明确 `dev:minix` 与 `start:minix` 的职责边界：开发态允许继续使用 `tsx watch` 与 Vite 双进程拓扑，生产态只允许运行预构建产物。

#### Scenario: 开发态保持现有拓扑
- **WHEN** 开发者执行 `npm run dev:minix`
- **THEN** 仍可使用 `tsx watch` 启动 Hono 开发运行时
- **AND** 仍可使用 Vite 提供前端开发服务器
- **AND** 该行为不会被误读为正式部署入口

#### Scenario: 生产态拒绝源码运行口径
- **WHEN** 维护者审阅生产启动脚本与部署文档
- **THEN** 能明确区分开发态源码运行与生产态预构建运行
- **AND** 不存在“文档宣称预构建、脚本实际跑源码”的冲突

### Requirement: 正式启动入口必须沿用现有 Hono 运行时承接位
系统 SHALL 在不改写业务 API、领域服务与静态壳语义的前提下，继续以 `server/index.ts`、`server/app.ts` 与 `server/lib/static.ts` 作为生产运行时的正式承接位。

#### Scenario: 运行时职责保持稳定
- **WHEN** 正式启动入口切换到服务端预构建产物
- **THEN** 仍由同一套 Hono 运行时承接 `/api/*`
- **AND** 仍由同一套静态壳逻辑承接 `dist/` 与 SPA fallback
- **AND** 不引入新的业务 API 宿主或第二套静态资源真相源

## MODIFIED Requirements
### Requirement: `build:minix` 必须代表正式联合构建入口
`build:minix` 不再只表示前端 `vite build`，而必须完整表达 `Rento-miniX` 正式生产启动所需的联合构建过程，至少覆盖前端静态产物与服务端运行产物两部分。

#### Scenario: 脚本语义与部署底线一致
- **WHEN** 维护者查看 `package.json` 中的 `build:minix`
- **THEN** 能从脚本定义直接看出该命令服务于正式生产启动
- **AND** 该命令与“云端不构建、只运行预构建产物”的部署底线保持一致

### Requirement: `start:minix` 必须代表正式生产启动入口
`start:minix` 不再允许依赖 `tsx` 直接执行 `server/index.ts` 源码，而必须以已构建的服务端运行产物为唯一正式启动入口。

#### Scenario: 启动语义明确
- **WHEN** 维护者查看 `package.json` 与 `scripts/start-minix.mjs`
- **THEN** 能确认 `start:minix` 是正式生产入口
- **AND** 不会把开发态源码运行方式误用为生产启动方式

## REMOVED Requirements
### Requirement: 生产启动允许直接运行 TypeScript 源码
**Reason**: 该做法与项目已冻结的“云端不构建、只运行预构建产物”部署底线冲突，也会让生产脚本与部署文档产生双重语义。
**Migration**: 将 `start:minix` 与相关脚本切换到已编译服务端产物；保留 `dev:minix` 继续承担开发态 `tsx watch` 职责。

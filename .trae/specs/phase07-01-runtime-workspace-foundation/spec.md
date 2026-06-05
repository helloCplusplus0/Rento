# Runtime Workspace Foundation Spec

## Why
当前仓库仍以 `Next.js App Router` 作为唯一前后端宿主，`Rento-miniX` 虽已冻结 `Hono + Vite + React Router` 方向，但还没有正式的前端壳目录、服务端运行时目录与对应脚本入口。若不先建立这层基础工作区，后续 `phase07` 子任务仍会被迫继续挂靠在旧 `src/app` 与 `src/app/api/*` 上，无法形成新的正式承接位。

## What Changes
- 新建前端应用壳承接位：`src/minix/`
- 新建服务端运行时承接位：`server/`
- 新建 `vite.config.ts` 与 `index.html`，固定新前端壳的开发与构建入口
- 在 `package.json` 中新增 `dev:minix`、`build:minix`、`start:minix` 脚本
- 固定开发态 `Vite` 前端服务到 `Hono` 运行时的双服务代理方式
- 固定 `@/*` 路径别名与 TypeScript 基线，使旧资产和新壳可在同仓共享导入口径
- 不迁移正式业务页面、正式业务 API、完整认证门禁或最终部署主线

## Impact
- Affected specs: `phase07` 应用壳基础、运行时基础、开发脚本、目录结构、路径别名、开发态代理
- Affected code: `package.json`、`tsconfig.json`、`vite.config.ts`、`index.html`、`src/minix/*`、`server/*`、`scripts/dev-minix.mjs`、`scripts/start-minix.mjs`

## ADDED Requirements
### Requirement: 新主线工作区必须有正式目录落点
系统 SHALL 为 `Rento-miniX` 新主线提供独立于旧 `Next.js` 宿主的正式目录落点，至少包括 `src/minix/` 前端壳目录与 `server/` 运行时目录。

#### Scenario: 用户查看仓库结构
- **WHEN** 用户查看仓库根目录与 `src/` 目录
- **THEN** 用户应能看到 `src/minix/` 作为新前端壳正式承接位
- **AND** 用户应能看到 `server/` 作为 `Hono + @hono/node-server` 正式承接位
- **AND** 用户不需要再把后续新主线文件继续塞入 `src/app` 或 `src/app/api/*`

### Requirement: 新主线必须有独立脚本入口
系统 SHALL 在保留现有 `npm run dev`、`npm run build`、`npm run start` 服务旧宿主的前提下，为新主线补充独立脚本入口：`dev:minix`、`build:minix`、`start:minix`。

#### Scenario: 用户查看运行脚本
- **WHEN** 用户阅读 `package.json`
- **THEN** 用户应能区分旧 `Next.js` 宿主脚本与新主线脚本
- **AND** 用户应能直接知道开发态、构建态和运行态分别应使用哪个 `minix` 脚本
- **AND** 旧脚本不应因本次子任务而失效或被错误替换

### Requirement: 开发态必须固定为双服务代理
系统 SHALL 在本阶段固定开发态为 `Vite` 前端服务与 `Hono` 运行时服务分离运行，并由前端通过代理访问后端接口。

#### Scenario: 用户查看开发拓扑
- **WHEN** 用户查看 `vite.config.ts`、脚本说明或相关工作区文件
- **THEN** 用户应能确认前端由 `Vite` 承载
- **AND** 用户应能确认 `/api/*` 请求被代理到 `Hono` 运行时
- **AND** 用户应能理解当前阶段不是单进程混合宿主，也不是直接切换最终部署主线

### Requirement: 新前端壳必须具备最小入口骨架
系统 SHALL 为新前端壳提供最小可扩展入口骨架，至少包括 `index.html`、`src/minix/main.tsx`、`src/minix/App.tsx` 与路由入口目录。

#### Scenario: 用户查看新前端壳入口
- **WHEN** 用户打开 `index.html` 与 `src/minix/`
- **THEN** 用户应能识别浏览器挂载点、React 启动入口与路由承接位
- **AND** 用户应能理解后续页面壳、导航壳和路由骨架将挂接到该结构

### Requirement: TypeScript 基线必须兼容旧资产与新壳共享
系统 SHALL 继续保留统一的 `@/*` 路径别名，并补齐新壳所需的 TypeScript/Vite 类型基线，使旧资产与新主线承接位能在同仓共享导入口径。

#### Scenario: 用户查看 TypeScript 配置
- **WHEN** 用户阅读 `tsconfig.json` 与 `vite.config.ts`
- **THEN** 用户应能确认 `@/*` 仍指向 `src/*`
- **AND** 用户应能确认新前端壳具备 `vite/client` 等最小类型支持
- **AND** 用户不需要为 `src/minix/` 再引入第二套路径别名体系

## MODIFIED Requirements
### Requirement: `phase07` 的运行入口表达
`phase07` 的运行入口表达修改为：旧 `Next.js` 宿主继续通过 `dev`、`build`、`start` 保留为参考基线与存量运行线；新主线通过 `dev:minix`、`build:minix`、`start:minix` 获得独立入口表达。

#### Scenario: 用户判断当前默认运行线与新主线关系
- **WHEN** 用户查看脚本与工作区结构
- **THEN** 用户应能区分“旧宿主仍可运行”和“新主线已有正式承接位”是同时成立的
- **AND** 用户不应把本子任务误解为已经完成主入口切换

### Requirement: `phase07` 的前后端承接位
`phase07` 的前后端承接位修改为：新前端壳默认承接到 `src/minix/`，新服务端运行时默认承接到 `server/`，旧 `src/app` 与 `src/app/api/*` 在当前阶段继续保留为参考基线与存量运行线。

#### Scenario: 用户判断后续实现应该放在哪
- **WHEN** 用户准备继续执行 `phase07-02` 或 `phase07-03`
- **THEN** 用户应能明确新壳相关文件优先进入 `src/minix/`
- **AND** 用户应能明确新运行时相关文件优先进入 `server/`
- **AND** 用户不应继续把新主线承接代码默认写回旧宿主目录

## REMOVED Requirements
### Requirement: 新主线继续默认复用旧 `src/app` 与 `src/app/api/*` 作为唯一正式承接位
**Reason**: 该要求会让 `phase07` 的后续实现继续依附旧 `Next.js` 宿主，无法形成 `Rento-miniX` 的正式应用壳与运行时落点。
**Migration**: 后续新前端壳代码迁入 `src/minix/`，新运行时代码迁入 `server/`；旧宿主仅保留为参考基线与存量运行线，是否退出留待 `phase07-04` 判断。

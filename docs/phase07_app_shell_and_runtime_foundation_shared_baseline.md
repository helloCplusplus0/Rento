# Phase07 App Shell And Runtime Foundation Shared Baseline

## 一、文档目的
本文档用于冻结 `phase07-app-shell-and-runtime-foundation` 全部子任务共享的边界、允许路线、禁止路线与统一判断标准，避免后续 `phase07` 子任务各自扩写出不同解释。

## 二、共享前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成当前轮文档治理收口
- 当前完整 `Hono` 版 Phase 路线图已冻结到根级 `plan.md`
- 当前仓库逻辑主线已切换为 `Rento-miniX`
- 当前旧实现代码仍是后续原地重构的直接参考基线

## 三、共享判断标准
- 默认优先建立新的应用壳与运行时承接位，而不是先迁移高风险业务逻辑
- 默认优先继续承接既有 UI 展示效果、页面信息架构与业务主链语义
- 默认优先低复杂度、单仓库、单主线、单一真相源
- 默认优先把 `React Router`、双服务代理和并行壳切入策略先固定，再进入实现
- 默认优先保住 `Prisma + PostgreSQL` 主线，而不是在本阶段引入 ORM 再决策

## 四、允许路线
- 允许建立 `src/minix/` 作为新前端壳承接位
- 允许建立 `server/` 作为 `Hono + @hono/node-server` 的新运行时承接位
- 允许承接 `AppLayout`、导航壳、路由元数据与辅助页面治理口径
- 允许承接 `/api/health` 与相关运行时健康检查逻辑
- 允许在开发态使用 `Vite + Hono` 双服务代理
- 允许新增 `dev:minix`、`build:minix`、`start:minix` 等新主线脚本
- 允许在文档中写清旧 `Next.js` 宿主的并行保留边界与退出条件

## 五、禁止路线
- 禁止在 `phase07` 中直接迁移合同、账单、房源、租客、仪表、抄表等正式业务 API
- 禁止在 `phase07` 中直接迁移完整认证 API 与完整会话门禁
- 禁止在 `phase07` 中切换最终部署主线
- 禁止在 `phase07` 中切换 ORM 或重写数据模型
- 禁止以“技术迁移”为由大改当前 UI 风格、布局体系或设计语言
- 禁止让 `src/minix/` 与 `server/` 成为新的灰色真相源而不写清与旧宿主的关系

## 六、统一方案语义
- 新前端壳固定为：`Vite + React + React Router`
- 新服务端运行时固定为：`Hono + @hono/node-server`
- 当前开发拓扑固定为：`Vite` 前端开发服务 + `Hono` 运行时服务的双服务代理
- 当前切入方式固定为：先并行壳，后切换
- 当前数据访问主线继续固定为：`Prisma + PostgreSQL`
- 当前 `Next.js` 宿主继续保留为参考基线与存量运行线，不等同于未来正式主线

## 七、前端承接口径
- `phase07` 前端只承接：
  - 根布局
  - 主导航与基础路由骨架
  - 主导航五个正式业务路径的占位承接位
  - 登录页壳、离线页壳、404 / error / loading 基础骨架
- `phase07` 前端不承接：
  - 完整业务页面逻辑
  - 完整查询与写操作
  - 认证流程闭环
  - 领域服务迁移

## 八、服务端承接口径
- `phase07` 服务端只承接：
  - Node 入口
  - Hono app 入口
  - 基础中间件
  - `/api/health`
  - 最小环境变量读取和错误处理骨架
- `phase07` 服务端不承接：
  - 正式业务 API
  - 完整认证 API
  - 最终生产部署切线

## 九、旧运行线映射口径
- `src/app` 与 `src/app/api/*` 在 `phase07` 期间仍是参考基线和存量运行线
- `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs` 在 `phase07` 期间仍服务于旧宿主
- 新壳和新运行时只负责建立正式承接位，不在本阶段强制替换旧入口
- 后续是否切走旧宿主，必须在 `phase07-04` 明确退出条件后再做判断

## 十、统一验证要求
- 至少确认：
  - 根级文档已切换到 `phase07` 规划口径
  - `phase07` 三份阶段文档已完整产出
  - `React Router`、双服务代理、先并行壳后切换三项决策已统一冻结
  - 新前端壳目录与新运行时目录已有正式规划落点
  - 旧宿主、新宿主与后续阶段的关系已明确

## 十一、阶段停顿门禁
- `phase07` 阶段文档一旦产出完成，必须停止并等待审核
- 未经审核，不得直接进入 `phase07` 的 `/spec` 或实现
- 后续任何 `phase07` 子任务都不得绕开本共享基线重新定义新旧宿主边界或阶段范围

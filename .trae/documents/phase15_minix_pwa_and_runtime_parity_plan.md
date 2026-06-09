# Phase15 Minix PWA And Runtime Parity Plan

## Summary

* 目标是把当前仍挂在旧 `Next.js` 宿主上的 PWA 能力迁入纯 `Vite + Hono` 新主线，并保持 `phase05` 已冻结的“最小受控 PWA”语义不变。

* 本计划明确采用“延续现有手写 `manifest.json` + `sw.js` + 安装/更新提示语义”的迁移路线，而不是在本阶段引入另一套构建期缓存真相源。

* 计划完成后，纯新主线的正式承接位固定为 `src/minix/*`、`public/*`、`vite.config.ts` 与 `server/lib/static.ts`；旧 `src/app` PWA 宿主只保留对照/回滚参考价值。

## Current State Analysis

### 阶段与文档状态

* `plan.md` 已把当前默认工作流切换到 `phase15-minix-pwa-and-runtime-parity`，并明确该阶段只继承 `phase13` 页面 parity、`phase14` API/query parity 与 `phase11` 部署主线，不再承担正式业务 API 迁移职责。

* `architecture_map.md` 已冻结 `phase15` 的结构承接位为 `src/minix/*`、`public/*`、`vite.config.ts`、`server/lib/static.ts`，并要求 `phase15` 只做 PWA parity，不重开页面/API/ORM 议题。

* 仓库中当前还不存在 `docs/phase15_*` 文档；因此本轮 `/plan` 的首要目标是基于现有代码与上游阶段结论，生成 phase15 的阶段文档与顶层真相源同步方案。

### 当前 PWA 真相源

* 旧 `Next.js` PWA 宿主仍是当前真实运行位：

  * `src/app/layout.tsx`：注入 `manifest`、图标、`appleWebApp`、`themeColor`，并挂载 `PwaRuntimeManager` 与 `PwaInstallPrompt`

  * `src/components/layout/PwaRuntimeManager.tsx`：负责注册 `/sw.js`、检查更新、提示刷新

  * `src/components/layout/PwaInstallPrompt.tsx`：负责安卓原生安装提示、iOS 手动安装说明、非支持浏览器退化说明

  * `src/hooks/usePwaInstallState.ts`：负责 `beforeinstallprompt`、`appinstalled`、standalone 模式与平台判断

  * `public/manifest.json`：当前 manifest 真相源

  * `public/sw.js`：当前 service worker 真相源

* 当前 `sw.js` 已冻结了正确的缓存边界：只缓存离线页、manifest、图标与静态壳，不缓存 `/api/*`、鉴权态业务页面响应或其他动态业务真相。

### 当前新主线承接位

* 新前端入口已经在 `src/minix/main.tsx` 与 `src/minix/App.tsx`，但当前仅负责挂载 `RouterProvider`，还没有自己的 PWA runtime 层。

* 新路由真相源已在 `src/minix/router/index.tsx`，其中 `/offline` 已落位到 `src/minix/routes/OfflinePage.tsx`，说明最小离线页语义已经迁到新主线。

* `vite.config.ts` 当前只有 React 插件、别名与 `/api` 代理，尚未接入任何 PWA 构建配置。

* `server/lib/static.ts` 当前可以提供 `dist/` 静态资源与 SPA fallback，但对 `/sw.js` 与 `/manifest.json` 仍沿用通用静态缓存头，不适合作为正式 PWA 交付口径。

* `scripts/pwa-smoke-check.sh` 仍偏向旧 Next 运行线假设，但已经覆盖 `/api/health`、`/manifest.json`、`/sw.js` 与 `/offline` 这四类 phase15 关键验证点，可直接演进为新主线 smoke 脚本。

### 关键约束

* 必须保持 `phase05` 已冻结的最小受控策略：不缓存动态鉴权业务接口，不引入第二套缓存真相源，不把离线兜底扩张为业务本地真相源。

* 必须继承 `phase13` 的页面真相源与 `phase14` 的 API 真相源，不改写 `src/minix/router/index.tsx` 的正式业务页面集合，不回退到旧 `src/app/api/*`。

* 必须遵守 `phase11` 的正式部署主线：`Vite build -> dist`、`Hono -> build/minix-server`、Caddy/systemd 运行预构建产物。

## Proposed Changes

### 1. 产出 phase15 文档包并同步顶层真相源

#### `docs/phase15_minix_pwa_and_runtime_parity_architecture_plan.md`

* 写清 phase15 的唯一职责、直接继承输入、与 phase05/11/13/14 的关系、结构承接位与禁止路线。

* 明确本阶段不引入第二套前端宿主、不重开正式业务 API 迁移、不把 PWA 迁移升级为“完整离线产品”。

#### `docs/phase15_minix_pwa_and_runtime_parity_dev_plan.md`

* 按实现顺序冻结子任务，建议拆为：

  * `phase15-01` PWA 承接基线与共享语义冻结

  * `phase15-02` 新主线 manifest / html metadata / 静态托管头收口

  * `phase15-03` service worker 与更新策略迁移

  * `phase15-04` 安装提示、更新提示、离线页与 root runtime 挂载

  * `phase15-05` smoke / 浏览器验收与文档回写

* 为每个子任务写清参考来源、实施边界、验收方法与回滚条件。

#### `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md`

* 继承 `phase05` 的支持矩阵、退化策略、缓存边界、安装/更新原则。

* 明确 phase15 的新增共享词汇：`minix-pwa-runtime`、`static-shell-cache`、`offline-fallback-only`、`legacy-next-pwa-reference`。

* 明确与 `phase16` 的交接内容：PWA 验收清单、运行头策略、安装/更新/离线验证记录。

#### 顶层文档同步

* 同步更新：

  * `README.md`

  * `AGENTS.md`

  * `project_rules.md`

  * `architecture_map.md`

  * `plan.md`

  * `DEPLOYMENT.md`

  * `.env.example`

* 更新内容包括：

  * 当前默认入口切到 `phase15`

  * `phase14` 已完成、`phase15` 正在冻结/实施 PWA parity

  * 新的 PWA 主变量、产物链与 smoke 路径

  * 旧 Next PWA 宿主只作为参考/回滚基线而非正式交付入口

### 2. 选择并冻结 PWA 实现路线

#### 决策

* 本阶段采用“保留手写 `public/manifest.json` + 手写 `public/sw.js` + 运行时手动注册”的方案。

* 不在 phase15 默认引入 `vite-plugin-pwa` 作为正式主方案。

#### 原因

* 当前仓库已经存在可解释且经过 `phase05` 收口的 `manifest`、`sw.js`、安装提示与更新提示原型。

* 项目治理规则强调低复杂度、单真相源、最小适配；引入插件会新增一层 Workbox/插件配置真相源，增加迁移面。

* 最新文档已确认：

  * Vite `public/` 目录会原样复制到 `dist/` 根目录，适合继续承接 `manifest.json` 与 `sw.js`

  * Hono 在 Node.js 下可稳定承接静态文件，但静态头需要我们自行精确控制

  * `vite-plugin-pwa` 可作为备选参考，但会引入额外虚拟模块与 `workbox-window` 依赖，不适合作为本阶段默认路线

#### 备选保留

* 若在实施中证明手写方案无法满足更新策略、注册稳定性或发布门禁，再单独升级为“引入 `vite-plugin-pwa`”的架构议题；不在本计划中默认展开。

### 3. 新主线根运行时挂载

#### `src/minix/router/index.tsx`

* 增加一个 pathless 顶层 runtime 包装层，统一承接：

  * `PwaRuntimeManager`

  * `PwaInstallPrompt`

  * 后续可能需要的离线 ready / 更新提示 UI

* 保持现有正式业务路由路径不变，只做最小包装，不改动 `phase13` 已冻结的业务入口集合与 loader/error 边界。

#### 新增 `src/minix/layout/MinixRuntimeLayout.tsx`

* 用 `Outlet` 包裹所有现有顶层路由。

* 在该层中基于 React Router 的 `useLocation()` 提供当前 pathname 给 PWA UI，避免继续依赖 `next/navigation`。

* 该层只承接运行时增强，不承接业务页面壳与导航逻辑，防止与 `MinixShellLayout` 职责混写。

#### `src/minix/App.tsx`

* 将当前仅有的 `RouterProvider` 包装为新主线根应用壳。

* 补挂 `AlertManagerProvider`，使运行时增强与现有布局/provider 关系单一可解释。

* 不在 `main.tsx` 直接硬编码 PWA 注册逻辑，保持入口文件只负责挂载应用。

### 4. 抽离 host-agnostic PWA 运行时组件

#### 新增 `src/components/pwa/PwaRuntimeManager.tsx`

* 以当前 `src/components/layout/PwaRuntimeManager.tsx` 为直接参考原型，抽离为宿主无关实现。

* 改为通过 props 接收：

  * `enabled`

  * `pathname`（仅在需要时）

  * 可选 `serviceWorkerPath`

* 保持现有关键行为不变：

  * 只在生产环境、受控开关开启、且 secure context 下注册

  * 使用 `/sw.js`、scope `/`

  * `controllerchange` 后自动刷新

  * `updatefound` / `waiting` 时显示“发现新版本”提示

  * 用户点击后发送 `SKIP_WAITING`

#### 新增 `src/components/pwa/PwaInstallPrompt.tsx`

* 以当前 `src/components/layout/PwaInstallPrompt.tsx` 为原型，抽离掉 `next/navigation` 依赖，改为通过 props 接收 `pathname`。

* 保留三种展示语义：

  * `installable`

  * `manual-ios`

  * `unsupported`

* 保留现有本地存储 dismiss 行为与 `/offline` 不展示规则。

#### 新增 `src/components/pwa/usePwaInstallState.ts`

* 从现有 `src/hooks/usePwaInstallState.ts` 提取为共享实现，供 Next 包装层与 Minix 包装层共用。

* 逻辑保持不变：standalone 检测、`beforeinstallprompt`、`appinstalled`、平台识别、iOS Safari 手动安装退化。

#### 兼容包装

* `src/components/layout/PwaRuntimeManager.tsx`

* `src/components/layout/PwaInstallPrompt.tsx`

* `src/hooks/usePwaInstallState.ts`

* 这些旧路径改为薄包装或转发层，继续服务旧 Next 宿主，避免 phase15 直接破坏 legacy 对照线。

### 5. 新主线 PWA 开关与 metadata 口径

#### `.env.example`

* 新增 `VITE_ENABLE_PWA=false` 作为 Minix 新主线的正式前端开关变量。

* 继续保留 `NEXT_PUBLIC_ENABLE_PWA` 仅作为 legacy Next PWA 兼容输入说明，不再作为新主线主真相源。

#### `index.html`

* 增加纯 Vite 主线所需的静态 metadata：

  * `<link rel="manifest" href="/manifest.json">`

  * `<meta name="theme-color" content="#3b82f6">`

  * `<meta name="mobile-web-app-capable" content="yes">`

  * 必要的 icon / apple touch icon 引用

* 保持与当前 `manifest.json`、旧 Next metadata 的应用名、主题色、图标口径一致。

#### `src/minix/layout/MinixRuntimeLayout.tsx` 或同层封装

* Minix 包装层通过 `import.meta.env.VITE_ENABLE_PWA` 读取开关。

* 仅当 `NODE_ENV=production` 且开关启用时注册 service worker；开发态维持 phase05 已冻结的“默认不注册 SW”原则。

### 6. 收口静态资源与 service worker 头策略

#### `public/manifest.json`

* 延续现有文件名与图标清单，避免破坏安装入口。

* 复核字段与纯新主线一致：

  * `name`

  * `short_name`

  * `start_url`

  * `scope`

  * `display`

  * `theme_color`

  * maskable 图标

* 若需调整，仅允许做与新主线运行一致性直接相关的最小更新，不做视觉重设计。

#### `public/sw.js`

* 以现有脚本为基线，迁掉 Next 时代特定判断，补足 Vite 时代静态资产规则：

  * 保留 `/api/` 不缓存

  * 保留离线回退 `/offline`

  * 保留最小静态壳缓存

  * 新增/确认 `/assets/` 构建产物路径的静态缓存识别

  * 去除仅为 Next RSC/预取服务的特殊判断，除非它们仍对 legacy 兼容必要

* 继续维持“缓存什么 / 不缓存什么 / 何时更新 / 何时失效 / 如何回滚”可解释。

#### `server/lib/static.ts`

* 为纯 Hono 静态托管补足 PWA 关键头：

  * `index.html`：`no-cache`

  * `manifest.json`：`no-cache`

  * `sw.js`：`no-cache, no-store, must-revalidate`

  * `sw.js`：`Service-Worker-Allowed: /`

  * 其他静态资源：继续长缓存 immutable

* 为 `manifest.json` 提供更准确的 `content-type`：`application/manifest+json; charset=utf-8`

* 保持 SPA fallback 逻辑不变，避免影响 `phase13` 页面入口。

### 7. 运行时验证与 smoke 收口

#### `scripts/pwa-smoke-check.sh`

* 更新默认基址推导与输出文案，使其明确适配 Minix 新主线。

* 校验项固定为：

  * `/api/health` 可访问

  * `/manifest.json` 可访问且包含 name/icons/192/512

  * `/sw.js` 返回 200，且具备 `Cache-Control` 与 `Service-Worker-Allowed: /`

  * `/offline` 可访问

* 保留 HTTPS / localhost 约束，不把本地 smoke 混写成正式安卓真机验收结论。

#### 文档验收记录

* `docs/phase15_*` 与顶层真相源中写清：

  * 本地 smoke 只是工程最小验证

  * 正式浏览器/PWA 验收仍需至少一条 Android + Chrome + HTTPS 的安装、更新、离线兜底路径

  * iOS 只保留最小安装说明，不作为本阶段正式承诺安装平台

## Assumptions & Decisions

* 决策 1：phase15 默认不引入 `vite-plugin-pwa`，继续使用手写 `public/sw.js` 与运行时注册策略。

* 决策 2：Minix 新主线的正式 PWA 开关变量为 `VITE_ENABLE_PWA`；`NEXT_PUBLIC_ENABLE_PWA` 仅保留给 legacy 宿主兼容。

* 决策 3：PWA runtime UI 通过 pathless runtime layout 全局挂载，而不是塞进单个业务页面或 `main.tsx`。

* 决策 4：旧 Next PWA 路径在 phase15 不立即删除，只降级为参考/兼容包装；真正退出由 `phase16` 决定。

* 假设 1：当前图标与 `public/manifest.json` 已满足 phase15 所需的最小安装外观要求，无需新增图片资产。

* 假设 2：当前 `public/sw.js` 的最小缓存模型足够作为新主线基线，只需要做 Vite/Hono 路径和头策略适配，不需要升级为完整离线应用。

## Verification Steps

### 文档验证

* 复核 `docs/phase15_*` 三份文档互链完整。

* 复核 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md`、`DEPLOYMENT.md` 与 `docs/phase15_*` 状态一致。

* 复核被引用路径真实存在：

  * `src/minix/*`

  * `public/manifest.json`

  * `public/sw.js`

  * `vite.config.ts`

  * `server/lib/static.ts`

  * `scripts/pwa-smoke-check.sh`

### 工程验证

* `npm run lint`

* `npm run type-check`

* `npm run build:minix`

### 运行时验证

* 启动纯新主线构建产物后执行：

  * `bash ./scripts/pwa-smoke-check.sh --base-url http://127.0.0.1:<MINIX_SERVER_PORT>`

* 在浏览器中验证：

  * 首次访问可正常作为普通 Web 使用

  * 启用 `VITE_ENABLE_PWA` 且生产构建后可注册 `/sw.js`

  * `/offline` 在断网兜底时可访问

  * 更新提示能在检测到 waiting worker 时出现并触发刷新

  * 不支持安装或 iOS 场景能按文档退化

### 人工 PWA 验收

* 至少一条 Android + Chrome + HTTPS 路径验证：

  * 安装提示

  * 安装后启动

  * 更新提示

  * 离线回退

  * 卸载后重新安装

* 明确记录“纯新主线验证”与“legacy 参考对照”结论，供 `phase16` 直接继承。


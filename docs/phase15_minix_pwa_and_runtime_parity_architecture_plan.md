# Phase15 Minix PWA And Runtime Parity 架构规划

## 当前状态
- `phase13` 已完成正式业务页面 `25/25` 迁移，`src/minix/*` 已成为纯新主线页面壳承接位。
- `phase14` 已完成正式业务 API/query parity，旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由。
- `phase05` 已冻结最小受控 PWA 基线：允许安装、更新、最小离线兜底与静态壳缓存；禁止缓存动态鉴权业务接口与业务真相数据。
- `phase15` 当前轮已完成阶段文档、根级真相源、运行时接线、静态头/环境变量/smoke 收口，以及当前轮工程验证、独立审核与人工验收补充；本文件继续作为 `phase16` 继承 `phase15` 结果的上游输入。

## 一、文档目标
本文档用于冻结 `phase15-minix-pwa-and-runtime-parity` 的最小实施架构，只回答以下问题：
- 纯新主线 PWA 的唯一承接位在哪里
- 旧 Next PWA 宿主在本阶段保留什么职责
- `manifest`、`service worker`、安装提示、更新提示、离线兜底与静态头如何分工
- 本阶段哪些能力明确不做

## 二、唯一职责
- 把安装、更新、最小离线页、`manifest` 与 `service worker` 交付口径迁到 `Vite + Hono` 主线。
- 保持 `phase05` 的最小受控策略，不引入第二套缓存真相源。
- 让纯新主线在不依赖旧 Next PWA 宿主的情况下，具备可解释、可验证、可回滚的最小 PWA 能力。

## 三、直接继承输入
### 3.1 来自 `phase05`
- 支持矩阵：`Android + Chrome` 优先；iOS 仅保留最小安装说明。
- 退化策略：SW 不可用时必须退化为普通 Web。
- 缓存边界：只缓存静态壳、图标、`manifest` 与最小离线页，不缓存动态业务接口。

### 3.2 来自 `phase11`
- 正式部署主线继续固定为 `Caddy + systemd + Hono + PostgreSQL`。
- 正式产物链继续固定为前端 `dist/` + 服务端 `build/minix-server/`。
- `server/lib/static.ts` 继续作为正式静态托管承接位。

### 3.3 来自 `phase13`
- 纯新主线页面入口继续固定在 `src/minix/router/index.tsx`。
- `/offline` 已在 `src/minix/routes/OfflinePage.tsx` 落位，可直接作为最小离线兜底页。

### 3.4 来自 `phase14`
- 正式业务 API/query 已迁入统一 Hono 宿主。
- `phase15` 与 `phase16` 不再承担任何正式业务 API 迁移职责。

## 四、结构承接位
### 4.1 新主线正式承接位
- `src/minix/router/index.tsx`
- `src/minix/layout/MinixRuntimeLayout.tsx`
- `src/minix/App.tsx`
- `src/components/pwa/*`
- `public/manifest.json`
- `public/sw.js`
- `index.html`
- `server/lib/static.ts`
- `scripts/pwa-smoke-check.sh`
- `.env.example`

### 4.2 legacy 参考/兼容承接位
- `src/app/layout.tsx`
- `src/components/layout/PwaRuntimeManager.tsx`
- `src/components/layout/PwaInstallPrompt.tsx`
- `src/hooks/usePwaInstallState.ts`
- `next.config.ts`

## 五、统一设计决策
### 5.1 manifest / sw 方案
- 继续使用手写 `public/manifest.json` 与手写 `public/sw.js`。
- 不在本阶段默认引入 `vite-plugin-pwa`。
- 原因：当前仓库已有可解释的最小 PWA 原型，继续手写方案最符合“单真相源 + 最小复杂度”。

### 5.2 runtime 挂载方案
- `MinixRuntimeLayout` 作为 pathless layout route 挂到 React Router 根层。
- 共享运行时组件继续收口到 `src/components/pwa/*`。
- 旧 Next 宿主只保留薄包装层，继续服务参考/回滚对照。

### 5.3 静态托管头方案
- `index.html`：`no-cache`
- `manifest.json`：`no-cache`
- `sw.js`：`no-cache, no-store, must-revalidate` + `Service-Worker-Allowed: /`
- `assets/*` 等 hash 静态资源：长缓存 immutable

### 5.4 环境变量方案
- 纯新主线正式开关：`VITE_ENABLE_PWA`
- legacy Next 兼容开关：`NEXT_PUBLIC_ENABLE_PWA`
- 二者职责必须在文档与实现中明确区分，避免再形成“双主变量”。
- `VITE_ENABLE_PWA` 在 `Minix` 中按“构建 profile”解释：切换启用/关闭态时必须重新构建 `dist/`，不能只靠重启服务时改运行环境变量。

## 六、明确不做
- 不重开页面 parity 或正式业务 API/query parity。
- 不把本阶段扩张为“完整离线应用”。
- 不缓存 `/api/*` 或登录态页面响应。
- 不删除 legacy PWA 宿主文件；退出决策留给 `phase16`。
- 不引入新的图片资产、视觉重设计或第二套路由结构。

## 七、验收判断
- 纯 `src/minix + public + server/lib/static.ts` 路径可独立承接最小受控 PWA 能力。
- `manifest`、`sw.js`、安装提示、更新提示与 `/offline` 均不再依赖旧 Next PWA 宿主。
- 缓存边界与退化路径可解释：缓存什么、不缓存什么、何时更新、何时回滚均能明确说明。
- 最终结果可被 `phase16` 直接引用为 PWA parity 上游输入。

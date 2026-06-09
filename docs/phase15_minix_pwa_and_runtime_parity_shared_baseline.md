# Phase15 Minix PWA And Runtime Parity Shared Baseline

## 当前状态
- 本文档用于冻结 `phase15` 必须共同遵守的最小 PWA/shared runtime 边界。
- 它直接继承 `phase05` 的最小受控 PWA 基线，以及 `phase11` 的正式部署主线、`phase13` 的页面 parity 结果、`phase14` 的 API/query parity 结果。

## 一、共享前提
- `phase05` 已完成：安装、更新、最小离线兜底与私有部署验收口径已冻结。
- `phase11` 已完成：正式部署主线固定为 `Caddy + systemd + Hono + PostgreSQL`。
- `phase13` 已完成：正式业务页面 `25/25` 已迁入 `src/minix`。
- `phase14` 已完成：正式业务 API/query 已迁入统一 Hono 宿主。

## 二、共享判断标准
- 默认优先渐进增强：业务首先是普通 Web，PWA 只是增强层。
- 默认优先最小 service worker、最小离线页、最小更新策略。
- 默认优先单真相源：不新增第二套缓存真相源、第二套前端宿主或第二套安装壳生成流程。
- 默认继续遵守 `phase05` 的安全边界：不缓存动态鉴权业务接口，不缓存业务真相数据。

## 三、共享输入清单
- `src/components/pwa/*`
- `src/minix/layout/MinixRuntimeLayout.tsx`
- `src/minix/router/index.tsx`
- `src/minix/routes/OfflinePage.tsx`
- `public/manifest.json`
- `public/sw.js`
- `server/lib/static.ts`
- `index.html`
- `.env.example`
- `scripts/pwa-smoke-check.sh`

## 四、统一词汇
### 4.1 minix-pwa-runtime
- 指挂载在 `src/minix` 根层的 PWA 运行时增强层。
- 只负责安装提示、更新提示、SW 注册与离线兜底，不负责业务页面壳。
- `VITE_ENABLE_PWA` 在该层按“构建 profile”解释；切换启用/关闭态需要重新构建前端产物，而不是只改服务运行环境变量。

### 4.2 static-shell-cache
- 指只缓存静态壳、图标、`manifest` 与最小离线页的缓存策略。
- 不包含 `/api/*`、鉴权态业务页面响应或其他业务真相数据。

### 4.3 offline-fallback-only
- 指离线场景只提供 `/offline` 最小兜底页，不提供本地写业务或离线数据库。

### 4.4 legacy-next-pwa-reference
- 指旧 `src/app/layout.tsx` 与旧 `src/components/layout/*` 仍保留为参考/兼容包装层。
- 它不再是纯新主线正式交付所依赖的唯一运行入口。

## 五、支持矩阵与退化策略
- 正式优先支持：`Android + Chrome`
- 次级兼容：Chromium 系浏览器
- iOS：仅保留最小安装说明，不承诺同等级安装体验
- 不支持安装或 SW 注册失败时：必须自动退化为普通 Web

## 六、缓存与更新边界
- 允许缓存：
  - `manifest.json`
  - 图标
  - `/offline`
  - `assets/*` hash 资源
- 文档壳策略：
  - `index.html` 与导航请求继续保持 `network-first + no-cache`
  - 断网或请求失败时退回 `/offline`
- Service Worker Cache 策略：
  - 允许把 `manifest.json`、图标、`/offline` 与 `assets/*` hash 资源写入 SW cache
  - 不要求把 `index.html` 文档本身写入 SW cache
- HTTP Cache / 静态头策略：
  - `index.html`：`no-cache`
  - `manifest.json`：`no-cache`
  - `sw.js`：`no-cache, no-store, must-revalidate`
  - `assets/*` hash 资源：长缓存 immutable
- 禁止缓存：
  - `/api/*`
  - 登录态业务页面响应
  - 任何可被误读为业务真相源的动态数据
- 更新策略：
  - 发现 waiting worker 时提示刷新
  - `SKIP_WAITING` 后刷新接管
  - 出现异常时可直接退回普通 Web 访问路径

## 七、最小验证要求
- 工程验证：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build:minix`
- PWA smoke：
  - `/api/health`
  - `/manifest.json`
  - `/sw.js` 头策略
  - `/offline`
- 至少一条人工浏览器验收：
  - 正式部署验收路径：
    - Android + Chrome + HTTPS 安装
    - 更新提示
    - 断网进入 `/offline`
    - 退化回普通 Web
  - 本地开发最小验收路径：
    - PC + Edge/Chrome 完成安装提示、安装成功与登录主链验证
    - 明确记录移动端 `Edge/Chrome + HTTP` 不出现安装入口属于预期退化
    - 明确记录移动端安装提示、更新与离线兜底的最终判断仍以带公认 HTTPS 证书的部署环境为准

## 八、当前轮人工验收记录
- 当前轮已补充本地人工验收结论：
  - PC + Edge/Chrome + HTTP：可看到安装提示，安装成功后登录链路正常，符合当前纯新主线 PWA 的本地开发预期。
  - 移动端 + Edge/Chrome + HTTP：本地开发环境未出现安装提示或安装入口，按既有 `Rento` 经验与浏览器安全要求，这属于预期退化而不是当前实现缺陷。
  - 移动端安装入口的正式判断继续以“部署到带公认 HTTPS 证书的环境后可见”作为前提，不以本地 HTTP 调试结果强行要求同等级表现。
- 因此，`phase15` 当前轮人工验收可接受的最小解释固定为：
  - 本地 PC 浏览器已验证安装与登录主链正常。
  - 本地移动端 HTTP 不出现安装入口不视为 blocker。
  - 后续若要验证移动端安装提示、更新与离线兜底，应在带公认 HTTPS 证书的环境中继续执行，并作为 `phase16` cutover/最终验收记录的一部分保留。

## 九、明确不做
- 不引入离线数据库、本地写入或后台同步系统。
- 不引入新的插件型 PWA 真相源作为默认正式方案。
- 不删除 legacy Next PWA 宿主；退出判断留给 `phase16`。

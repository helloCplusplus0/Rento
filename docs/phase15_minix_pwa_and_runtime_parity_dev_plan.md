# Phase15 Minix PWA And Runtime Parity 开发规划

## 当前状态
- `phase15` 是聚焦型实现阶段：范围集中在 PWA/runtime parity，不承担页面迁移或正式业务 API 迁移。
- `phase15` 当前轮已完成 `src/components/pwa/*`、`src/minix/layout/MinixRuntimeLayout.tsx`、`src/minix/router/index.tsx`、静态头、环境变量、smoke、独立审核与人工验收补充收口；本文件继续作为 `phase16` 继承 `phase15` 输出的实施记录。

## 一、文档定位
本文档用于把 `phase15` 拆成可直接实施的最小任务顺序，避免把本阶段重新做成重型分析任务。

## 二、固定顺序
```text
先补最小阶段文档与根级真相源同步
  ->
再收口共享 PWA runtime 并挂到 Minix 根层
  ->
再收口 manifest / sw.js / 静态头 / 环境变量 / smoke
  ->
最后执行 lint / type-check / build:minix / pwa smoke
```

## 三、任务拆分
## phase15-01-minimal-doc-sync-and-truth-source-alignment
### 目标
新增 `docs/phase15_*`，并把根级真相源从“phase14 已完成、准备 phase15 /plan”同步到“phase15 已进入实施”。

### 范围
- `docs/phase15_minix_pwa_and_runtime_parity_architecture_plan.md`
- `docs/phase15_minix_pwa_and_runtime_parity_dev_plan.md`
- `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md`
- `README.md`
- `AGENTS.md`
- `project_rules.md`
- `architecture_map.md`
- `plan.md`
- 必要时的 `DEPLOYMENT.md`

### DoD
- `docs/phase15_*` 三份文档存在并互链。
- 顶层真相源不再保留“phase14 等待审核 / 准备 phase15 /plan”的旧表述。

## phase15-02-runtime-layer-wiring
### 目标
把共享 PWA runtime 真相源挂入纯新主线，同时把旧 Next PWA 入口降为薄包装层。

### 范围
- `src/components/pwa/*`
- `src/components/layout/PwaRuntimeManager.tsx`
- `src/components/layout/PwaInstallPrompt.tsx`
- `src/hooks/usePwaInstallState.ts`
- `src/minix/layout/MinixRuntimeLayout.tsx`
- `src/minix/router/index.tsx`
- `src/minix/App.tsx`

### DoD
- `src/components/pwa/*` 成为唯一共享实现。
- `MinixRuntimeLayout` 已挂入根路由但不改变现有业务 URL。
- 旧 Next PWA 入口只保留包装职责。

## phase15-03-pwa-asset-and-header-closure
### 目标
让纯新主线的 `manifest`、`sw.js`、HTML 入口与 Hono 静态托管头形成单一交付口径。

### 范围
- `index.html`
- `public/manifest.json`
- `public/sw.js`
- `server/lib/static.ts`

### DoD
- `index.html` 具备最小 PWA metadata。
- `public/sw.js` 已切到 Vite/Hono 路径语义。
- `server/lib/static.ts` 对 `index.html`、`manifest.json`、`sw.js` 与 hash 资源返回正确头策略。

## phase15-04-env-and-smoke-closure
### 目标
把新主线 PWA 开关、脚本与验收口径收口为单一解释。

### 范围
- `.env.example`
- `scripts/pwa-smoke-check.sh`
- `DEPLOYMENT.md` 中与 PWA 交付直接相关的最小说明

### DoD
- `VITE_ENABLE_PWA` 已进入共享模板。
- `VITE_ENABLE_PWA` 的构建期语义已写清：切换关闭态/启用态时需要重新构建 `dist/`。
- smoke 脚本已区分 `pwa-disabled`、`runtime-only` 与 `production-ready` 三种 profile，不再把默认关闭态与正式启用态混写。

## phase15-05-verification-and-hand-off
### 目标
完成本阶段最低工程验证，并把结果回写到 todo 与最终说明。

### 验证命令
- `npm run lint`
- `npm run type-check`
- `npm run build:minix`
- `bash ./scripts/pwa-smoke-check.sh --profile pwa-disabled --base-url <runtime-url>`
- `npm run build:minix:pwa`
- `bash ./scripts/pwa-smoke-check.sh --profile runtime-only --base-url <runtime-url>`

### DoD
- 验证命令通过，或明确记录阻塞点与原因。
- 产物可被 `phase16` 直接引用。

## 四、参考来源
- `docs/phase05_pwa_delivery_shared_baseline.md`
- `src/app/layout.tsx`
- `src/components/layout/PwaRuntimeManager.tsx`
- `src/components/layout/PwaInstallPrompt.tsx`
- `src/hooks/usePwaInstallState.ts`
- `src/components/pwa/*`
- `src/minix/router/index.tsx`
- `src/minix/routes/OfflinePage.tsx`
- `public/manifest.json`
- `public/sw.js`
- `server/lib/static.ts`
- `scripts/pwa-smoke-check.sh`

## 五、禁止越界项
- 不新增正式业务 API 路由迁移。
- 不修改 `phase13` 已冻结的业务页面集合与页面语义。
- 不把 PWA 迁移升级为离线数据库/离线写入方案。
- 不删除 legacy PWA 入口文件。

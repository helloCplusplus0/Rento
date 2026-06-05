# Phase08-04 Minix Login Guard And Legacy Mapping Spec

## Why
`phase08-02` 和 `phase08-03` 已经把最小认证闭环、请求治理和统一错误出口迁入 `server/`，但 `src/minix` 目前仍缺少围绕新宿主会话探测的最小页面守卫。若不在本子任务中把 `src/minix` 接到真实认证 API，并明确它与旧 `src/middleware.ts` 的并行边界，前端壳将继续停留在“能登录但没有稳定门禁”的半迁移状态。

## What Changes
- 适配 `src/minix/router/index.tsx`
- 新建或适配 `src/minix/router/guards.ts`
- 新建 `src/minix/lib/session-client.ts`
- 适配 `src/minix/routes/LoginPage.tsx`
- 明确新壳页面守卫与旧 `src/middleware.ts` 的关系
- 写出旧 `Next.js` 页面/API 门禁与新前端壳门禁之间的并行边界清单

## Impact
- Affected specs: `phase08` 页面门禁、登录回跳、Minix 会话探测、旧/新宿主并行边界
- Affected code: `src/minix/router/index.tsx`、`src/minix/router/guards.ts`、`src/minix/lib/session-client.ts`、`src/minix/routes/LoginPage.tsx`、`src/middleware.ts`、`src/app/login/page.tsx`

## ADDED Requirements
### Requirement: Minix 主壳必须提供最小页面守卫
系统 SHALL 在 `src/minix` 中提供最小页面守卫，使未登录用户访问主壳路径时被重定向到 `/login?next=...`，并让已登录用户进入主壳时不再依赖旧 `Next.js` 页面宿主的门禁初始化。

#### Scenario: 未登录用户访问主壳
- **WHEN** 未登录用户直接访问 `src/minix` 主壳中的受保护路径
- **THEN** 系统应把用户跳转到 `/login`
- **AND** 必须继续携带 `next` 参数
- **AND** `next` 的值应可被登录完成后的回跳逻辑稳定消费

### Requirement: Minix 登录页必须支持已登录自动回跳
系统 SHALL 让 `src/minix/routes/LoginPage.tsx` 在已登录状态下自动回跳到 `next` 或首页，避免用户进入重复登录页。

#### Scenario: 已登录用户访问登录页
- **WHEN** 已登录用户访问 `/login`
- **THEN** 系统应自动回跳到 `next` 或 `/`
- **AND** 不要求用户再次手动提交登录表单

### Requirement: Minix 必须通过新宿主探测登录态
系统 SHALL 在 `src/minix/lib/session-client.ts` 中提供基于 `GET /api/auth/session` 的最小会话探测客户端，并让新壳页面守卫与登录页围绕它消费统一登录态。

#### Scenario: 前端初始化探测当前登录态
- **WHEN** Minix 页面守卫或登录页初始化
- **THEN** 系统应调用新宿主的 `GET /api/auth/session`
- **AND** 探测结果应至少区分已登录、未登录和请求失败三种最小状态

### Requirement: 页面门禁与 API 门禁必须继续一致
系统 SHALL 保持 Minix 页面门禁与 `server/` 中的 API 门禁一致：页面侧把未登录用户导向 `/login?next=...`，API 侧继续返回稳定的 `401/403` 语义。

#### Scenario: 未登录用户从页面进入受保护路径
- **WHEN** 未登录用户先触发页面守卫，再访问受保护 API
- **THEN** 页面层应跳到 `/login?next=...`
- **AND** API 层仍应保持 `401/403` 的稳定语义
- **AND** 两者不应出现“页面放行但 API 拒绝”或“页面阻断但 API 被视为公开”的漂移

## MODIFIED Requirements
### Requirement: Minix 登录页的角色
`src/minix/routes/LoginPage.tsx` 的职责修改为：不仅提交登录表单到新宿主，还必须消费最小会话探测结果，并承接已登录自动回跳与失败提示。

#### Scenario: 登录页初始化与提交
- **WHEN** 用户打开或提交 `src/minix/routes/LoginPage.tsx`
- **THEN** 页面应围绕新宿主的 `POST /api/auth/login` 与 `GET /api/auth/session` 工作
- **AND** 不再只依赖“提交成功后盲跳”的单向行为

### Requirement: 旧 `Next.js` 门禁与新 Minix 门禁的关系
`phase08` 的旧/新宿主关系修改为：旧 `src/middleware.ts` 继续保护旧页面与旧 API 运行线；新 `src/minix` 页面守卫只保护新前端壳；两者并行存在，但边界必须可解释、可验证。

#### Scenario: 用户判断哪个门禁负责哪个入口
- **WHEN** 用户查看旧 `src/middleware.ts` 与新 `src/minix/router/guards.ts`
- **THEN** 应能确认旧门禁负责旧 `Next.js` 页面/API 运行线
- **AND** 应能确认新门禁负责 `src/minix` 前端壳路径
- **AND** 不应把新增 Minix 页面守卫再写回旧 `src/middleware.ts`

## REMOVED Requirements
### Requirement: Minix 主壳继续处于无真实页面守卫状态
**Reason**: `phase08-04` 的目标就是让 `src/minix` 接入真实认证 API 与最小登录守卫，不能继续只靠登录表单提交而没有初始化探测和页面级门禁。
**Migration**: 通过 `src/minix/lib/session-client.ts` 与 `src/minix/router/guards.ts` 建立基于 `GET /api/auth/session` 的页面守卫与回跳逻辑，同时保留旧 `src/middleware.ts` 作为旧运行线门禁。

# Phase05 PWA Delivery 开发规划

## 一、文档定位

本文档用于把 `phase05-pwa-delivery-*` 拆分为顺序执行的子任务，确保后续开发继续遵循：

- 单仓库单 UI 主线优先
- 安卓优先、受控环境优先
- 渐进增强优先
- service worker 最小化、可解释、可回滚
- 支持矩阵、更新策略与退化策略先于实现
- 低复杂度优先

本文档不替代：

- [phase05_pwa_delivery_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase05_pwa_delivery_architecture_plan.md) 的阶段定位职责
- [phase05_pwa_delivery_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase05_pwa_delivery_shared_baseline.md) 的共享边界职责
- 具体 `.trae/specs/phase05-pwa-delivery-*` 的任务冻结与验收职责

## 二、总体推进结论

`phase05-pwa-delivery-*` 的执行顺序固定为：

```text
先冻结支持矩阵、环境分层与退化策略
    ->
再收口安装壳、manifest 与图标/启动体验
    ->
再收口 service worker 与更新策略
    ->
再收口关键移动端页面可用性
    ->
最后完成私有部署、安装流程与发布验收准备
```

原因如下：

- 若不先冻结支持矩阵，后续极易再次把“安卓 Chrome 正式支持”“安卓 Edge 与其他 Chromium 浏览器次级兼容”“iOS 暂不承诺”混成模糊承诺
- 若不先收口安装壳和 manifest，后续 service worker 即使实现也没有稳定安装形态承接
- 若不先冻结更新策略，service worker 很容易重演旧版本缓存、行为不一致和调试不可解释问题
- 若不先完成安装与 SW 主壳，再去改关键页面，会在页面层面不断猜测“安装态到底是什么”
- 若不最后单独处理私有部署与安装验收，就无法真正回答“用户如何安装、如何更新、失败时如何退化”

## 三、任务拆分建议

## phase05-pwa-delivery-01-baseline-and-support-matrix-freeze

### 目标

冻结 `phase05` 的共享边界、正式支持矩阵、环境分层、退化策略、更新原则与子任务顺序。

### 范围

- 明确安卓优先的正式支持矩阵
- 明确 `Android + Chrome` 为第一优先级正式支持，`Android + Edge` 与其他主流 Chromium 浏览器为次级兼容目标，`iOS` 仅保留基础访问与必要安装说明
- 明确本地开发环境、受控测试环境、私有部署生产环境的统一分层口径
- 明确浏览器不支持、安装失败、SW 不可用或更新异常时如何退化为普通 Web
- 明确 service worker 仅缓存应用壳静态资源、`manifest`、图标与最小离线兜底资源，不缓存动态业务接口与鉴权态业务页面响应
- 冻结 `phase05` 的五个子任务顺序

### 不在范围内

- 不直接实现 service worker
- 不直接修改业务页面布局
- 不直接接入安装提示 UI

### DoD

- `phase05` 的支持矩阵与环境边界已冻结
- 三层环境中的 SW 启用条件、验收职责与生产前提已冻结
- 后续 `/spec` 可以直接引用共享基线
- 不再重复讨论“是否支持所有浏览器 / 是否追求 iOS 同等级体验”
- 后续子任务对安装、更新、退化与缓存边界口径不再分叉

## phase05-pwa-delivery-02-install-shell-and-manifest-hardening

### 目标

收口可安装 Web App 的基础壳层，使 manifest、图标、启动体验、安装态识别与安装引导具备正式交付基础。

### 范围

- 校准 `manifest`
- 审计并补齐图标、maskable icon、启动体验与 metadata
- 明确安装态、浏览器态与未支持态的差异
- 允许实现最小安装提示或安装引导
- 允许补最小离线页壳资源入口，但不在本子任务中扩写复杂缓存

### 重点文件

- `public/manifest.json` 或迁移后的 `src/app/manifest.ts`
- `src/app/layout.tsx`
- `public/icons/*`
- 必要时安装提示组件与相关 hooks

### 不在范围内

- 不直接实现复杂缓存策略
- 不实现完整离线业务
- 不引入推送或系统通知

### DoD

- 安卓正式支持浏览器中可识别并安装到桌面
- 图标、启动名称、启动体验与安装提示口径一致
- 安装前后产品形态可解释

## phase05-pwa-delivery-03-service-worker-and-update-strategy

### 目标

以最小、可解释、可回滚的方式实现 service worker、缓存边界与更新策略，避免再次出现调试受阻和版本脏读。

### 范围

- 明确 service worker 注册条件
- 实现最小静态壳缓存与最小离线兜底
- 明确不缓存动态业务接口、鉴权态业务页面响应与其他可能成为业务真相源的动态数据
- 冻结更新策略与版本切换提示口径
- 允许补最小调试说明，帮助区分开发环境和测试环境行为

### 重点文件

- `public/sw.js` 或等效 service worker 文件
- `next.config.*` 中与 PWA 头部或 SW 相关配置
- 必要时 PWA 注册组件、更新提示组件、离线页
- 必要时 `README.md` / `DEPLOYMENT.md` / `ENVIRONMENT_GUIDE.md`

### 不在范围内

- 不把业务 API 全量离线缓存
- 不实现完整离线数据库
- 不引入复杂后台同步、消息队列或推送系统

### DoD

- service worker 行为、缓存范围、更新策略和回滚方式清晰可解释
- 不支持 SW 或安装失败时，系统仍能正常退化为普通 Web
- 至少一条更新验证路径可执行

## phase05-pwa-delivery-04-mobile-layout-and-key-page-usability-closure

### 目标

收口关键业务页面在手机场景下的真实可用性，使安装后的 PWA 不是“能打开”，而是“能稳定使用”。

### 范围

- 审计 `AppLayout`、移动端导航、safe-area、软键盘遮挡与视口行为
- 优先修复关键页面的移动端使用问题：
  - 首页 / Dashboard
  - 列表页
  - 表单页
  - 详情页
  - 搜索与提醒相关页
- 允许减少客户端判屏导致的闪烁和不一致
- 允许做不改变视觉语言的最小信息架构与交互优化

### 重点文件

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/MobileLayout.tsx`
- `src/components/layout/UnifiedNavigation.tsx`
- `src/app/globals.css`
- 必要时关键业务页面与表单组件

### 不在范围内

- 不重做整套视觉风格
- 不为移动端建立第二套路由树
- 不顺手扩写无关功能

### DoD

- 关键页面在主流手机尺寸下具备可接受可用性
- 无严重横向溢出
- 无主要操作被底部导航或软键盘遮挡
- 安装态与浏览器态的布局行为不再明显分叉

## phase05-pwa-delivery-05-private-deployment-and-installation-readiness

### 目标

完成私有部署前提、安装流程说明、真机验收路径与发布前门禁，确保 PWA 能在真实受控环境中交付。

### 范围

- 明确 HTTPS 与私网 / 受控环境要求
- 明确安装步骤、更新方式、失败退化说明
- 完成最小真机验收清单
- 必要时补运行与部署文档同步
- 允许补最小脚本或说明帮助验证安装与更新

### 重点文件

- `README.md`
- `DEPLOYMENT.md`
- `ENVIRONMENT_GUIDE.md`
- 必要时 `.env.example`
- 必要时与安装/更新提示相关页面或文档

### 不在范围内

- 不把当前私有部署系统扩成公网 App 分发方案
- 不把发布验收扩成完整 DevOps 平台建设
- 不新增与 PWA 无关的安全体系重构

### DoD

- 正式支持环境下的安装路径清晰可执行
- 更新、回退、失败退化说明清晰
- 发布前验收标准可执行

## 四、推荐实施顺序

建议严格按如下顺序推进：

```text
phase05-pwa-delivery-01-baseline-and-support-matrix-freeze
phase05-pwa-delivery-02-install-shell-and-manifest-hardening
phase05-pwa-delivery-03-service-worker-and-update-strategy
phase05-pwa-delivery-04-mobile-layout-and-key-page-usability-closure
phase05-pwa-delivery-05-private-deployment-and-installation-readiness
```

## 五、默认路线约束

`phase05-pwa-delivery-*` 的全部子任务都必须遵守：

- 默认优先保持单一 Web 主线，不新增第二套 UI 主线
- 默认优先受控安卓环境与正式支持矩阵，而不是一开始承诺所有浏览器
- 默认优先渐进增强，核心业务先保证普通 Web 可用
- 默认要求 service worker 最小化、更新策略清晰、缓存边界可解释
- 默认优先最小离线壳，而不是完整离线业务
- 默认优先使用真机和受控环境验证，而不是仅用 PC 浏览器假设成功
- 默认由用户手动启动本地 dev server，AI 不主动后台运行 `npm run dev`

## 六、结语

`phase05` 的价值不在于“把 Rento 做成另一个移动端项目”，而在于：

```text
在保持单一 Web 主线和低复杂度前提下，
让 Rento 在受控安卓环境中，
真正成为一个可安装、可解释、可维护的私有管理 Web App。
```

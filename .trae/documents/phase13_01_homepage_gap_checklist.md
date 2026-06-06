# phase13-01 首页迁移缺口清单

## 1. 目的
- 本清单用于回退 `phase13-01-dashboard-and-shell-real-page-landing` 的错误验收结论后，重新建立首页修复的单一对照输入。
- 本清单只回答一件事：当前 `src/minix/routes/HomePage.tsx` 与旧 `Rento` 首页原型相比，哪些内容必须恢复、哪些内容必须删除、哪些内容只允许做最小宿主适配。

## 2. 对照原型
- 旧首页直接原型：
  - `src/components/pages/DashboardPage.tsx`
  - `src/components/pages/DashboardPageWithStats.tsx`
- 旧首页关键子模块：
  - `src/components/business/SearchBar.tsx`
  - `src/components/business/NotificationEntryButton.tsx`
  - `src/components/business/FunctionGrid.tsx`
  - `src/components/business/UnifiedAlertsPanel.tsx`
  - `src/components/business/UserProfileSheet.tsx`
- 当前待修复实现：
  - `src/minix/routes/HomePage.tsx`

## 3. 旧首页必须保留的结构事实

### 3.1 页面主结构
- 旧首页主体不是“说明型 hero + 侧栏说明卡”。
- 旧首页的正式结构是：
  1. `PageContainer`
  2. 移动端工作台顶部条
  3. `StatisticsCards`
  4. `FunctionGrid`
  5. `UnifiedAlertsPanel`
  6. `UserProfileSheet`

### 3.2 顶部工作台条
- 旧首页顶部条仅在 `lg:hidden` 的移动端区域出现。
- 顶部条由三部分组成：
  - 左侧个人中心按钮
  - 中间搜索入口 `SearchBar`
  - 右侧通知入口 `NotificationEntryButton`
- 顶部条不包含：
  - 迁移说明文案
  - “宿主切换完成”提示
  - 设置按钮替代个人中心按钮

### 3.3 首页主体模块
- 统计区直接使用 `StatisticsCards`。
- 快捷操作区直接使用 `FunctionGrid`，而不是重新构造一套 `quickActions` 数据和替代网格。
- 提醒区直接使用 `UnifiedAlertsPanel`，而不是用“入口协同”“状态边界”侧栏卡替代。
- 个人中心通过 `UserProfileSheet` 承接，而不是直接删除该入口语义。

## 4. 当前实现的严重漂移项

### 4.1 说明性数据装配漂移
- 当前 `HomePage.tsx` 在 `buildHomePageShellData()` 中注入了以下不属于旧首页原型的说明性字段：
  - `appName`
  - `mode`
  - `apiBaseUrl`
  - `loadedAt`
  - `homeDescription`
  - `searchEntryDescription`
  - `settingsEntryDescription`
- 这些字段服务于迁移说明、宿主说明和验收辅助，不服务于正式工作台首页展示。

### 4.2 Hero 结构漂移
- 当前首页新增了完整 hero 文案区：
  - “租务工作台”
  - 首页说明文案
  - 搜索/设置说明 chips
  - “首页壳: 已切到真实工作台页面”“宿主: React Router 导航壳”“壳层更新时间”状态块
- 旧首页并不存在上述说明性 hero。
- 这些结构必须整体移除，不能继续作为“新首页特色”保留。

### 4.3 顶部入口语义漂移
- 旧首页顶部左侧是“个人中心”按钮，当前实现改成了“设置”按钮。
- 旧首页顶部右侧是通知入口，当前实现完全缺失 `NotificationEntryButton`。
- 旧首页顶部中间使用 `SearchBar` 组件，当前实现重写成了本地输入框与手写跳转逻辑。
- 这意味着当前首页破坏了旧页面的入口节奏与组件表达。

### 4.4 快捷入口模块漂移
- 旧首页使用 `FunctionGrid`。
- 当前实现改为 `HomeQuickActionsSection`，并用 `minixPrimaryRoutes` 拼接一组新的 `quickActions`。
- 新实现还额外手动追加了一次 `/settings`，导致“设置”重复。
- 当前替代网格也丢失了旧 `FunctionGrid` 中的既有入口集合与治理过滤逻辑，例如：
  - `租客管理`
  - `批量抄表`
  - `抄表历史`
  - 经治理后仍保留的正式业务入口

### 4.5 提醒模块缺失
- 旧首页明确包含 `UnifiedAlertsPanel`。
- 当前首页完全没有承接该模块。
- 这不是“细节待补”，而是首页正式业务模块缺失。

### 4.6 个人中心模块缺失
- 旧首页通过 `UserProfileSheet` 保留个人中心入口与抽屉。
- 当前首页不再保留 `showUserSheet` 状态，也没有 `UserProfileSheet`。
- 这导致旧首页的人物入口语义丢失。

### 4.7 侧栏卡片属于验收辅助结构
- 当前首页新增：
  - `HomeEntryCadenceCard`
  - `HomeShellStatusCard`
- 它们承载的是迁移说明、宿主边界说明、刷新状态、API 基址、运行模式等验收辅助信息。
- 旧首页无此模块。
- 这两张卡片必须整体删除，不能产品化保留。

### 4.8 错误态表达漂移
- 当前 `normalizeHomePageError()` 会直接暴露例如 `501 xxx` 这一类技术态文案。
- 旧首页没有把这类 route-level 技术细节直接作为首页核心展示的一部分。
- 新宿主可以保留错误边界机制，但错误文案应最小化、产品化，不能让首页长期裸露技术状态描述。

## 5. 允许保留的最小技术适配

### 5.1 可以保留的宿主适配
- `react-router-dom` 的 `Link`
- `useNavigate`
- `useLoaderData`
- `Await`
- `defer`
- `useRouteError`
- `useRevalidator`
- route-level `pending` / `error` 边界

### 5.2 允许替换但不改变表达的部分
- 旧 `next/link` -> 新宿主 `Link`
- 旧 `next/navigation` -> 新宿主导航 API
- 旧宿主页面级数据挂载方式 -> 新宿主 route-level loader 或页面内部最小客户端逻辑

### 5.3 不允许借适配新增的结构
- 不允许因为迁到 `React Router` 就新增宿主说明卡。
- 不允许因为要验证 loader / pending / error，就把状态边界说明做成首页模块。
- 不允许因为旧组件含 `next/*` 依赖，就先用一套新的说明性页面替代旧模块结构。

## 6. 修复目标清单

### 6.1 必须恢复
- 恢复移动端顶部工作台条的旧节奏：
  - 个人中心按钮
  - `SearchBar`
  - `NotificationEntryButton`
- 恢复 `FunctionGrid`
- 恢复 `UnifiedAlertsPanel`
- 恢复 `UserProfileSheet`
- 继续保留 `StatisticsCards`

### 6.2 必须删除
- 删除 `buildHomePageShellData()` 中服务于说明页的展示性字段
- 删除首页说明性 hero 文案
- 删除“首页壳 / 宿主 / 刷新时间”状态块
- 删除 `HomeEntryCadenceCard`
- 删除 `HomeShellStatusCard`
- 删除重复 `设置` 快捷入口
- 删除所有不属于旧首页原型的说明 chips 和辅助描述

### 6.3 必须改回旧原型语义
- 将顶部左侧入口从“设置”改回“个人中心”
- 将顶部右侧入口从缺失状态改回通知入口
- 将本地手写搜索输入改回复用 `SearchBar`
- 将自定义快捷入口区域改回 `FunctionGrid`

## 7. 实施建议顺序
1. 先把 `HomePageContent` 缩回旧首页主骨架，只保留必要的 route-level 包裹。
2. 再逐个替换旧首页中仍依赖 `next/*` 的子组件宿主绑定。
3. 最后保留最小 `pending` / `error` 边界，但不要把其说明信息渲染进正式首页主体。

## 8. 通过标准
- `src/minix/routes/HomePage.tsx` 的主结构重新接近旧 `DashboardPageWithStats.tsx`。
- 页面主体重新以旧首页模块链为准，而不是以当前说明性实现为准。
- 不再存在说明卡、状态卡、宿主标签、重复入口、占位模块替代正式模块的情况。
- 仅在路由协议、导航 API、数据边界承接层面保留最小技术适配。

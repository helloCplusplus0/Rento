# Rento 重启推进计划

## Summary
- 当前判断：`phase01-restart-foundation-*` 的治理性重启准备已经基本完成，项目已达到“恢复开发”的条件，但尚未达到“公网发布”的条件。
- 默认推进方向：从“继续清理文档”切换到“恢复主线交付”，执行顺序固定为 `phase02-auth-gate-*` -> `phase03-consistency-hardening-*` -> `phase04-performance-and-ops-*`。
- 总体策略：坚持低复杂度、单仓库、单主链、单一真相源，不重写 UI，不扩张 SaaS 化能力，不恢复 SQLite 路线。
- 当前阻断项：鉴权与最小门禁未落地；迁移链仍带 SQLite 历史遗留；开发辅助页尚未完成分类与门禁。

## Current State Analysis

### 已确认完成的基础条件
- 顶层治理文档已建立并形成单一真相源结构：
  - `/home/dell/Projects/Rento/AGENTS.md`
  - `/home/dell/Projects/Rento/project_rules.md`
  - `/home/dell/Projects/Rento/architecture_map.md`
  - `/home/dell/Projects/Rento/plan.md`
  - `/home/dell/Projects/Rento/global_skills.md`
  - `/home/dell/Projects/Rento/project_skills.md`
- 主文档已统一为 PostgreSQL-only 口径：
  - `/home/dell/Projects/Rento/README.md`
  - `/home/dell/Projects/Rento/QUICK_START.md`
  - `/home/dell/Projects/Rento/DEPLOYMENT.md`
  - `/home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md`
  - `/home/dell/Projects/Rento/.env.example`
- 历史任务材料已归档到 `docs/archive/` 与 `scripts/archive/`。
- 工程基线已验证通过：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`
  - `npx prisma validate`
- 开发态热加载预览已可用，且 `dashboard/stats` 的 500 已通过重新生成 Prisma Client 并重启 dev server 修复。

### 当前仓库实现形态
- 前端/后端形态：`Next.js 15 + React 19 + App Router Route Handlers`
- 数据层：`Prisma 6 + PostgreSQL`
- 辅助基础设施：`Redis + Docker/Podman + Nginx`
- 本地开发入口：
  - `package.json` 中的 `dev` 脚本为 `next dev --port 3001`
  - `docker-compose.yml` 当前更偏容器化部署验证，而不是热加载开发模式
- 认证现状：
  - `/home/dell/Projects/Rento/src/middleware.ts` 仅保留预留逻辑，没有真实认证与鉴权
  - 仓库内无现成认证库、无登录页、无 session 层
- 业务主链清晰：
  - `Building -> Room -> Meter`
  - `Renter -> Contract -> Bill/BillDetail -> MeterReading`

### 当前仍存在的治理债务
- `.env` 仍有历史被 Git 跟踪的痕迹，环境卫生未完全收口。
- `/home/dell/Projects/Rento/prisma/migrations/migration_lock.toml` 仍残留 SQLite 历史标记，当前靠 `/home/dell/Projects/Rento/scripts/migrate-and-seed.sh` 兼容。
- `src/app` 中存在开发辅助页、性能页、验证页与正式业务页并存的问题。
- 启动日志中仍有重复注册 `alert-manager` / `fallback-manager` 的噪音，虽不阻断开发，但影响后续问题定位。
- 部分查询优化文件和业务工具文件仍存在字段漂移或状态语义不够收口的问题，尤其集中在 `src/lib/optimized-queries.ts`、账单状态和删除门禁相关逻辑。

## Assumptions & Decisions
- 决策 1：`phase01-restart-foundation-*` 视为已收口，不再继续在该阶段追加零散治理任务，后续只允许补必要同步文档。
- 决策 2：`phase02-auth-gate-*` 作为唯一的下一阶段默认入口，优先级高于一致性优化和性能优化。
- 决策 3：认证方案采用“最小私有后台门禁”路线，不引入 OAuth、多租户、开放注册体系。
- 决策 4：鉴权先以单角色 `ADMIN` 起步；后续若有协同需求，再扩展 `OPERATOR / VIEWER`。
- 决策 5：认证实现优先基于 Next.js App Router 的 `cookies + middleware + Route Handlers` 模式，避免先引入重量级认证框架。
- 决策 6：UI 视觉、布局与设计语言默认冻结；后续仅允许“不改变视觉结果”的稳定性优化。
- 决策 7：多仪表能力与历史账务保留是核心差异化资产，任何后续阶段都不得以“通用化”名义回退建模。

## Proposed Changes

### 一、阶段切换与顶层真相源同步

#### 目标
- 把仓库默认入口从 `phase01-restart-foundation-*` 切换为 `phase02-auth-gate-*`，并同步文档真相源。

#### 需要修改的文件
- `/home/dell/Projects/Rento/AGENTS.md`
  - what: 更新“当前默认入口”和“当前阶段重点”
  - why: 防止仓库继续停留在治理准备态叙述
  - how: 将默认工作流切到 `phase02-auth-gate-*`，明确 `phase01` 已完成、`phase02` 的边界与阻断项
- `/home/dell/Projects/Rento/plan.md`
  - what: 更新当前默认阶段、验收状态与后续阶段顺序
  - why: `plan.md` 是唯一主真相源，必须先于实现切换
  - how: 增加 `phase01` 完成结论，细化 `phase02/03/04` 的验收口径
- `/home/dell/Projects/Rento/architecture_map.md`
  - what: 补充开发态运行入口和后续 auth 落点说明
  - why: 当前架构图仍偏“仓库结构说明”，对即将引入的门禁层落点表达不够
  - how: 明确 `middleware`、`auth route handlers`、登录页和受保护页面的结构位置
- `/home/dell/Projects/Rento/README.md`
  - what: 增加“当前默认阶段”和“开发热加载模式 vs 容器部署验证模式”的说明
  - why: 避免再次把开发预览和部署预览混淆
  - how: 在快速开始与当前状态区域增加两个运行模式的边界说明

### 二、phase02-auth-gate：最小认证门禁

#### 目标
- 在不破坏现有 UI 的前提下，为页面与 API 建立统一门禁，使项目达到“可私有部署、不可公网裸奔”的最低标准。

#### 方案决定
- 采用“自建最小 session cookie”方案：
  - 登录页收集受控管理员凭证
  - Route Handler 负责凭证校验与设置 `httpOnly` cookie
  - `middleware` 做页面层门禁
  - API 层通过统一的 session 校验函数做写接口与敏感读接口保护
- 参考 Context7 的 Next.js 官方模式：
  - Route Handlers 中通过 `cookies()` 读写 cookie
  - App Router 下以服务端 session 校验为准
  - `middleware` 负责 optimistic auth check 与未登录重定向

#### 需要新增/修改的文件
- `/home/dell/Projects/Rento/src/middleware.ts`
  - what: 从预留中间件升级为真实门禁层
  - why: 当前页面完全裸奔
  - how:
    - 区分公开路径、登录路径、静态资源与受保护路径
    - 检查 session cookie
    - 未登录访问受保护页时重定向到 `/login`
    - 对已登录用户访问 `/login` 时跳回首页
    - 保留现有开发环境日志，但收敛为必要范围
- `/home/dell/Projects/Rento/src/lib/auth/session.ts`（新增）
  - what: 统一 session 编解码、cookie 配置与过期策略
  - why: 避免在多个 route handler 和 middleware 中散落同一逻辑
  - how:
    - 定义 cookie 名称、有效期、`httpOnly`、`sameSite`、`secure` 策略
    - 提供 `createSessionCookie` / `clearSessionCookie` / `verifySessionCookie`
- `/home/dell/Projects/Rento/src/lib/auth/password.ts`（新增）
  - what: 管理员凭证校验逻辑
  - why: 需要与环境变量和后续密码策略解耦
  - how:
    - 先采用环境变量承载管理员账号/密码哈希
    - 使用密码哈希比对，而不是明文硬编码
- `/home/dell/Projects/Rento/src/lib/auth/guard.ts`（新增）
  - what: 服务端统一鉴权守卫
  - why: API 层不能只靠 middleware
  - how:
    - 暴露 `requireAdminSession()` / `getOptionalSession()` 等函数
    - 为 API route 提供统一 401/403 返回
- `/home/dell/Projects/Rento/src/app/login/page.tsx`（新增）
  - what: 管理员登录页
  - why: 当前无任何登录入口
  - how:
    - 复用既有 UI 组件
    - 保持视觉风格与现有页面一致
    - 只实现最小表单和错误提示，不引入新的设计体系
- `/home/dell/Projects/Rento/src/app/api/auth/login/route.ts`（新增）
  - what: 登录接口
  - why: 需要在服务端校验凭证并下发 cookie
  - how:
    - 校验用户名/密码
    - 写入 session cookie
    - 返回标准 success/error JSON
- `/home/dell/Projects/Rento/src/app/api/auth/logout/route.ts`（新增）
  - what: 登出接口
  - why: 需要明确清理 session 路径
  - how: 删除 cookie 并返回标准响应
- `/home/dell/Projects/Rento/src/lib/api-error-handler.ts`
  - what: 增加 auth 相关错误封装辅助
  - why: 当前统一错误处理中尚未纳入鉴权语义
  - how:
    - 补充 401/403 的标准化响应能力
    - 让被保护 API 可返回一致的认证错误格式
- `/home/dell/Projects/Rento/src/app/api/**/route.ts`
  - what: 对核心业务写接口和敏感读接口接入 `requireAdminSession()`
  - why: API 不能出现“页面有门禁，接口裸露”
  - how:
    - 第一批至少覆盖 `contracts`、`bills`、`rooms`、`renters`、`meters`、`meter-readings`、`settings`
    - `health` 类接口保留公开或最小限制，按实际用途决定
- `/home/dell/Projects/Rento/.env.example`
  - what: 增加认证相关环境变量模板
  - why: 当前只存在 `NEXTAUTH_*` 遗留变量，不代表真实方案
  - how:
    - 增加管理员用户名、密码哈希、session secret 等模板变量
    - 明确哪些为开发必填，哪些为生产必填
- `/home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md`
  - what: 新增 auth 环境变量章节
  - why: 门禁变更必须同步环境文档
  - how: 说明开发态、私有部署态和公网部署态的配置差异
- `/home/dell/Projects/Rento/README.md`
  - what: 增加登录与门禁说明
  - why: 当前 README 仍停留在“可运行”而不是“受保护可运行”
  - how: 增加认证后首次启动与管理员登录步骤

#### 验收标准
- 未登录访问首页、合同、账单、设置等核心业务页时，统一跳转到 `/login`
- 未登录调用核心业务 API 时，得到标准化 `401`
- 已登录管理员可正常访问现有业务页面与 API
- 页面门禁与 API 门禁口径一致
- UI 风格不发生明显变化

### 三、phase03-consistency-hardening：主链一致性与语义收口

#### 目标
- 修正当前最可能破坏业务主真相源的问题，尤其是删除门禁、金额语义和历史保留策略。

#### 需要修改的文件
- `/home/dell/Projects/Rento/src/lib/validation.ts`
  - what: 收紧删除房间、删除合同、删除账单等业务门禁
  - why: 当前规则分散，且对历史账务/合同状态的保护不够强
  - how:
    - 显式禁止删除仍有关联合同、未结清账单或历史仪表事实的实体
    - 返回可解释的业务错误码
- `/home/dell/Projects/Rento/src/lib/queries.ts`
  - what: 统一合同、账单、房间状态流转中的事实判断
  - why: 业务主链应围绕 `Contract` 收口，而不是在页面逻辑中隐式处理
  - how:
    - 审查合同激活、续租、退租、房态切换与账单关系
    - 把高风险状态判断收回服务端查询/业务函数
- `/home/dell/Projects/Rento/src/lib/optimized-queries.ts`
  - what: 修复字段漂移与失真查询
  - why: 已知存在字段名不匹配问题
  - how:
    - 对照 `prisma/schema.prisma` 修复 `rent/monthlyRent`、`idCard/idNumber` 等偏差
    - 删除或降级不再可信的“优化”逻辑
- `/home/dell/Projects/Rento/src/lib/dashboard-queries.ts`
  - what: 收口 dashboard 统计语义与状态判定
  - why: 仪表板是经营入口，不应再出现模糊状态逻辑
  - how:
    - 明确 `PENDING / PAID / OVERDUE / COMPLETED` 的统计口径
    - 避免“部分付款”和“已完成”语义混淆
- `/home/dell/Projects/Rento/prisma/schema.prisma`
  - what: 复核关键状态、金额字段和关系约束
  - why: schema 是数据主真相源
  - how:
    - 核查 `BillStatus`、金额字段、删除策略和关系映射
    - 只做必要收口，不做大规模重构
- `/home/dell/Projects/Rento/project_skills.md`
  - what: 将本阶段收口后的业务规则固化为项目技能
  - why: 防止后续实现再次回退到通用租赁假设
  - how: 更新合同锚点、多仪表历史保留、删除门禁等规则条目

#### 验收标准
- 高风险破坏性操作均由服务端门禁拦截
- 金额字段和状态流转语义在 schema、服务端和页面展示间一致
- 不再出现“文档对、代码错”的主链矛盾

### 四、phase03 并行子任务：迁移链正式收口

#### 目标
- 将 SQLite 历史兼容从“隐性残留”降级为“有计划可退出的兼容项”。

#### 需要修改的文件
- `/home/dell/Projects/Rento/prisma/migrations/migration_lock.toml`
  - what: 制定整改路径，而不是直接盲改
  - why: 当前脚本依赖旧锁文件兼容行为，贸然修改存在部署风险
  - how: 在独立任务中决定是重建迁移基线，还是保留锁文件并补正式说明
- `/home/dell/Projects/Rento/scripts/migrate-and-seed.sh`
  - what: 明确兼容逻辑的存在原因与退出条件
  - why: 现在脚本承担了历史兜底，但缺少完整退出策略
  - how:
    - 添加清晰注释
    - 规范“何时使用 db push、何时恢复 migration deploy”
- `/home/dell/Projects/Rento/architecture_map.md`
  - what: 持续标记迁移链兼容状态
  - why: 防止团队误认为迁移链已完全收口
  - how: 更新已知结构债务和数据库入口说明

#### 验收标准
- 迁移兼容逻辑有明确退出条件
- 文档与脚本对迁移状态口径一致
- 不再出现“schema 是 PostgreSQL，但本地生成链路或部署链路仍暗含 SQLite 假设”的隐性冲突

### 五、phase04-performance-and-ops：性能、观测与辅助页治理

#### 目标
- 在安全和一致性稳定后，系统性处理查询性能、运行噪音和开发辅助入口治理。

#### 需要修改的文件
- `/home/dell/Projects/Rento/src/app/api/rooms/route.ts`
  - what: 去掉 `includeMeters=true` 的 N+1 模式
  - why: 房间接口是高频入口，当前实现会随房间数量线性放大查询
  - how: 使用 Prisma 的关系查询、精简 `select/include`
- `/home/dell/Projects/Rento/src/app/api/contracts/route.ts`
  - what: 从内存过滤迁移到数据库侧过滤和分页
  - why: 当前列表型接口存在全量拉取后再筛选的风险
  - how: 将搜索和筛选条件下推到 Prisma `where`
- `/home/dell/Projects/Rento/src/lib/alert-manager.ts`
  - what: 避免开发态重复注册规则
  - why: 当前日志噪音过多，影响排错体验
  - how: 做幂等注册或开发态去重
- `/home/dell/Projects/Rento/src/lib/fallback-manager.ts`
  - what: 避免重复注册回退策略
  - why: 同上
  - how: 增加单例初始化保护
- `/home/dell/Projects/Rento/src/app/performance-*`
- `/home/dell/Projects/Rento/src/app/layout-demo`
- `/home/dell/Projects/Rento/src/app/business-flow-validation`
- `/home/dell/Projects/Rento/src/app/components`
  - what: 对开发辅助页进行分类和门禁
  - why: 当前这些页面与正式业务入口并列，长期会污染导航和风险边界
  - how:
    - 标注开发用途
    - 判断保留、开发态限定或归档候选
- `/home/dell/Projects/Rento/architecture_map.md`
  - what: 同步辅助页分类结果
  - why: 架构地图应反映真实运行边界
  - how: 将正式业务页、运维页、开发辅助页分开表述

#### 验收标准
- 关键列表接口符合数据库侧过滤、分页和聚合原则
- 启动噪音明显下降，问题日志更可读
- 开发辅助页不再与正式业务入口混淆

## Verification Steps

### phase02-auth-gate 验证
- 运行：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`
- 手工验证：
  - 未登录访问 `/`、`/contracts`、`/bills`、`/settings` 被重定向到 `/login`
  - 未登录访问关键 API 返回 `401`
  - 登录成功后可访问核心页面并正常操作
  - 登出后 cookie 被清理，再次访问受保护页被拦截
- 容器/健康验证：
  - `podman-compose up -d` 或对应 Docker 命令
  - `/api/health` 返回正常

### phase03-consistency-hardening 验证
- 运行：
  - `npm run lint`
  - `npm run type-check`
  - `npx prisma validate`
- 业务 smoke test：
  - 存在未结清账单的合同不能被直接删除
  - 在租/逾期房间不能按普通空房逻辑删除
  - 仪表解绑或更换后，历史 `MeterReading` / `BillDetail` 仍可追溯
  - 合同续租/退租后，账单和房态保持一致

### phase04-performance-and-ops 验证
- 运行：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`
- 接口验证：
  - `rooms` / `contracts` 列表接口不再出现明显 N+1 或内存过滤
  - 首页 dashboard 与关键列表页在开发态和容器态均可稳定打开
- 观测验证：
  - 启动日志中重复注册类噪音显著减少
  - `/api/health` 与基础业务流 smoke test 通过

## Recommended Execution Order
1. 完成顶层文档阶段切换同步，正式宣布 `phase01` 完成。
2. 执行 `phase02-auth-gate-*`，先做页面/API 最小门禁，再补环境与文档。
3. 执行 `phase03-consistency-hardening-*`，优先收口删除门禁、金额语义和主链一致性。
4. 单独推进迁移链正式收口，不与鉴权或业务逻辑改造混做。
5. 最后执行 `phase04-performance-and-ops-*`，降低风险并提升长期可维护性。

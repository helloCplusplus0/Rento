export type LegacyRouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type LegacyRouteCategory =
  | 'formal-host-owned'
  | 'compat-wrapper'
  | 'retained-legacy'

export type LegacyRouteKind =
  | 'auth'
  | 'health'
  | 'domain-mainline'
  | 'dashboard'
  | 'governance'
  | 'reference-data'

export type Phase10InputBucket =
  | 'exit-evaluation'
  | 'keep-compat'
  | 'defer-unmigrated'

export interface LegacyRouteOperation {
  methods: readonly LegacyRouteMethod[]
  category: LegacyRouteCategory
  phase10Input: Phase10InputBucket
  formalHosts: readonly string[]
  domainServicePaths: readonly string[]
  keepReason: string
  exitCondition: string
  rollbackCondition: string
}

export interface LegacyRouteInventoryEntry {
  filePath: string
  routePath: string
  kind: LegacyRouteKind
  operations: readonly LegacyRouteOperation[]
}

export interface FlattenedLegacyRouteOperation extends LegacyRouteOperation {
  filePath: string
  routePath: string
  kind: LegacyRouteKind
}

/**
 * phase09-06 把旧 src/app/api/* 的角色显式化：
 * - formal-host-owned: 新正式宿主已经冻结，phase10 可继续评估旧入口退出
 * - compat-wrapper: 旧入口仍承担兼容包装职责，phase10 前不能直接删除
 * - retained-legacy: 当前仍是旧运行线/治理接口/存量 CRUD，留待后续阶段处理
 */
const UNIFIED_HONO_EXIT_CONDITION =
  '统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API。'

const KEEP_COMPAT_ROLLBACK_CONDITION =
  '若统一 Hono 宿主在认证、合同/账单/抄表主链或会话兼容上出现回归，旧 Next.js 入口继续作为回滚基线保留。'

const LEGACY_RUNTIME_ROLLBACK_CONDITION =
  '若 phase10 期间尚未完成正式宿主切流，旧 Next.js 入口继续保留；phase09-06 不执行旧接口删除。'

const GOVERNANCE_KEEP_REASON =
  '该接口属于治理/统计/辅助或未进入 phase09 主链接口迁移范围；本任务明确不迁治理接口。'

export const PHASE09_06_LEGACY_ROUTE_INVENTORY: readonly LegacyRouteInventoryEntry[] = [
  {
    filePath: 'src/app/api/auth/login/route.ts',
    routePath: '/api/auth/login',
    kind: 'auth',
    operations: [
      {
        methods: ['POST'],
        category: 'formal-host-owned',
        phase10Input: 'exit-evaluation',
        formalHosts: ['server/routes/auth.ts'],
        domainServicePaths: ['src/lib/auth/password.ts', 'src/lib/auth/session.ts'],
        keepReason:
          'phase08-02 已冻结 server/routes/auth.ts 为统一认证宿主；旧登录入口仅保留旧运行线回滚价值。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/auth/logout/route.ts',
    routePath: '/api/auth/logout',
    kind: 'auth',
    operations: [
      {
        methods: ['POST'],
        category: 'formal-host-owned',
        phase10Input: 'exit-evaluation',
        formalHosts: ['server/routes/auth.ts'],
        domainServicePaths: ['src/lib/auth/session.ts'],
        keepReason:
          'phase08-02 已冻结 server/routes/auth.ts 为统一认证宿主；旧退出入口仅保留旧运行线回滚价值。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/health/route.ts',
    routePath: '/api/health',
    kind: 'health',
    operations: [
      {
        methods: ['GET'],
        category: 'formal-host-owned',
        phase10Input: 'exit-evaluation',
        formalHosts: ['server/routes/health.ts'],
        domainServicePaths: ['src/lib/observability.ts', 'src/lib/prisma.ts'],
        keepReason:
          'phase08-01 已冻结统一 /api/health 承接位；旧健康检查保留为旧运行线参考与回滚基线。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/health/system/route.ts',
    routePath: '/api/health/system',
    kind: 'health',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/health-checker.ts', 'src/lib/observability.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待 phase10 以后明确是否保留细分辅助健康检查，再决定统一承接位或归档退出策略。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/health/bills/route.ts',
    routePath: '/api/health/bills',
    kind: 'health',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/health-checker.ts', 'src/lib/observability.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待 phase10 以后明确是否保留账务细分辅助健康检查，再决定统一承接位或归档退出策略。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/contracts/activate/route.ts',
    routePath: '/api/contracts/activate',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['POST'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/contracts.ts'],
        domainServicePaths: ['src/lib/domain/contracts/index.ts'],
        keepReason:
          '旧入口已退化为合同激活 compat wrapper；正式宿主与生命周期真相已在 Hono + 共享领域服务冻结。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/contracts/route.ts',
    routePath: '/api/contracts',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: [
          'src/lib/queries.ts',
          'src/lib/optimized-queries.ts',
          'src/lib/domain/meters/index.ts',
        ],
        keepReason:
          '合同列表与新签合同写入口仍由旧 Next.js 路由承接；phase09-06 不扩张到该存量 CRUD 迁移。',
        exitCondition:
          '待 phase10/后续阶段冻结合同正式查询与新签写入口后，再评估迁出或拆分到统一 Hono 宿主。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/contracts/[id]/route.ts',
    routePath: '/api/contracts/:id',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'PUT'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts', 'src/lib/prisma.ts'],
        keepReason:
          '合同详情查询与签约信息更新仍由旧 Next.js 路由承接；尚未冻结对应 Hono 正式宿主。',
        exitCondition:
          '待 phase10 明确合同详情查询与编辑正式宿主后，再评估退出或保留只读参考路径。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
      {
        methods: ['DELETE'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/contracts.ts'],
        domainServicePaths: ['src/lib/domain/delete-guards/index.ts'],
        keepReason:
          '合同删除已改由共享删除门禁承接，旧入口只保留请求兼容与回滚基线。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/contracts/[id]/generate-bills/route.ts',
    routePath: '/api/contracts/:id/generate-bills',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['POST'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/contracts.ts'],
        domainServicePaths: ['src/lib/domain/contracts/index.ts'],
        keepReason:
          '合同补账单编排已迁入共享领域服务；旧入口仅保留 compat 请求适配与缓存失效。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/contracts/[id]/renew/route.ts',
    routePath: '/api/contracts/:id/renew',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['POST'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/contracts.ts'],
        domainServicePaths: ['src/lib/domain/contracts/index.ts'],
        keepReason:
          '续租与补账单语义已冻结到共享领域服务；旧入口仅保留 compat 包装。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/contracts/[id]/checkout/route.ts',
    routePath: '/api/contracts/:id/checkout',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['POST'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/checkout.ts'],
        domainServicePaths: ['src/lib/domain/contracts/index.ts'],
        keepReason:
          '退租结算正式事务编排已迁入 checkout Hono 宿主；旧入口保留会话透传与回滚能力。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/bills/route.ts',
    routePath: '/api/bills',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts', 'src/lib/optimized-queries.ts'],
        keepReason:
          '账单列表与手动创建账单仍属旧运行线存量 CRUD；phase09-06 不迁移这部分正式宿主。',
        exitCondition:
          '待 phase10 明确账单查询/手工创建宿主与数据访问层收口方案后，再评估迁移。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/bills/[id]/route.ts',
    routePath: '/api/bills/:id',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason: '账单详情读取仍由旧查询路径承接，尚未冻结新的 Hono 查询宿主。',
        exitCondition:
          '待 phase10 冻结账单详情正式查询宿主与读取模型后，再评估退出或只读兼容。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
      {
        methods: ['PATCH', 'DELETE'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/bills.ts'],
        domainServicePaths: ['src/lib/domain/billing/index.ts'],
        keepReason:
          '账单草稿更新、受控删除与金额语义已迁入共享领域服务；旧入口仅保留 compat 包装。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/bills/[id]/status/route.ts',
    routePath: '/api/bills/:id/status',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['PATCH'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/bills.ts'],
        domainServicePaths: ['src/lib/domain/billing/index.ts'],
        keepReason:
          '账单状态与金额组合语义已冻结到 Hono 正式宿主 + billing 共享领域服务。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/bills/[id]/details/route.ts',
    routePath: '/api/bills/:id/details',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/prisma.ts', 'src/lib/bill-cache.ts'],
        keepReason:
          '账单明细读取仍包含 BillDetail / legacy meterReading 兼容拼装逻辑，尚未迁入统一查询宿主。',
        exitCondition:
          '待 phase10 冻结账单明细查询与 legacy 明细兼容策略后，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/bills/[id]/utility-details/route.ts',
    routePath: '/api/bills/:id/utility-details',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/prisma.ts'],
        keepReason: '聚合账单 utility details 仍为旧读取宿主，未进入 phase09 正式迁移范围。',
        exitCondition:
          '待 phase10 明确 UTILITIES 账单详情查询宿主与读取模型后，再决定去向。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/bills/stats/route.ts',
    routePath: '/api/bills/stats',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待 phase10 以后统一处理仪表板/统计查询宿主时，再评估是否迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/bills/repair-details/route.ts',
    routePath: '/api/bills/repair-details',
    kind: 'governance',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/prisma.ts'],
        keepReason:
          '该接口承担账单修复辅助与治理用途，本任务明确不迁治理接口，也不改变旧修复入口职责。',
        exitCondition:
          '待 phase10/后续治理阶段明确 repair 工具链归属后，再决定归档、脚本化或统一宿主。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meter-readings/route.ts',
    routePath: '/api/meter-readings',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason:
          '抄表列表查询仍由旧 Next.js 查询宿主承接；phase09-04 仅迁入正式写入口与详情/关联账单追溯。',
        exitCondition:
          '待 phase10 冻结抄表查询宿主、分页模型与过滤语义后，再评估迁移或保留只读参考。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
      {
        methods: ['POST'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/meter-readings.ts'],
        domainServicePaths: ['src/lib/domain/meters/index.ts'],
        keepReason:
          '正式抄表写入、自动出账与事务边界已收口到 Hono + meters 共享领域服务；旧入口仅保留 compat 包装。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meter-readings/[id]/route.ts',
    routePath: '/api/meter-readings/:id',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'PUT', 'DELETE'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/meter-readings.ts'],
        domainServicePaths: ['src/lib/domain/meters/index.ts'],
        keepReason:
          '抄表详情、禁删门禁与“旧更新入口禁用”语义已迁入正式宿主；旧入口仅保留兼容说明与回滚价值。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meter-readings/[id]/related-bills/route.ts',
    routePath: '/api/meter-readings/:id/related-bills',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/meter-readings.ts'],
        domainServicePaths: ['src/lib/domain/meters/index.ts'],
        keepReason:
          '抄表关联账单追溯已迁入共享领域服务；旧入口只保留 compat 响应封装。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meter-readings/status-check/route.ts',
    routePath: '/api/meter-readings/status-check',
    kind: 'governance',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/prisma.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一治理抄表状态巡检与辅助入口时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meter-readings/repair-status/route.ts',
    routePath: '/api/meter-readings/repair-status',
    kind: 'governance',
    operations: [
      {
        methods: ['POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/prisma.ts'],
        keepReason:
          '抄表 repair-status 为治理/修复辅助入口，本阶段明确不迁治理接口。',
        exitCondition:
          '待后续治理阶段明确 repair-status 归属后，再决定脚本化、归档或迁移。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/utility-readings/route.ts',
    routePath: '/api/utility-readings',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: [],
        domainServicePaths: ['src/lib/domain/meters/index.ts'],
        keepReason:
          '该接口已退化为 legacy utility compat 包装，复用 meters 共享领域服务承接历史水电账单生成与追溯。',
        exitCondition:
          '统一 Hono 宿主具备替代的 utility compat/读路径，且前端与脚本不再调用旧 utility-readings。',
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/rooms/route.ts',
    routePath: '/api/rooms',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'POST', 'PATCH'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts', 'src/lib/optimized-queries.ts'],
        keepReason:
          '房间列表、创建与批量状态更新仍由旧运行线承接；phase09-02 只迁房间删除门禁，不扩展 CRUD 迁移。',
        exitCondition:
          '待 phase10 冻结房间正式查询/写入口与引用页面迁移顺序后，再评估退出路径。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/rooms/batch/route.ts',
    routePath: '/api/rooms/batch',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason: '批量房间操作仍为旧宿主能力，未进入 phase09 删除门禁迁移范围。',
        exitCondition:
          '待后续阶段明确批量房间治理能力是否保留，再决定统一宿主或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/rooms/[id]/route.ts',
    routePath: '/api/rooms/:id',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'PUT'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts', 'src/lib/prisma.ts'],
        keepReason: '房间详情与编辑仍由旧宿主承接；尚未冻结对应 Hono 正式查询/写入口。',
        exitCondition:
          '待 phase10 确定房间详情与编辑正式宿主后，再评估退出或转只读参考。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
      {
        methods: ['DELETE'],
        category: 'compat-wrapper',
        phase10Input: 'keep-compat',
        formalHosts: ['server/routes/rooms.ts'],
        domainServicePaths: ['src/lib/domain/delete-guards/index.ts'],
        keepReason:
          '房间删除门禁与受控删除已迁入共享删除门禁 + Hono 正式宿主，旧入口仅保留 compat 包装。',
        exitCondition: UNIFIED_HONO_EXIT_CONDITION,
        rollbackCondition: KEEP_COMPAT_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/rooms/[id]/status/route.ts',
    routePath: '/api/rooms/:id/status',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['PATCH'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason:
          '房间单体状态修改仍由旧运行线承接，未纳入 phase09-02 的删除门禁迁移边界。',
        exitCondition:
          '待后续阶段明确房态正式写入口与合同/退租联动边界后，再评估迁移。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/rooms/[id]/meters/route.ts',
    routePath: '/api/rooms/:id/meters',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason:
          '房间仪表列表与新增仍由旧宿主承接；仪表管理并未在 phase09-04 被整体迁入统一 Hono 宿主。',
        exitCondition:
          '待 phase10/后续阶段冻结仪表正式 CRUD 边界、解绑策略与房间联动后，再决定去向。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meters/[meterId]/route.ts',
    routePath: '/api/meters/:meterId',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['GET', 'PUT', 'DELETE'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts', 'src/lib/prisma.ts'],
        keepReason:
          '仪表详情、配置与停用/删除仍属于旧运行线存量接口；当前阶段不迁移仪表治理入口。',
        exitCondition:
          '待后续阶段明确仪表 CRUD、停用、解绑与换表正式宿主后，再评估迁移或兼容策略。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meters/[meterId]/status/route.ts',
    routePath: '/api/meters/:meterId/status',
    kind: 'domain-mainline',
    operations: [
      {
        methods: ['PATCH'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason:
          '仪表启停状态切换仍是旧运行线能力，当前阶段不迁仪表治理接口。',
        exitCondition:
          '待后续阶段冻结仪表正式管理宿主与审计策略后，再评估迁移。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/buildings/route.ts',
    routePath: '/api/buildings',
    kind: 'reference-data',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason:
          '楼栋主数据管理不在 phase09 领域服务迁移范围；旧 CRUD 继续保留。',
        exitCondition:
          '待后续阶段明确楼栋主数据正式宿主后，再评估迁移或保留旧入口。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/buildings/[id]/route.ts',
    routePath: '/api/buildings/:id',
    kind: 'reference-data',
    operations: [
      {
        methods: ['GET', 'PUT', 'DELETE'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts', 'src/lib/prisma.ts'],
        keepReason:
          '楼栋详情与删除仍为旧主数据管理接口，本阶段不扩展至该 CRUD 迁移。',
        exitCondition:
          '待后续阶段冻结楼栋主数据正式宿主与删改门禁策略后，再决定去向。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/renters/route.ts',
    routePath: '/api/renters',
    kind: 'reference-data',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts', 'src/lib/optimized-queries.ts'],
        keepReason:
          '租客列表与创建仍为旧运行线存量接口，未进入 phase09 主链服务迁移边界。',
        exitCondition:
          '待后续阶段明确租客正式查询/写入口与合同联动边界后，再评估迁移。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/renters/[id]/route.ts',
    routePath: '/api/renters/:id',
    kind: 'reference-data',
    operations: [
      {
        methods: ['GET', 'PUT', 'DELETE'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason:
          '租客详情与删改仍为旧运行线接口，尚未冻结统一 Hono 正式宿主。',
        exitCondition:
          '待后续阶段明确租客正式宿主、删除门禁与合同关联规则后，再评估迁移。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/renters/stats/route.ts',
    routePath: '/api/renters/stats',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待 phase10 以后统一处理租客统计与仪表板查询宿主时，再决定去向。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/settings/route.ts',
    routePath: '/api/settings',
    kind: 'governance',
    operations: [
      {
        methods: ['GET', 'POST', 'DELETE'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/global-settings.ts'],
        keepReason:
          '全局设置属于治理接口，本任务明确不迁治理接口；保留旧宿主避免扩大 phase09 范围。',
        exitCondition:
          '待后续治理阶段明确设置正式宿主、权限边界与审计策略后，再评估迁移。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/settings/init/route.ts',
    routePath: '/api/settings/init',
    kind: 'governance',
    operations: [
      {
        methods: ['POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/global-settings.ts'],
        keepReason:
          'settings/init 为治理/初始化辅助入口，本任务明确不迁治理接口。',
        exitCondition:
          '待后续治理阶段明确初始化脚本或管理宿主后，再决定脚本化、保留或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/validation/route.ts',
    routePath: '/api/validation',
    kind: 'governance',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/validation.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续治理阶段明确 validation 辅助接口是否改造为脚本/表单层能力后，再评估去向。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/data-consistency/route.ts',
    routePath: '/api/data-consistency',
    kind: 'governance',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/prisma.ts'],
        keepReason:
          'data-consistency 为数据治理/修复辅助接口，本任务明确不迁治理接口。',
        exitCondition:
          '待后续治理阶段明确数据一致性巡检与修复工具承接位后，再决定脚本化或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/meter-history-stats/route.ts',
    routePath: '/api/meter-history-stats',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET', 'POST'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/prisma.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一处理仪表历史统计与修复辅助宿主时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/dashboard/stats/route.ts',
    routePath: '/api/dashboard/stats',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/dashboard-queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待 phase10 以后统一处理 dashboard 查询宿主与数据聚合层时，再评估去向。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/dashboard/contract-alerts/route.ts',
    routePath: '/api/dashboard/contract-alerts',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/dashboard-queries.ts', 'src/lib/global-settings.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一处理 dashboard 告警查询宿主时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/dashboard/upcoming-contracts/route.ts',
    routePath: '/api/dashboard/upcoming-contracts',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/dashboard-queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一处理 dashboard 查询宿主时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/dashboard/leaving-tenants/route.ts',
    routePath: '/api/dashboard/leaving-tenants',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/dashboard-queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一处理 dashboard 查询宿主时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/dashboard/overdue-payments/route.ts',
    routePath: '/api/dashboard/overdue-payments',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/dashboard-queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一处理 dashboard 查询宿主时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/dashboard/unpaid-rent/route.ts',
    routePath: '/api/dashboard/unpaid-rent',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/dashboard-queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一处理 dashboard 查询宿主时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
  {
    filePath: 'src/app/api/dashboard/vacant-rooms/route.ts',
    routePath: '/api/dashboard/vacant-rooms',
    kind: 'dashboard',
    operations: [
      {
        methods: ['GET'],
        category: 'retained-legacy',
        phase10Input: 'defer-unmigrated',
        formalHosts: [],
        domainServicePaths: ['src/lib/dashboard-queries.ts'],
        keepReason: GOVERNANCE_KEEP_REASON,
        exitCondition:
          '待后续阶段统一处理 dashboard 查询宿主时，再评估迁移或归档。',
        rollbackCondition: LEGACY_RUNTIME_ROLLBACK_CONDITION,
      },
    ],
  },
] as const

export function flattenLegacyRouteInventory(): FlattenedLegacyRouteOperation[] {
  return PHASE09_06_LEGACY_ROUTE_INVENTORY.flatMap((entry) =>
    entry.operations.map((operation) => ({
      ...operation,
      filePath: entry.filePath,
      routePath: entry.routePath,
      kind: entry.kind,
    }))
  )
}

export function summarizeLegacyRouteInventory() {
  const summary = {
    files: PHASE09_06_LEGACY_ROUTE_INVENTORY.length,
    operations: 0,
    categories: {
      'formal-host-owned': 0,
      'compat-wrapper': 0,
      'retained-legacy': 0,
    } satisfies Record<LegacyRouteCategory, number>,
    phase10: {
      'exit-evaluation': 0,
      'keep-compat': 0,
      'defer-unmigrated': 0,
    } satisfies Record<Phase10InputBucket, number>,
  }

  for (const operation of flattenLegacyRouteInventory()) {
    summary.operations += 1
    summary.categories[operation.category] += 1
    summary.phase10[operation.phase10Input] += 1
  }

  return summary
}

export const PHASE09_06_LEGACY_ROUTE_PHASE10_INPUT = {
  exitEvaluation: flattenLegacyRouteInventory().filter(
    (item) => item.phase10Input === 'exit-evaluation'
  ),
  keepCompat: flattenLegacyRouteInventory().filter(
    (item) => item.phase10Input === 'keep-compat'
  ),
  deferUnmigrated: flattenLegacyRouteInventory().filter(
    (item) => item.phase10Input === 'defer-unmigrated'
  ),
} as const

export interface MinixRouteDefinition {
  path: string
  label: string
  title: string
  description: string
  nextPhase: 'phase07-02' | 'phase07-03'
}

export const minixPrimaryRoutes: MinixRouteDefinition[] = [
  {
    path: 'rooms',
    label: '房源',
    title: '房源模块承接位',
    description: '后续在此承接房源列表、房间详情、房态与仪表挂接壳，不在 phase07-01 迁移正式查询逻辑。',
    nextPhase: 'phase07-02',
  },
  {
    path: 'add',
    label: '新增',
    title: '新增入口承接位',
    description: '后续在此承接新增房间、合同与租客入口，保持既有信息架构但改由 React Router 承载。',
    nextPhase: 'phase07-02',
  },
  {
    path: 'contracts',
    label: '合同',
    title: '合同模块承接位',
    description: '后续在此承接合同列表、详情、续租与退租壳；本阶段不迁移合同业务主链逻辑。',
    nextPhase: 'phase07-02',
  },
  {
    path: 'bills',
    label: '账单',
    title: '账单模块承接位',
    description: '后续在此承接账单列表、详情与聚合视图壳；当前仅固定新主线页面宿主。',
    nextPhase: 'phase07-02',
  },
  {
    path: 'settings',
    label: '设置',
    title: '设置页承接位',
    description: '后续在此承接全局设置、部署提示与辅助入口治理，不在本阶段重做视觉体系。',
    nextPhase: 'phase07-02',
  },
  {
    path: 'login',
    label: '登录',
    title: '登录壳承接位',
    description: '后续在此承接最小认证壳与会话入口，但 phase07-01 不迁移完整鉴权链。',
    nextPhase: 'phase07-02',
  },
  {
    path: 'offline',
    label: '离线',
    title: '离线页承接位',
    description: '后续在此承接离线页与 PWA 兜底视图，继续复用现有信息架构。',
    nextPhase: 'phase07-02',
  },
]

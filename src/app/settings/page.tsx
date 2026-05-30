'use client'

import { useSettings } from '@/hooks/useSettings'
import { settingsMobileStyles } from '@/components/business/settings-mobile-styles'
import { Card, CardContent } from '@/components/ui/card'
import {
  SettingCategory,
  SettingItemConfig,
} from '@/components/business/SettingItem'
import { PageContainer } from '@/components/layout'

/**
 * 设置页面
 * 仅暴露已接入真实业务主链的全局兜底配置，以及治理入口和只读信息。
 */
export default function SettingsPage() {
  const { settings, isLoading, updateSetting, resetSettings, exportSettings } =
    useSettings()

  const openUtilityPage = (path: string) => {
    const newWindow = window.open(path, '_blank', 'noopener,noreferrer')

    if (!newWindow) {
      window.location.href = path
    }
  }

  // 处理设置项值变更
  const handleValueChange = (id: string, value: any) => {
    updateSetting(id as keyof typeof settings, value)
  }

  // 处理数据导出
  const handleExportData = () => {
    exportSettings()
  }

  const activeBusinessSettings: SettingItemConfig[] = [
    {
      id: 'electricityPrice',
      title: '电费单价',
      description: '每度电的价格，用于计算电费账单',
      type: 'input' as const,
      value: settings.electricityPrice,
      unit: '元/度',
      min: 0,
      max: 10,
      step: 0.01,
      placeholder: '请输入电费单价',
    },
    {
      id: 'waterPrice',
      title: '水费单价',
      description: '每吨水的价格，用于计算水费账单',
      type: 'input' as const,
      value: settings.waterPrice,
      unit: '元/吨',
      min: 0,
      max: 50,
      step: 0.1,
      placeholder: '请输入水费单价',
    },
    {
      id: 'gasPrice',
      title: '燃气费单价',
      description: '每立方米燃气的价格，用于计算燃气费账单',
      type: 'input' as const,
      value: settings.gasPrice,
      unit: '元/立方米',
      min: 0,
      max: 50,
      step: 0.1,
      placeholder: '请输入燃气费单价',
    },
  ]

  const contractDefaultSettings: SettingItemConfig[] = [
    {
      id: 'defaultRentCycle',
      title: '默认收租周期',
      description: '新建合同时默认带出的支付方式，不会回写历史合同',
      type: 'select' as const,
      value: settings.defaultRentCycle,
      options: [
        { label: '月付', value: 'monthly' },
        { label: '季付', value: 'quarterly' },
        { label: '半年付', value: 'semiannual' },
        { label: '年付', value: 'yearly' },
      ],
    },
    {
      id: 'defaultPaymentTiming',
      title: '默认付款时间',
      description: '新建合同时默认带出的付款时间说明',
      type: 'input' as const,
      value: settings.defaultPaymentTiming,
      placeholder: '如：每月1号前',
    },
    {
      id: 'defaultDepositMonths',
      title: '默认押金月数',
      description: '选择房间后默认按月租乘以该月数回填押金',
      type: 'input' as const,
      value: settings.defaultDepositMonths,
      unit: '个月',
      min: 0,
      max: 12,
      step: 1,
      placeholder: '请输入默认押金月数',
    },
    {
      id: 'autoGenerateContractBills',
      title: '创建合同后自动生成账单',
      description: '作为创建合同时的默认行为，仍可由主链显式覆盖',
      type: 'switch' as const,
      value: settings.autoGenerateContractBills,
    },
  ]

  const contractAlertSettings: SettingItemConfig[] = [
    {
      id: 'contractExpiryAlertDays',
      title: '合同到期提醒窗口',
      description: '用于合同列表筛选、详情提醒和离店提醒的统一到期窗口',
      type: 'input' as const,
      value: settings.contractExpiryAlertDays,
      unit: '天',
      min: 1,
      max: 180,
      step: 1,
      placeholder: '请输入合同到期提醒窗口',
    },
    {
      id: 'upcomingMoveInAlertDays',
      title: '待入住合同提醒窗口',
      description: '用于 Dashboard 待入住合同提醒的统一生效窗口',
      type: 'input' as const,
      value: settings.upcomingMoveInAlertDays,
      unit: '天',
      min: 1,
      max: 180,
      step: 1,
      placeholder: '请输入待入住合同提醒窗口',
    },
  ]

  const governanceEntrySettings: SettingItemConfig[] = [
    {
      id: 'exportData',
      title: '导出当前设置',
      description: '导出当前全局设置快照，便于排查或人工留档',
      type: 'button' as const,
      action: handleExportData,
    },
    {
      id: 'systemHealth',
      title: '系统监控',
      description: '打开系统健康页，查看依赖状态和基础运行信息',
      type: 'button' as const,
      action: () => openUtilityPage('/system-health'),
    },
    {
      id: 'dataConsistency',
      title: '数据一致性管理',
      description: '打开治理页，检查并处理数据一致性问题',
      type: 'button' as const,
      action: () => openUtilityPage('/data-consistency'),
    },
    {
      id: 'resetSettings',
      title: '重置设置',
      description:
        '恢复数据库中的全局设置默认值；这是治理操作，不会把暂未开放项重新变成正式生效配置',
      type: 'button' as const,
      action: () => {
        if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
          resetSettings()
        }
      },
    },
  ]

  const readOnlySettings: SettingItemConfig[] = [
    {
      id: 'version',
      title: '版本标识',
      description: '来自前端构建注入的版本标识；未注入时显示默认占位',
      type: 'info' as const,
      value: process.env.NEXT_PUBLIC_APP_VERSION || '未配置版本号',
    },
  ]

  const pendingSettingGroups = [
    {
      title: '提醒相关',
      items: ['账单提醒天数（reminderDays）'],
    },
    {
      title: '抄表与账单自动化相关',
      items: [
        '抄表周期',
        '自定义抄表天数',
        '抄表提醒天数（readingReminderDays）',
        '异常用量阈值',
        '自动生成账单',
        '抄表审批',
      ],
    },
    {
      title: '系统外观与外围能力相关',
      items: ['自动备份', '启用通知（enableNotifications）', '主题模式'],
    },
  ]

  if (isLoading) {
    return (
      <PageContainer title="设置" showBackButton>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">加载设置中...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="设置" showBackButton>
      <div className={settingsMobileStyles.pageSection}>
        <div className={settingsMobileStyles.introBox}>
          <p className={settingsMobileStyles.introText}>
            当前仅开放已接入主链的正式全局配置，其余能力按治理入口、只读信息或暂未开放项展示。
          </p>
        </div>

        <SettingCategory
          title="业务计费兜底配置"
          items={activeBusinessSettings}
          onValueChange={handleValueChange}
        />

        <SettingCategory
          title="合同默认配置"
          items={contractDefaultSettings}
          onValueChange={handleValueChange}
        />

        <SettingCategory
          title="窗口型提醒配置"
          items={contractAlertSettings}
          onValueChange={handleValueChange}
        />

        <SettingCategory
          title="治理与维护"
          items={governanceEntrySettings}
          onValueChange={handleValueChange}
        />

        <SettingCategory
          title="页面与环境信息"
          items={readOnlySettings}
          onValueChange={handleValueChange}
        />

        <Card className={settingsMobileStyles.card}>
          <CardContent className={settingsMobileStyles.cardContent}>
            <div className={settingsMobileStyles.noteStack}>
              <p>
                当前仅开放真正进入 Dashboard 主链的窗口型提醒配置，其余字段暂不作为正式可编辑提醒项开放，避免继续造成“可改即可生效”的误解。
              </p>
              {pendingSettingGroups.map((group) => (
                <div
                  key={group.title}
                  className={settingsMobileStyles.noteGroup}
                >
                  <strong>{group.title}：</strong>
                  {group.items.join('、')}。
                </div>
              ))}
              <p>待完成真实主链适配或治理方案冻结后，再决定是否恢复为正式可编辑配置。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

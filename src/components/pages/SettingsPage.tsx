'use client'

import { useSettings, type AppSettings } from '@/hooks/useSettings'
import { settingsMobileStyles } from '@/components/business/settings-mobile-styles'
import {
  SettingCategory,
  type SettingItemConfig,
} from '@/components/business/SettingItem'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SettingsPageProps {
  initialSettings?: Partial<AppSettings>
  appVersion?: string
  onOpenUtilityPage?: (path: string) => void
}

export function SettingsPage({
  initialSettings,
  appVersion = '未配置版本号',
  onOpenUtilityPage,
}: SettingsPageProps) {
  const { settings, isLoading, updateSetting, resetSettings, exportSettings } =
    useSettings(initialSettings)

  const openUtilityPage = (path: string) => {
    if (onOpenUtilityPage) {
      onOpenUtilityPage(path)
      return
    }

    const newWindow = window.open(path, '_blank', 'noopener,noreferrer')

    if (!newWindow) {
      window.location.assign(path)
    }
  }

  const handleValueChange = (id: string, value: any) => {
    updateSetting(id as keyof typeof settings, value)
  }

  const handleExportData = () => {
    exportSettings()
  }

  const activeBusinessSettings: SettingItemConfig[] = [
    {
      id: 'electricityPrice',
      title: '电费单价',
      description: '每度电的价格，用于计算电费账单',
      type: 'input',
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
      type: 'input',
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
      type: 'input',
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
      type: 'select',
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
      type: 'input',
      value: settings.defaultPaymentTiming,
      placeholder: '如：每月1号前',
    },
    {
      id: 'defaultDepositMonths',
      title: '默认押金月数',
      description: '选择房间后默认按月租乘以该月数回填押金',
      type: 'input',
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
      type: 'switch',
      value: settings.autoGenerateContractBills,
    },
  ]

  const contractAlertSettings: SettingItemConfig[] = [
    {
      id: 'contractExpiryAlertDays',
      title: '合同到期提醒窗口',
      description:
        '用于合同列表/详情提醒，以及账单列表卡片“今日到期 / X 天后到期 / 已逾期 X 天”的统一窗口；缺省时回退到全局默认值',
      type: 'input',
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
      type: 'input',
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
      type: 'button',
      action: handleExportData,
    },
    {
      id: 'systemHealth',
      title: '系统监控',
      description: '打开系统健康页，查看依赖状态和基础运行信息',
      type: 'button',
      action: () => openUtilityPage('/system-health'),
    },
    {
      id: 'dataConsistency',
      title: '数据一致性管理',
      description: '打开治理页，检查并处理数据一致性问题',
      type: 'button',
      action: () => openUtilityPage('/data-consistency'),
    },
    {
      id: 'resetSettings',
      title: '重置设置',
      description:
        '恢复数据库中的全局设置默认值；这是治理操作，不会把暂未开放项重新变成正式生效配置',
      type: 'button',
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
      type: 'info',
      value: appVersion,
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
          <div className={settingsMobileStyles.noteGroup}>
            <div className="text-sm font-medium leading-5 text-blue-900">
              范围说明
            </div>
            <p className={settingsMobileStyles.introText}>
              当前页面仅承接全局计费兜底、合同默认值、提醒窗口、治理入口与页面环境信息。
            </p>
            <p className={settingsMobileStyles.introText}>
              这里保存的是后续流程默认配置，不会直接改写历史合同、历史账单或既有抄表记录。
            </p>
            <p className={settingsMobileStyles.introText}>
              其中“合同到期提醒窗口”当前同时作为合同提醒与账单列表卡片状态跟踪提示的全局兜底阈值。
            </p>
          </div>
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

        <Card className={settingsMobileStyles.card}>
          <CardHeader className={settingsMobileStyles.cardHeader}>
            <CardTitle className={settingsMobileStyles.cardTitle}>
              暂未开放项说明
            </CardTitle>
          </CardHeader>
          <CardContent className={settingsMobileStyles.cardContent}>
            <div className={settingsMobileStyles.noteStack}>
              <div className={settingsMobileStyles.noteGroup}>
                <div className="text-sm font-medium leading-5 text-gray-900">
                  提醒相关
                </div>
                <ul className="list-disc space-y-1 pl-5">
                  <li>合同到期提醒窗口当前同时服务合同提醒与账单卡片状态跟踪提示。</li>
                  <li>账单列表卡片不单独新增第二套窗口设置，继续复用这一全局阈值。</li>
                  <li>通知偏好、提醒渠道和角色级提醒策略当前仍未在本页开放。</li>
                </ul>
              </div>
              <div className={settingsMobileStyles.noteGroup}>
                <div className="text-sm font-medium leading-5 text-gray-900">
                  抄表与账单自动化
                </div>
                <ul className="list-disc space-y-1 pl-5">
                  <li>抄表异常阈值、抄表审批和自动生成账单等能力当前仍未在本页开放。</li>
                </ul>
              </div>
              <div className={settingsMobileStyles.noteGroup}>
                <div className="text-sm font-medium leading-5 text-gray-900">
                  系统外观与外围能力
                </div>
                <ul className="list-disc space-y-1 pl-5">
                  <li>主题外观、自动备份、PWA 缓存治理等能力当前仍未在本页开放。</li>
                  <li>出现治理入口不代表这些能力已经成为正式可配项。</li>
                </ul>
              </div>
              <p>
                如需扩展新的全局设置项，仍需先完成业务接线、作用范围说明和历史兼容判断，再进入正式默认配置。
              </p>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </PageContainer>
  )
}

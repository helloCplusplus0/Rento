'use client'

import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout'
import { SettingCategory, SettingItemConfig } from '@/components/business/SettingItem'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// 由于这是客户端组件，我们需要在组件外部定义元数据
// 或者创建一个单独的元数据文件
const pageMetadata = {
  title: '系统设置',
  description: '配置系统参数，管理水电单价和应用偏好设置'
}

/**
 * 设置页面
 * 提供系统参数配置功能，包括水电单价、租金周期等
 */
export default function SettingsPage() {
  const { 
    settings, 
    isLoading, 
    updateSetting, 
    resetSettings, 
    exportSettings 
  } = useSettings()

  // 处理设置项值变更
  const handleValueChange = (id: string, value: any) => {
    updateSetting(id as keyof typeof settings, value)
  }

  // 处理数据导出
  const handleExportData = () => {
    // 这里可以扩展为导出所有业务数据
    exportSettings()
  }

  // 处理数据备份
  const handleBackupData = () => {
    // 这里可以实现数据备份逻辑
    console.log('执行数据备份...')
    // TODO: 实现实际的备份功能
  }

  // 基础设置配置
  const basicSettings: SettingItemConfig[] = [
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
      placeholder: '请输入电费单价'
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
      placeholder: '请输入水费单价'
    },
    {
      id: 'defaultRentCycle',
      title: '默认租金周期',
      description: '新建合同时的默认付款周期',
      type: 'select' as const,
      value: settings.defaultRentCycle,
      options: [
        { label: '月付', value: 'monthly' },
        { label: '季付', value: 'quarterly' },
        { label: '半年付', value: 'semi_annually' },
        { label: '年付', value: 'annually' }
      ]
    },
    {
      id: 'reminderDays',
      title: '提醒天数',
      description: '合同到期前多少天开始提醒',
      type: 'input' as const,
      value: settings.reminderDays,
      unit: '天',
      min: 1,
      max: 90,
      step: 1,
      placeholder: '请输入提醒天数'
    }
  ]

  // 系统设置配置
  const systemSettings: SettingItemConfig[] = [
    {
      id: 'autoBackup',
      title: '自动备份',
      description: '每日自动备份重要数据',
      type: 'switch' as const,
      value: settings.autoBackup
    },
    {
      id: 'enableNotifications',
      title: '启用通知',
      description: '接收系统通知和提醒',
      type: 'switch' as const,
      value: settings.enableNotifications
    },
    {
      id: 'theme',
      title: '主题模式',
      description: '选择应用的外观主题',
      type: 'select' as const,
      value: settings.theme,
      options: [
        { label: '浅色模式', value: 'light' },
        { label: '深色模式', value: 'dark' },
        { label: '跟随系统', value: 'system' }
      ]
    }
  ]

  // 抄表设置配置
  const readingSettings: SettingItemConfig[] = [
    {
      id: 'readingCycle',
      title: '抄表周期',
      description: '设置默认的抄表周期',
      type: 'select' as const,
      value: settings.readingCycle,
      options: [
        { label: '月度抄表', value: 'monthly' },
        { label: '季度抄表', value: 'quarterly' },
        { label: '自定义', value: 'custom' }
      ]
    },
    ...(settings.readingCycle === 'custom' ? [{
      id: 'customReadingDays',
      title: '自定义抄表天数',
      description: '自定义抄表周期的天数',
      type: 'input' as const,
      value: settings.customReadingDays || 30,
      unit: '天',
      min: 1,
      max: 365,
      step: 1,
      placeholder: '请输入抄表周期天数'
    }] : []),
    {
      id: 'readingReminderDays',
      title: '抄表提醒天数',
      description: '抄表到期前多少天开始提醒',
      type: 'input' as const,
      value: settings.readingReminderDays,
      unit: '天',
      min: 1,
      max: 30,
      step: 1,
      placeholder: '请输入抄表提醒天数'
    },
    {
      id: 'usageAnomalyThreshold',
      title: '异常用量阈值',
      description: '超过平均用量多少倍视为异常',
      type: 'input' as const,
      value: settings.usageAnomalyThreshold,
      unit: '倍',
      min: 1.5,
      max: 10,
      step: 0.5,
      placeholder: '请输入异常用量阈值'
    },
    {
      id: 'autoGenerateBills',
      title: '自动生成账单',
      description: '抄表完成后自动生成水电费账单',
      type: 'switch' as const,
      value: settings.autoGenerateBills
    },
    {
      id: 'requireReadingApproval',
      title: '需要抄表审批',
      description: '抄表数据需要审批后才能生效',
      type: 'switch' as const,
      value: settings.requireReadingApproval
    }
  ]

  // 数据管理配置
  const dataManagementSettings: SettingItemConfig[] = [
    {
      id: 'exportData',
      title: '导出数据',
      description: '导出设置数据到本地文件',
      type: 'button' as const,
      action: handleExportData
    },
    {
      id: 'backupData',
      title: '备份数据',
      description: '手动备份所有业务数据',
      type: 'button' as const,
      action: handleBackupData
    },
    {
      id: 'dataConsistency',
      title: '数据一致性管理',
      description: '检查和修复系统数据一致性问题',
      type: 'button' as const,
      action: () => window.open('/data-consistency', '_blank')
    }
  ]

  // 应用信息配置
  const appInfoSettings: SettingItemConfig[] = [
    {
      id: 'version',
      title: '应用版本',
      description: '当前应用的版本号',
      type: 'info' as const,
      value: 'v1.0.0'
    },
    {
      id: 'buildDate',
      title: '构建日期',
      description: '应用的构建时间',
      type: 'info' as const,
      value: new Date().toLocaleDateString()
    }
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
      <div className="space-y-6 pb-6">
        {/* 基础设置 */}
        <SettingCategory
          title="基础设置"
          items={basicSettings}
          onValueChange={handleValueChange}
        />

        {/* 抄表设置 */}
        <SettingCategory
          title="抄表设置"
          items={readingSettings}
          onValueChange={handleValueChange}
        />

        {/* 系统设置 */}
        <SettingCategory
          title="系统设置"
          items={systemSettings}
          onValueChange={handleValueChange}
        />

        {/* 数据管理 */}
        <SettingCategory
          title="数据管理"
          items={dataManagementSettings}
          onValueChange={handleValueChange}
        />

        {/* 应用信息 */}
        <SettingCategory
          title="应用信息"
          items={appInfoSettings}
          onValueChange={handleValueChange}
        />

        {/* 重置设置 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <strong>自定义抄表周期：</strong>当选择自定义时，可以设置具体的抄表周期天数。
              </div>
              <div>
                <strong>抄表周期：</strong>设置默认的抄表周期，可以是月度、季度或自定义周期。
              </div>
              <div>
                <strong>抄表提醒：</strong>在抄表到期前多少天开始提醒，帮助您及时进行抄表录入。
              </div>
              <div>
                <strong>异常用量阈值：</strong>当用量超过平均用量的指定倍数时，系统会标记为异常并提醒。
              </div>
              <div>
                <strong>自动生成账单：</strong>开启后，抄表完成会自动生成对应的水电费账单。
              </div>
              <div>
                <strong>抄表审批：</strong>开启后，抄表数据需要审批确认后才能生效和生成账单。
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">重置设置</h3>
                <p className="text-sm text-gray-500">
                  将所有设置恢复为默认值，此操作不可撤销
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
                    resetSettings()
                  }
                }}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                重置设置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">使用说明</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong>电费单价：</strong>设置每度电的价格，系统会根据此价格自动计算电费账单。
              </div>
              <div>
                <strong>水费单价：</strong>设置每吨水的价格，系统会根据此价格自动计算水费账单。
              </div>
              <div>
                <strong>默认租金周期：</strong>新建合同时的默认付款周期，可以在创建合同时修改。
              </div>
              <div>
                <strong>提醒天数：</strong>合同到期前多少天开始显示提醒，帮助您及时处理续约事宜。
              </div>
              <div>
                <strong>自动备份：</strong>开启后系统会定期备份重要数据，确保数据安全。
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
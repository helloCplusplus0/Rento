'use client'

import { useState } from 'react'

import type { ContractStatus } from '@/lib/colors'
import type { ContractWithDetailsForClient } from '@/types/database'
import { formatDate } from '@/lib/format'
import {
  formatClientApiError,
  readClientApiError,
} from '@/lib/client-api-error'
import { contractEditMobileStyles } from '@/components/pages/contract-edit-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContractStatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  goBackWithHost,
  navigateWithHost,
  type PageHostNavigation,
} from './page-host-navigation'

interface EditContractPageSimpleProps {
  contract: ContractWithDetailsForClient
  navigation?: PageHostNavigation
}

/**
 * 简化的合同编辑页面组件
 * 专门用于编辑合同，不复用添加合同的逻辑
 * 只允许编辑签约信息，确保合同的完整性和安全性
 */
export function EditContractPageSimple({
  contract,
  navigation,
}: EditContractPageSimpleProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    signedBy: contract.signedBy || '',
    signedDate: contract.signedDate
      ? contract.signedDate.toISOString().split('T')[0]
      : '',
    remarks: contract.remarks || '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const apiError = await readClientApiError(response, '更新合同失败')
        throw new Error(
          formatClientApiError(apiError, {
            defaultTitle: '更新合同失败',
            includeCode: true,
          })
        )
      }

      // 更新后刷新详情页，避免继续展示旧合同快照
      navigateWithHost(navigation, `/contracts/${contract.id}`, {
        replace: true,
      })
    } catch (error) {
      console.error('更新合同失败:', error)
      alert(error instanceof Error ? error.message : '更新合同失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    goBackWithHost(navigation, `/contracts/${contract.id}`)
  }

  return (
    <PageContainer title="编辑合同" showBackButton>
      <div className={contractEditMobileStyles.pageSection}>
        <form
          onSubmit={handleSubmit}
          className={contractEditMobileStyles.formStack}
        >
          {/* 合同基本信息展示 */}
          <Card className={contractEditMobileStyles.card}>
            <CardHeader className={contractEditMobileStyles.cardHeader}>
              <CardTitle className={contractEditMobileStyles.cardTitle}>
                合同信息
              </CardTitle>
            </CardHeader>
            <CardContent className={contractEditMobileStyles.cardContent}>
              <div className={contractEditMobileStyles.summaryGrid}>
                <div className={contractEditMobileStyles.fieldBlock}>
                  <Label className={contractEditMobileStyles.fieldLabel}>
                    合同编号
                  </Label>
                  <p className={contractEditMobileStyles.fieldValueMono}>
                    {contract.contractNumber}
                  </p>
                </div>
                <div className={contractEditMobileStyles.fieldBlock}>
                  <Label className={contractEditMobileStyles.fieldLabel}>
                    合同状态
                  </Label>
                  <div className={contractEditMobileStyles.statusBadgeWrapper}>
                    <ContractStatusBadge
                      status={contract.status as ContractStatus}
                    />
                  </div>
                </div>
                <div className={contractEditMobileStyles.fieldBlock}>
                  <Label className={contractEditMobileStyles.fieldLabel}>
                    租客
                  </Label>
                  <p className={contractEditMobileStyles.fieldValue}>
                    {contract.renter.name}
                  </p>
                </div>
                <div className={contractEditMobileStyles.fieldBlock}>
                  <Label className={contractEditMobileStyles.fieldLabel}>
                    房间
                  </Label>
                  <p className={contractEditMobileStyles.fieldValue}>
                    {contract.room.building.name} - {contract.room.roomNumber}
                  </p>
                </div>
                <div className={contractEditMobileStyles.fieldBlock}>
                  <Label className={contractEditMobileStyles.fieldLabel}>
                    合同期限
                  </Label>
                  <p className={contractEditMobileStyles.fieldValue}>
                    {formatDate(contract.startDate)} -{' '}
                    {formatDate(contract.endDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 编辑说明 */}
          <div className={contractEditMobileStyles.helperCard}>
            <h3 className={contractEditMobileStyles.helperTitle}>编辑说明</h3>
            <div className={contractEditMobileStyles.helperList}>
              <p>
                • 为保证合同的完整性和法律效力，生效中的合同只允许编辑签约信息
              </p>
              <p>• 费用信息、支付方式、合同期限等核心条款不可修改</p>
              <p>• 如需调整费用或条款，请通过合同续约功能处理</p>
            </div>
          </div>

          {/* 签约信息编辑 */}
          <Card className={contractEditMobileStyles.card}>
            <CardHeader className={contractEditMobileStyles.cardHeader}>
              <CardTitle className={contractEditMobileStyles.cardTitle}>
                签约信息
              </CardTitle>
              <p className={contractEditMobileStyles.cardDescription}>
                签约人通常为租客本人，如有代签情况请确保信息准确
              </p>
            </CardHeader>
            <CardContent className={contractEditMobileStyles.cardContent}>
              <div className={contractEditMobileStyles.formGrid}>
                <div>
                  <Label
                    htmlFor="signedBy"
                    className={contractEditMobileStyles.formLabel}
                  >
                    签约人 *
                  </Label>
                  <Input
                    id="signedBy"
                    value={formData.signedBy}
                    onChange={(e) =>
                      handleInputChange('signedBy', e.target.value)
                    }
                    disabled={loading}
                    placeholder="签约人姓名"
                    required
                    className={contractEditMobileStyles.input}
                  />
                  <p className={contractEditMobileStyles.helperText}>
                    合同签署人，通常为租客本人
                  </p>
                </div>
                <div>
                  <Label
                    htmlFor="signedDate"
                    className={contractEditMobileStyles.formLabel}
                  >
                    签约日期
                  </Label>
                  <Input
                    id="signedDate"
                    type="date"
                    value={formData.signedDate}
                    onChange={(e) =>
                      handleInputChange('signedDate', e.target.value)
                    }
                    disabled={loading}
                    className={contractEditMobileStyles.input}
                  />
                  <p className={contractEditMobileStyles.helperText}>
                    合同正式签署的日期
                  </p>
                </div>
              </div>

              {/* 备注字段 */}
              <div>
                <Label
                  htmlFor="remarks"
                  className={contractEditMobileStyles.formLabel}
                >
                  备注
                </Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  disabled={loading}
                  placeholder="合同备注信息（可选）"
                  rows={3}
                  className={contractEditMobileStyles.textarea}
                />
                <p className={contractEditMobileStyles.helperText}>
                  可以记录合同相关的特殊说明或注意事项
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className={contractEditMobileStyles.actionsCard}>
            <div className={contractEditMobileStyles.actionsRow}>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className={contractEditMobileStyles.actionButton}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={contractEditMobileStyles.actionButton}
              >
                {loading ? '保存中...' : '保存修改'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}

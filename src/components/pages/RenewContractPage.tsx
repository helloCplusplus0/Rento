'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  RefreshCw,
} from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import {
  formatClientApiError,
  readClientApiError,
} from '@/lib/client-api-error'
import type { ContractWithDetailsForClient } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ContractStatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { ContractBillPreview } from '@/components/business/ContractBillPreview'
import { EnhancedErrorAlert } from '@/components/business/EnhancedErrorAlert'
import { SimpleErrorAlert } from '@/components/business/ErrorAlert'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  goBackWithHost,
  navigateWithHost,
  type PageHostNavigation,
} from './page-host-navigation'
import { renewContractMobileStyles } from './renew-contract-mobile-styles'

interface RenewContractFormData {
  newStartDate: string
  newEndDate: string
  newMonthlyRent: number
  newDeposit?: number
  newKeyDeposit?: number
  newCleaningFee?: number
  paymentMethod?: string
  paymentTiming?: string
  signedBy?: string
  signedDate?: string
  remarks?: string
}

interface RenewContractPageProps {
  contractId: string
  initialContract?: ContractWithDetailsForClient | null
  navigation?: PageHostNavigation
}

/**
 * 续租页面组件
 * 根据renew_lease_chart.md设计实现
 */
export function RenewContractPage({
  contractId,
  initialContract = null,
  navigation,
}: RenewContractPageProps) {
  const [contract, setContract] = useState<ContractWithDetailsForClient | null>(
    initialContract
  )
  const [loading, setLoading] = useState(!initialContract)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<RenewContractFormData>({
    newStartDate: '',
    newEndDate: '',
    newMonthlyRent: 0,
    newDeposit: 0,
    newKeyDeposit: 0,
    newCleaningFee: 0,
    paymentMethod: '',
    paymentTiming: '',
    signedBy: '',
    signedDate: '',
    remarks: '',
  })

  // 1. 续租申请阶段 - 获取原合同详情
  useEffect(() => {
    const applyContractDefaults = (contractData: ContractWithDetailsForClient) => {
      setContract(contractData)

      const originalEndDate = new Date(contractData.endDate)
      const newStartDate = new Date(originalEndDate)
      newStartDate.setDate(newStartDate.getDate() + 1)

      const newEndDate = new Date(newStartDate)
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
      newEndDate.setDate(newEndDate.getDate() - 1)

      setFormData({
        newStartDate: newStartDate.toISOString().split('T')[0],
        newEndDate: newEndDate.toISOString().split('T')[0],
        newMonthlyRent: Number(contractData.monthlyRent),
        newDeposit: Number(contractData.deposit),
        newKeyDeposit: Number(contractData.keyDeposit) || 0,
        newCleaningFee: Number(contractData.cleaningFee) || 0,
        paymentMethod: contractData.paymentMethod || '',
        paymentTiming: contractData.paymentTiming || '',
        signedBy: contractData.signedBy || '',
        signedDate: contractData.signedDate
          ? new Date(contractData.signedDate).toISOString().split('T')[0]
          : '',
        remarks: contractData.remarks || '',
      })
    }

    if (initialContract) {
      applyContractDefaults(initialContract)
      setLoading(false)
      return
    }

    const fetchContract = async () => {
      try {
        setLoading(true)
        setError(null)
        setErrorType(null)

        const response = await fetch(`/api/contracts/${contractId}`)
        if (!response.ok) {
          const apiError = await readClientApiError(response, '获取合同信息失败')
          setErrorType(
            typeof apiError.payload.errorType === 'string'
              ? apiError.payload.errorType
              : null
          )
          throw new Error(
            formatClientApiError(apiError, {
              defaultTitle: '获取合同信息失败',
              includeCode: true,
            })
          )
        }

        const result = await response.json()
        const contractData = result.success ? result.data : result
        applyContractDefaults(contractData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取合同信息失败')
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [contractId, initialContract])

  // 2. 前端表单验证
  const validateForm = (): string | null => {
    if (!formData.newStartDate) return '请选择新合同开始日期'
    if (!formData.newEndDate) return '请选择新合同结束日期'
    if (formData.newMonthlyRent <= 0) return '月租金必须大于0'

    const startDate = new Date(formData.newStartDate)
    const endDate = new Date(formData.newEndDate)

    if (endDate <= startDate) return '结束日期必须晚于开始日期'

    return null
  }

  // 3. 提交续租申请
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)
    setErrorType(null)

    try {
      const response = await fetch(`/api/contracts/${contractId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const apiError = await readClientApiError(response, '续租失败')
        setErrorType(
          typeof apiError.payload.errorType === 'string'
            ? apiError.payload.errorType
            : null
        )
        throw new Error(
          formatClientApiError(apiError, {
            defaultTitle: '续租失败',
            includeCode: true,
          })
        )
      }

      const result = await response.json()
      setSuccess(true)

      // 显示成功弹框提示
      setTimeout(() => {
        navigateWithHost(navigation, `/contracts/${result.data.newContract.id}`, {
          replace: true,
        })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '续租失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (
    field: keyof RenewContractFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError(null)
    setErrorType(null)
  }

  if (loading) {
    return (
      <PageContainer title="续租合同" showBackButton>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      </PageContainer>
    )
  }

  if (!contract) {
    return (
      <PageContainer title="续租合同" showBackButton>
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            合同不存在
          </h2>
          <p className="text-gray-600">无法找到指定的合同信息</p>
        </div>
      </PageContainer>
    )
  }

  if (success) {
    return (
      <PageContainer title="续租合同" showBackButton>
        <div className="py-12 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">续租成功</h2>
          <p className="mb-4 text-gray-600">
            新合同已创建，正在跳转到合同详情页...
          </p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-green-500"></div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="续租合同" showBackButton>
      <div className={renewContractMobileStyles.pageSection}>
        {/* 原合同信息展示 */}
        <Card className={renewContractMobileStyles.card}>
          <CardHeader className={renewContractMobileStyles.cardHeader}>
            <CardTitle className={renewContractMobileStyles.cardTitle}>
              <FileText className="h-5 w-5 text-blue-600" />
              原合同信息
            </CardTitle>
          </CardHeader>
          <CardContent className={renewContractMobileStyles.cardContent}>
            <div className={renewContractMobileStyles.summaryGrid}>
              <div className={renewContractMobileStyles.fieldBlock}>
                <Label className={renewContractMobileStyles.fieldLabel}>
                  合同编号
                </Label>
                <p className={renewContractMobileStyles.fieldValueMono}>
                  {contract.contractNumber}
                </p>
              </div>
              <div className={renewContractMobileStyles.fieldBlock}>
                <Label className={renewContractMobileStyles.fieldLabel}>
                  合同状态
                </Label>
                <div className={renewContractMobileStyles.statusBadgeWrapper}>
                  <ContractStatusBadge status={contract.status as any} />
                </div>
              </div>
              <div className={renewContractMobileStyles.fieldBlock}>
                <Label className={renewContractMobileStyles.fieldLabel}>
                  租客
                </Label>
                <p className={renewContractMobileStyles.fieldValue}>
                  {contract.renter?.name || '未知租客'}
                </p>
              </div>
              <div
                className={`${renewContractMobileStyles.fieldBlock} ${renewContractMobileStyles.summaryWideField}`}
              >
                <Label className={renewContractMobileStyles.fieldLabel}>
                  房间
                </Label>
                <p className={renewContractMobileStyles.fieldValue}>
                  {contract.room?.building?.name || '未知楼栋'} -{' '}
                  {contract.room?.roomNumber || '未知房间'}
                </p>
              </div>
              <div
                className={`${renewContractMobileStyles.fieldBlock} ${renewContractMobileStyles.summaryWideField}`}
              >
                <Label className={renewContractMobileStyles.fieldLabel}>
                  合同期限
                </Label>
                <p className={renewContractMobileStyles.fieldValue}>
                  {formatDate(contract.startDate)} -{' '}
                  {formatDate(contract.endDate)}
                </p>
              </div>
              <div className={renewContractMobileStyles.fieldBlock}>
                <Label className={renewContractMobileStyles.fieldLabel}>
                  月租金
                </Label>
                <p className={renewContractMobileStyles.fieldValueAccent}>
                  {formatCurrency(Number(contract.monthlyRent) || 0)}
                </p>
              </div>
              <div className={renewContractMobileStyles.fieldBlock}>
                <Label className={renewContractMobileStyles.fieldLabel}>
                  总租金
                </Label>
                <p className={renewContractMobileStyles.fieldValueAccent}>
                  {formatCurrency(Number(contract.totalRent) || 0)}
                </p>
              </div>
              <div className={renewContractMobileStyles.fieldBlock}>
                <Label className={renewContractMobileStyles.fieldLabel}>
                  押金
                </Label>
                <p className={renewContractMobileStyles.fieldValue}>
                  {formatCurrency(Number(contract.deposit) || 0)}
                </p>
              </div>
              {contract.keyDeposit && (
                <div className={renewContractMobileStyles.fieldBlock}>
                  <Label className={renewContractMobileStyles.fieldLabel}>
                    钥匙押金
                  </Label>
                  <p className={renewContractMobileStyles.fieldValue}>
                    {formatCurrency(Number(contract.keyDeposit))}
                  </p>
                </div>
              )}
              {contract.cleaningFee && (
                <div className={renewContractMobileStyles.fieldBlock}>
                  <Label className={renewContractMobileStyles.fieldLabel}>
                    清洁费
                  </Label>
                  <p className={renewContractMobileStyles.fieldValue}>
                    {formatCurrency(Number(contract.cleaningFee))}
                  </p>
                </div>
              )}
              <div className={renewContractMobileStyles.fieldBlock}>
                <Label className={renewContractMobileStyles.fieldLabel}>
                  付款方式
                </Label>
                <p className={renewContractMobileStyles.fieldValue}>
                  {contract.paymentMethod || '月付'}
                </p>
              </div>
              {contract.paymentTiming && (
                <div className={renewContractMobileStyles.fieldBlock}>
                  <Label className={renewContractMobileStyles.fieldLabel}>
                    收租时间
                  </Label>
                  <p className={renewContractMobileStyles.fieldValue}>
                    {contract.paymentTiming}
                  </p>
                </div>
              )}
              {contract.signedBy && (
                <div className={renewContractMobileStyles.fieldBlock}>
                  <Label className={renewContractMobileStyles.fieldLabel}>
                    签约人
                  </Label>
                  <p className={renewContractMobileStyles.fieldValue}>
                    {contract.signedBy}
                  </p>
                </div>
              )}
              {contract.signedDate && (
                <div className={renewContractMobileStyles.fieldBlock}>
                  <Label className={renewContractMobileStyles.fieldLabel}>
                    签约日期
                  </Label>
                  <p className={renewContractMobileStyles.fieldValue}>
                    {formatDate(contract.signedDate)}
                  </p>
                </div>
              )}
              {contract.businessStatus && (
                <div className={renewContractMobileStyles.fieldBlock}>
                  <Label className={renewContractMobileStyles.fieldLabel}>
                    业务状态
                  </Label>
                  <p className={renewContractMobileStyles.fieldValue}>
                    {contract.businessStatus}
                  </p>
                </div>
              )}
              {contract.isExtended && (
                <div className={renewContractMobileStyles.fieldBlock}>
                  <Label className={renewContractMobileStyles.fieldLabel}>
                    是否延期
                  </Label>
                  <Badge variant="secondary">已延期</Badge>
                </div>
              )}
            </div>

            {/* 原合同备注信息 */}
            {contract.remarks && (
              <div className={renewContractMobileStyles.noteSection}>
                <Label
                  className={`${renewContractMobileStyles.fieldLabel} mb-1.5 block sm:mb-2`}
                >
                  原合同备注
                </Label>
                <div className={renewContractMobileStyles.noteBox}>
                  <p className={renewContractMobileStyles.noteText}>
                    {contract.remarks}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 续租表单 */}
        <Card className={renewContractMobileStyles.card}>
          <CardHeader className={renewContractMobileStyles.cardHeader}>
            <CardTitle className={renewContractMobileStyles.cardTitle}>
              <RefreshCw className="h-5 w-5 text-green-600" />
              续租信息
            </CardTitle>
          </CardHeader>
          <CardContent className={renewContractMobileStyles.cardContent}>
            <form
              onSubmit={handleSubmit}
              className={renewContractMobileStyles.formStack}
            >
              {/* 错误提示 */}
              {error && (
                <EnhancedErrorAlert
                  title="续租失败"
                  message={error}
                  errorType={errorType || undefined}
                  onRetry={() => {
                    setError(null)
                    setErrorType(null)
                  }}
                />
              )}

              {/* 续租期限 */}
              <div className={renewContractMobileStyles.formGrid}>
                <div>
                  <Label
                    htmlFor="newStartDate"
                    className={renewContractMobileStyles.formLabel}
                  >
                    <Calendar className="h-4 w-4" />
                    新合同开始日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newStartDate"
                    type="date"
                    value={formData.newStartDate}
                    onChange={(e) =>
                      handleInputChange('newStartDate', e.target.value)
                    }
                    disabled={submitting}
                    className={renewContractMobileStyles.input}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="newEndDate"
                    className={renewContractMobileStyles.formLabel}
                  >
                    <Calendar className="h-4 w-4" />
                    新合同结束日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newEndDate"
                    type="date"
                    value={formData.newEndDate}
                    onChange={(e) =>
                      handleInputChange('newEndDate', e.target.value)
                    }
                    disabled={submitting}
                    className={renewContractMobileStyles.input}
                  />
                </div>
              </div>

              {/* 租金信息 */}
              <div className={renewContractMobileStyles.formSection}>
                <h4 className={renewContractMobileStyles.sectionTitle}>
                  租金信息
                </h4>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  续租页字段默认继承原合同且保持可编辑，但系统只会自动生成租金账单与卫生费账单。
                  若本次续租需要补收押金或钥匙押金，请在续租完成后通过“新增账单”单独处理。
                </div>
                <div className={renewContractMobileStyles.formGrid}>
                  <div>
                    <Label
                      htmlFor="newMonthlyRent"
                      className={renewContractMobileStyles.formLabel}
                    >
                      <DollarSign className="h-4 w-4" />
                      月租金 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="newMonthlyRent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.newMonthlyRent}
                      onChange={(e) =>
                        handleInputChange(
                          'newMonthlyRent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={submitting}
                      className={renewContractMobileStyles.input}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="newDeposit"
                      className={renewContractMobileStyles.formLabel}
                    >
                      押金
                    </Label>
                    <Input
                      id="newDeposit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.newDeposit || 0}
                      onChange={(e) =>
                        handleInputChange(
                          'newDeposit',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={submitting}
                      className={renewContractMobileStyles.input}
                    />
                    <p className={renewContractMobileStyles.helperText}>
                      续租时押金默认继承且可调整；调整后会作为合同事实保留，若需补收请在续租完成后新增账单
                    </p>
                  </div>
                </div>

                <div className={renewContractMobileStyles.formGrid}>
                  <div>
                    <Label
                      htmlFor="newKeyDeposit"
                      className={renewContractMobileStyles.formLabel}
                    >
                      钥匙押金
                    </Label>
                    <Input
                      id="newKeyDeposit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.newKeyDeposit || 0}
                      onChange={(e) =>
                        handleInputChange(
                          'newKeyDeposit',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={submitting}
                      className={renewContractMobileStyles.input}
                    />
                    <p className={renewContractMobileStyles.helperText}>
                      续租时钥匙押金默认继承且可调整；调整后不会自动出账，若需补收请在续租完成后新增账单
                    </p>
                  </div>
                  <div>
                    <Label
                      htmlFor="newCleaningFee"
                      className={renewContractMobileStyles.formLabel}
                    >
                      清洁费
                    </Label>
                    <Input
                      id="newCleaningFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.newCleaningFee || 0}
                      onChange={(e) =>
                        handleInputChange(
                          'newCleaningFee',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={submitting}
                      className={renewContractMobileStyles.input}
                    />
                    <p className={renewContractMobileStyles.helperText}>
                      清洁费为一次性费用，收取后不退还
                    </p>
                  </div>
                </div>
                <div className={renewContractMobileStyles.noteBox}>
                  <p className={renewContractMobileStyles.noteText}>
                    续租默认只会自动生成租金和卫生费账单。若本次续租需要补收押金或钥匙押金，请在续租完成后通过“新增账单”单独处理；这里的押金字段调整仅用于保留合同事实与后续退租结算语义。
                  </p>
                </div>
              </div>

              {/* 支付信息 */}
              <div className={renewContractMobileStyles.formSection}>
                <h4 className={renewContractMobileStyles.sectionTitle}>
                  支付信息
                </h4>
                <div className={renewContractMobileStyles.formGrid}>
                  <div>
                    <Label
                      htmlFor="paymentMethod"
                      className={renewContractMobileStyles.formLabel}
                    >
                      支付方式
                    </Label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        handleInputChange('paymentMethod', e.target.value)
                      }
                      disabled={submitting}
                      className={renewContractMobileStyles.select}
                    >
                      <option value="月付">月付</option>
                      <option value="季付">季付</option>
                      <option value="半年付">半年付</option>
                      <option value="年付">年付</option>
                    </select>
                  </div>
                  <div>
                    <Label
                      htmlFor="paymentTiming"
                      className={renewContractMobileStyles.formLabel}
                    >
                      收租时间
                    </Label>
                    <Input
                      id="paymentTiming"
                      value={formData.paymentTiming}
                      onChange={(e) =>
                        handleInputChange('paymentTiming', e.target.value)
                      }
                      placeholder="如：每月1号前"
                      disabled={submitting}
                      className={renewContractMobileStyles.input}
                    />
                  </div>
                </div>
              </div>

              {/* 签约信息 */}
              <div className={renewContractMobileStyles.formSection}>
                <h4 className={renewContractMobileStyles.sectionTitle}>
                  签约信息
                </h4>
                <div className={renewContractMobileStyles.formGrid}>
                  <div>
                    <Label
                      htmlFor="signedBy"
                      className={renewContractMobileStyles.formLabel}
                    >
                      签约人
                    </Label>
                    <Input
                      id="signedBy"
                      value={formData.signedBy}
                      onChange={(e) =>
                        handleInputChange('signedBy', e.target.value)
                      }
                      placeholder="签约人姓名"
                      disabled={submitting}
                      className={renewContractMobileStyles.input}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="signedDate"
                      className={renewContractMobileStyles.formLabel}
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
                      disabled={submitting}
                      className={renewContractMobileStyles.input}
                    />
                  </div>
                </div>
              </div>

              {/* 续租备注 */}
              <div>
                <Label
                  htmlFor="remarks"
                  className={renewContractMobileStyles.formLabel}
                >
                  续租备注
                </Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="请输入续租相关备注信息..."
                  disabled={submitting}
                  rows={4}
                  className={renewContractMobileStyles.textarea}
                />
                <p className={renewContractMobileStyles.helperText}>
                  已预填充原合同备注信息，您可以在此基础上修改或添加续租相关备注
                </p>
              </div>

              {/* 续租账单预览 */}
              {formData.newStartDate &&
                formData.newEndDate &&
                formData.newMonthlyRent > 0 && (
                  <ContractBillPreview
                    contractData={{
                      startDate: formData.newStartDate,
                      endDate: formData.newEndDate,
                      monthlyRent: formData.newMonthlyRent,
                      deposit: formData.newDeposit || 0,
                      keyDeposit: formData.newKeyDeposit,
                      cleaningFee: formData.newCleaningFee,
                      paymentMethod: formData.paymentMethod,
                    }}
                    generationContext="RENEWAL"
                    helperMessage="续租成功后系统只会自动生成租金账单与卫生费账单。押金和钥匙押金字段仍会随合同保存，但如需补收，请在合同创建后通过新增账单处理。"
                  />
                )}

              <Separator className={renewContractMobileStyles.separator} />

              {/* 操作按钮 */}
              <div className={renewContractMobileStyles.actionsCard}>
                <div className={renewContractMobileStyles.actionsRow}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      goBackWithHost(navigation, `/contracts/${contractId}`)
                    }
                    disabled={submitting}
                    className={renewContractMobileStyles.actionButton}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className={`${renewContractMobileStyles.actionButton} bg-green-600 hover:bg-green-700`}
                  >
                    {submitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        续租中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        确认续租
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

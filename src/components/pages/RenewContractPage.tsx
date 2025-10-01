'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  RefreshCw,
} from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
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
import { PageContainer } from '@/components/layout'

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

interface ContractWithDetailsForClient {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  monthlyRent: number
  totalRent?: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  paymentMethod?: string | null
  paymentTiming?: string | null
  status: string
  businessStatus?: string | null
  isExtended?: boolean
  signedBy?: string | null
  signedDate?: Date | null
  remarks?: string | null
  room: {
    roomNumber: string
    building: {
      name: string
    }
  }
  renter: {
    name: string
    phone: string
  }
}

interface RenewContractPageProps {
  contractId: string
}

/**
 * 续租页面组件
 * 根据renew_lease_chart.md设计实现
 */
export function RenewContractPage({ contractId }: RenewContractPageProps) {
  const router = useRouter()
  const [contract, setContract] = useState<ContractWithDetailsForClient | null>(
    null
  )
  const [loading, setLoading] = useState(true)
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
    const fetchContract = async () => {
      try {
        setLoading(true)
        setError(null)
        setErrorType(null)

        const response = await fetch(`/api/contracts/${contractId}`)
        if (!response.ok) {
          throw new Error('获取合同信息失败')
        }

        const result = await response.json()
        // 提取data字段中的合同数据
        const contractData = result.success ? result.data : result
        setContract(contractData)

        // 预填原合同信息
        const originalEndDate = new Date(contractData.endDate)
        const newStartDate = new Date(originalEndDate)
        // 修正：新合同从原合同结束日期的第二天开始，避免日期后移
        // 如果原合同是2026-09-26结束，新合同应该从2026-09-27开始
        newStartDate.setDate(newStartDate.getDate() + 1)

        const newEndDate = new Date(newStartDate)
        // 默认续租一年，但结束日期要减一天，保持租期的正确性
        // 例如：2026-09-27开始，应该到2027-09-26结束（正好一年）
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
          remarks: contractData.remarks || '', // 预填充原合同备注，用户可以在此基础上修改
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取合同信息失败')
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [contractId])

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
        const errorData = await response.json()
        // 保存错误类型信息
        setErrorType(errorData.errorType || null)
        // 使用API返回的具体错误消息，而不是通用的错误消息
        throw new Error(errorData.error || errorData.details || '续租失败')
      }

      const result = await response.json()
      setSuccess(true)

      // 显示成功弹框提示
      setTimeout(() => {
        router.push(`/contracts/${result.data.newContract.id}`)
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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 原合同信息展示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              原合同信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-sm text-gray-600">合同编号</Label>
                <p className="font-mono text-sm font-medium">
                  {contract.contractNumber}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">合同状态</Label>
                <div className="mt-1">
                  <ContractStatusBadge status={contract.status as any} />
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">租客</Label>
                <p className="font-medium">
                  {contract.renter?.name || '未知租客'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">房间</Label>
                <p className="font-medium">
                  {contract.room?.building?.name || '未知楼栋'} -{' '}
                  {contract.room?.roomNumber || '未知房间'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">合同期限</Label>
                <p className="text-sm">
                  {formatDate(contract.startDate)} -{' '}
                  {formatDate(contract.endDate)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">月租金</Label>
                <p className="font-medium text-green-600">
                  {formatCurrency(Number(contract.monthlyRent) || 0)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">总租金</Label>
                <p className="font-medium text-green-600">
                  {formatCurrency(Number(contract.totalRent) || 0)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">押金</Label>
                <p className="font-medium">
                  {formatCurrency(Number(contract.deposit) || 0)}
                </p>
              </div>
              {contract.keyDeposit && (
                <div>
                  <Label className="text-sm text-gray-600">钥匙押金</Label>
                  <p className="font-medium">
                    {formatCurrency(Number(contract.keyDeposit))}
                  </p>
                </div>
              )}
              {contract.cleaningFee && (
                <div>
                  <Label className="text-sm text-gray-600">清洁费</Label>
                  <p className="font-medium">
                    {formatCurrency(Number(contract.cleaningFee))}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm text-gray-600">付款方式</Label>
                <p className="font-medium">
                  {contract.paymentMethod || '月付'}
                </p>
              </div>
              {contract.paymentTiming && (
                <div>
                  <Label className="text-sm text-gray-600">收租时间</Label>
                  <p className="font-medium">{contract.paymentTiming}</p>
                </div>
              )}
              {contract.signedBy && (
                <div>
                  <Label className="text-sm text-gray-600">签约人</Label>
                  <p className="font-medium">{contract.signedBy}</p>
                </div>
              )}
              {contract.signedDate && (
                <div>
                  <Label className="text-sm text-gray-600">签约日期</Label>
                  <p className="font-medium">
                    {formatDate(contract.signedDate)}
                  </p>
                </div>
              )}
              {contract.businessStatus && (
                <div>
                  <Label className="text-sm text-gray-600">业务状态</Label>
                  <p className="font-medium">{contract.businessStatus}</p>
                </div>
              )}
              {contract.isExtended && (
                <div>
                  <Label className="text-sm text-gray-600">是否延期</Label>
                  <Badge variant="secondary">已延期</Badge>
                </div>
              )}
            </div>

            {/* 原合同备注信息 */}
            {contract.remarks && (
              <div className="mt-6 border-t pt-4">
                <Label className="mb-2 block text-sm text-gray-600">
                  原合同备注
                </Label>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-sm whitespace-pre-wrap text-gray-700">
                    {contract.remarks}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 续租表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              续租信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor="newStartDate"
                    className="flex items-center gap-2"
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
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="newEndDate"
                    className="flex items-center gap-2"
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
                    className="mt-1"
                  />
                </div>
              </div>

              {/* 租金信息 */}
              <div className="space-y-4">
                <h4 className="mb-3 font-medium text-gray-900">租金信息</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="newMonthlyRent"
                      className="flex items-center gap-2"
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
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newDeposit">押金</Label>
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
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      续租时押金可调整，退租时需退还
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="newKeyDeposit">钥匙押金</Label>
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
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      续租时钥匙押金可调整，退租时需退还
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="newCleaningFee">清洁费</Label>
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
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      清洁费为一次性费用，收取后不退还
                    </p>
                  </div>
                </div>
              </div>

              {/* 支付信息 */}
              <div className="space-y-4">
                <h4 className="mb-3 font-medium text-gray-900">支付信息</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="paymentMethod">支付方式</Label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        handleInputChange('paymentMethod', e.target.value)
                      }
                      disabled={submitting}
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="月付">月付</option>
                      <option value="季付">季付</option>
                      <option value="半年付">半年付</option>
                      <option value="年付">年付</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="paymentTiming">收租时间</Label>
                    <Input
                      id="paymentTiming"
                      value={formData.paymentTiming}
                      onChange={(e) =>
                        handleInputChange('paymentTiming', e.target.value)
                      }
                      placeholder="如：每月1号前"
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 签约信息 */}
              <div className="space-y-4">
                <h4 className="mb-3 font-medium text-gray-900">签约信息</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="signedBy">签约人</Label>
                    <Input
                      id="signedBy"
                      value={formData.signedBy}
                      onChange={(e) =>
                        handleInputChange('signedBy', e.target.value)
                      }
                      placeholder="签约人姓名"
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signedDate">签约日期</Label>
                    <Input
                      id="signedDate"
                      type="date"
                      value={formData.signedDate}
                      onChange={(e) =>
                        handleInputChange('signedDate', e.target.value)
                      }
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 续租备注 */}
              <div>
                <Label htmlFor="remarks">续租备注</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="请输入续租相关备注信息..."
                  disabled={submitting}
                  rows={4}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
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
                  />
                )}

              <Separator />

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
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
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

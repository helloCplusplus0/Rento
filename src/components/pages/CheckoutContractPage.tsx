'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatCurrency } from '@/lib/format'
import { 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  DollarSign,
  Home,
  User,
  FileText,
  Calculator
} from 'lucide-react'

// 合同详情类型定义
interface ContractWithDetailsForClient {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  status: string
  room: {
    id: string
    roomNumber: string
    floorNumber: number
    building: {
      id: string
      name: string
      address: string | null
    }
  }
  renter: {
    id: string
    name: string
    phone: string
  }
  bills: Array<{
    id: string
    billNumber: string
    type: string
    amount: number
    receivedAmount: number
    pendingAmount: number
    status: string
  }>
}

// 结算明细类型
interface CheckoutSettlement {
  refundItems: {
    rentRefund: number
    depositRefund: number
    keyDepositRefund: number
    subtotal: number
  }
  chargeItems: {
    rentCharge: number
    damageCharge: number
    cleaningCharge: number
    subtotal: number
  }
  summary: {
    totalRefund: number
    totalCharge: number
    netAmount: number
    settlementType: 'REFUND' | 'CHARGE' | 'BALANCED'
  }
  // 新增：计算详情和未付账单明细
  calculationDetails: {
    actualDays: number
    dailyRent: number
    shouldPayRent: number
    paidRent: number
    rentDifference: number
    unpaidBills: Array<{
      billNumber: string
      type: string
      amount: number
      pendingAmount: number
    }>
  }
}

// 可编辑的结算项目
interface EditableSettlementItem {
  id: string
  name: string
  amount: number
  formula?: string
  editable: boolean
}

interface CheckoutContractPageProps {
  contract: ContractWithDetailsForClient
}

export function CheckoutContractPage({ contract }: CheckoutContractPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editableItems, setEditableItems] = useState<{
    refund: EditableSettlementItem[]
    charge: EditableSettlementItem[]
  }>({ refund: [], charge: [] })
  
  // 表单数据
  const [formData, setFormData] = useState({
    checkoutDate: new Date().toISOString().split('T')[0],
    checkoutReason: '',
    damageAssessment: 0,
    finalMeterReadings: {} as Record<string, number>, // 最终抄表读数
    remarks: ''
  })

  // 结算预览数据
  const [settlement, setSettlement] = useState<CheckoutSettlement | null>(null)

  // 计算结算预览
  useEffect(() => {
    if (formData.checkoutDate) {
      calculateSettlement()
    }
  }, [formData.checkoutDate, formData.damageAssessment])

  // 使用 useEffect 来监听 editableItems 变化并重新计算
  useEffect(() => {
    if (editableItems.refund.length > 0 || editableItems.charge.length > 0) {
      recalculateSettlement()
    }
  }, [editableItems])

  const calculateSettlement = () => {
    const checkoutDate = new Date(formData.checkoutDate)
    const contractStartDate = new Date(contract.startDate)
    const contractEndDate = new Date(contract.endDate)
    
    // 计算实际居住天数（包含开始日期）
    const actualDays = Math.ceil((checkoutDate.getTime() - contractStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // 计算合同总天数（包含开始和结束日期）
    const totalDays = Math.ceil((contractEndDate.getTime() - contractStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // 计算应付租金（按日计算）
    const dailyRent = contract.monthlyRent / 30
    const shouldPayRent = Math.round(actualDays * dailyRent * 100) / 100
    
    // 计算已付租金（从totalRent推算）
    const paidRent = contract.totalRent
    
    // 计算租金差额
    const rentDifference = paidRent - shouldPayRent
    
    // 计算未付账单总额
    const unpaidBills = contract.bills.filter(bill => 
      ['PENDING', 'OVERDUE'].includes(bill.status)
    )
    const unpaidAmount = unpaidBills.reduce((sum, bill) => sum + bill.pendingAmount, 0)
    
    // 应退项目计算
    const rentRefund = Math.max(0, rentDifference) // 多付租金退还
    const depositRefund = Math.max(0, contract.deposit - formData.damageAssessment) // 押金退还（扣除损坏费用）
    const keyDepositRefund = contract.keyDeposit || 0 // 钥匙押金退还
    
    // 应收项目计算
    const rentCharge = Math.max(0, -rentDifference) // 欠缴租金
    const unpaidBillsCharge = unpaidAmount // 未付账单
    const damageCharge = formData.damageAssessment // 损坏赔偿
    
    // 小计
    const refundSubtotal = rentRefund + depositRefund + keyDepositRefund
    const chargeSubtotal = rentCharge + unpaidBillsCharge + damageCharge
    
    // 净结算金额（从管理员角度：正数=管理员收入，负数=管理员支出）
    const netAmount = chargeSubtotal - refundSubtotal
    
    const settlementData: CheckoutSettlement = {
      refundItems: {
        rentRefund,
        depositRefund,
        keyDepositRefund,
        subtotal: refundSubtotal
      },
      chargeItems: {
        rentCharge,
        damageCharge,
        cleaningCharge: unpaidBillsCharge, // 临时用cleaningCharge字段存储未付账单
        subtotal: chargeSubtotal
      },
      summary: {
        totalRefund: refundSubtotal,
        totalCharge: chargeSubtotal,
        netAmount,
        settlementType: netAmount > 0 ? 'CHARGE' : netAmount < 0 ? 'REFUND' : 'BALANCED'
      },
      calculationDetails: {
        actualDays,
        dailyRent,
        shouldPayRent,
        paidRent,
        rentDifference,
        unpaidBills: unpaidBills.map(bill => ({
          billNumber: bill.billNumber,
          type: bill.type,
          amount: bill.amount,
          pendingAmount: bill.pendingAmount
        }))
      }
    }
    
    setSettlement(settlementData)
    
    // 初始化可编辑项目
    const refundItems: EditableSettlementItem[] = [
      {
        id: 'rentRefund',
        name: '多付租金退还',
        amount: rentRefund,
        formula: `${actualDays}天 × ¥${dailyRent.toFixed(2)}/天 = ¥${shouldPayRent.toFixed(2)}，已付¥${paidRent.toFixed(2)}，多付¥${rentRefund.toFixed(2)}`,
        editable: true
      },
      {
        id: 'depositRefund',
        name: '押金退还',
        amount: depositRefund,
        formula: `押金¥${contract.deposit.toFixed(2)} - 损坏赔偿¥${formData.damageAssessment.toFixed(2)} = ¥${depositRefund.toFixed(2)}`,
        editable: true
      },
      {
        id: 'keyDepositRefund',
        name: '钥匙押金退还',
        amount: keyDepositRefund,
        formula: `钥匙押金全额退还`,
        editable: true
      }
    ].filter(item => item.amount > 0)
    
    const chargeItems: EditableSettlementItem[] = [
      {
        id: 'rentCharge',
        name: '欠缴租金',
        amount: rentCharge,
        formula: `应付¥${shouldPayRent.toFixed(2)} - 已付¥${paidRent.toFixed(2)} = 欠缴¥${rentCharge.toFixed(2)}`,
        editable: true
      },
      {
        id: 'damageCharge',
        name: '损坏赔偿',
        amount: damageCharge,
        formula: `根据房屋检查评估`,
        editable: true
      },
      ...unpaidBills.map(bill => ({
        id: `unpaid_${bill.id}`,
        name: `未付账单 - ${bill.billNumber}`,
        amount: bill.pendingAmount,
        formula: `${bill.type === 'RENT' ? '租金' : bill.type === 'DEPOSIT' ? '押金' : bill.type === 'UTILITIES' ? '水电费' : '其他'}账单待收金额`,
        editable: true
      }))
    ].filter(item => item.amount > 0)
    
    setEditableItems({ refund: refundItems, charge: chargeItems })
  }

  // 处理可编辑项目金额变更
  const handleEditableItemChange = (type: 'refund' | 'charge', itemId: string, newAmount: number) => {
    setEditableItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.id === itemId ? { ...item, amount: Math.max(0, newAmount) } : item
      )
    }))
    
    // 重新计算结算汇总
    recalculateSettlement()
  }
  
  // 重新计算结算汇总
  const recalculateSettlement = () => {
    if (!settlement) return
    
    const refundSubtotal = editableItems.refund.reduce((sum, item) => sum + item.amount, 0)
    const chargeSubtotal = editableItems.charge.reduce((sum, item) => sum + item.amount, 0)
    const netAmount = chargeSubtotal - refundSubtotal
    
    setSettlement(prev => prev ? {
      ...prev,
      refundItems: { ...prev.refundItems, subtotal: refundSubtotal },
      chargeItems: { ...prev.chargeItems, subtotal: chargeSubtotal },
      summary: {
        totalRefund: refundSubtotal,
        totalCharge: chargeSubtotal,
        netAmount,
        settlementType: netAmount > 0 ? 'CHARGE' : netAmount < 0 ? 'REFUND' : 'BALANCED'
      }
    } : null)
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 基础验证
    if (!formData.checkoutDate || !formData.checkoutReason.trim()) {
      setError('请填写退租日期和退租原因')
      return
    }

    const checkoutDate = new Date(formData.checkoutDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (checkoutDate < today) {
      setError('退租日期不能早于当前日期')
      return
    }

    if (checkoutDate > new Date(contract.endDate)) {
      setError('退租日期不能晚于合同结束日期')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/contracts/${contract.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '退租失败')
      }

      setSuccess(true)
      
      // 立即跳转回合同详情页，避免页面状态不一致导致的404错误
      router.push(`/contracts/${contract.id}`)

    } catch (error) {
      console.error('退租失败:', error)
      setError(error instanceof Error ? error.message : '退租失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <PageContainer title="退租成功" showBackButton>
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">退租成功</h2>
          <p className="text-gray-600 mb-4">合同已成功终止，正在跳转到合同详情页...</p>
          {settlement && (
            <div className="max-w-md mx-auto mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">结算汇总</h3>
              <div className="text-2xl font-bold text-green-600">
                {settlement.summary.settlementType === 'REFUND' && '+'}
                ¥{Math.abs(settlement.summary.netAmount).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {settlement.summary.settlementType === 'REFUND' && '应退还给租客'}
                {settlement.summary.settlementType === 'CHARGE' && '租客应补缴'}
                {settlement.summary.settlementType === 'BALANCED' && '收支平衡'}
              </div>
            </div>
          )}
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mt-4"></div>
          
          {/* 添加手动跳转按钮，以防自动跳转失败 */}
          <div className="mt-6">
            <Button 
              onClick={() => router.push(`/contracts/${contract.id}`)}
              className="bg-green-600 hover:bg-green-700"
            >
              查看合同详情
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="退租合同" showBackButton>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 原合同信息展示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              合同信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">房间:</span>
                <span className="font-medium">
                  {contract.room.building.name} - {contract.room.roomNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">租客:</span>
                <span className="font-medium">{contract.renter.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">合同期限:</span>
                <span className="font-medium">
                  {formatDate(contract.startDate)} 至 {formatDate(contract.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">月租金:</span>
                <span className="font-medium">{formatCurrency(contract.monthlyRent)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 退租表单 */}
        <Card>
          <CardHeader>
            <CardTitle>退租信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkoutDate">退租日期 *</Label>
                  <Input
                    id="checkoutDate"
                    type="date"
                    value={formData.checkoutDate}
                    onChange={(e) => handleInputChange('checkoutDate', e.target.value)}
                    disabled={loading}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(contract.endDate).toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="damageAssessment">损坏赔偿金额</Label>
                  <Input
                    id="damageAssessment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.damageAssessment}
                    onChange={(e) => handleInputChange('damageAssessment', parseFloat(e.target.value) || 0)}
                    disabled={loading}
                    className="mt-1"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">房屋损坏需要赔偿的金额</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="checkoutReason">退租原因 *</Label>
                <Textarea
                  id="checkoutReason"
                  value={formData.checkoutReason}
                  onChange={(e) => handleInputChange('checkoutReason', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                  placeholder="请填写退租原因..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                  placeholder="其他需要说明的事项..."
                  rows={2}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* 结算预览 */}
              {settlement && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="font-medium flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    结算预览
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 应退项目 */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-3">应退项目</h4>
                      <div className="space-y-3">
                        {editableItems.refund.map((item) => (
                          <div key={item.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.amount}
                                  onChange={(e) => handleEditableItemChange('refund', item.id, parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8 text-right text-red-600 font-medium"
                                />
                                <span className="text-red-600 font-medium">元</span>
                              </div>
                            </div>
                            {item.formula && (
                              <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                                <span className="font-medium">计算公式：</span>{item.formula}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <div className="border-t pt-2 font-semibold">
                          <div className="flex justify-between">
                            <span>应退小计</span>
                            <span className="text-red-600">¥{editableItems.refund.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 应收项目 */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3">应收项目</h4>
                      <div className="space-y-3">
                        {editableItems.charge.map((item) => (
                          <div key={item.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.amount}
                                  onChange={(e) => handleEditableItemChange('charge', item.id, parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8 text-right text-green-600 font-medium"
                                />
                                <span className="text-green-600 font-medium">元</span>
                              </div>
                            </div>
                            {item.formula && (
                              <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                                <span className="font-medium">计算公式：</span>{item.formula}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <div className="border-t pt-2 font-semibold">
                          <div className="flex justify-between">
                            <span>应收小计</span>
                            <span className="text-green-600">¥{editableItems.charge.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 退租结算说明 */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">退租结算说明：</p>
                        <ul className="space-y-1 text-xs">
                          <li>• 点击"确认退租"将一次性结清所有合同权利和义务</li>
                          <li>• 所有未付账单将自动标记为已支付</li>
                          <li>• 最终结算可线上确认或线下处理</li>
                          <li>• 退租完成后合同状态将变更为已终止</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 结算汇总 */}
                  <div className={`p-4 rounded-lg border-2 ${
                    settlement.summary.settlementType === 'CHARGE' ? 'bg-green-100 border-green-300' :
                    settlement.summary.settlementType === 'REFUND' ? 'bg-red-100 border-red-300' :
                    'bg-gray-100 border-gray-300'
                  }`}>
                    <h4 className="font-bold text-lg mb-3">结算汇总</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>总应退金额</span>
                        <span className="text-red-600">¥{settlement.summary.totalRefund.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>总应收金额</span>
                        <span className="text-green-600">¥{settlement.summary.totalCharge.toFixed(2)}</span>
                      </div>
                      <div className="border-t-2 pt-2">
                        <div className="flex justify-between text-xl font-bold">
                          <span>净结算金额</span>
                          <span className={
                            settlement.summary.settlementType === 'CHARGE' ? 'text-green-600' :
                            settlement.summary.settlementType === 'REFUND' ? 'text-red-600' :
                            'text-gray-600'
                          }>
                            {settlement.summary.netAmount >= 0 ? '+' : ''}¥{settlement.summary.netAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? '处理中...' : '确认退租并结清所有账单'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
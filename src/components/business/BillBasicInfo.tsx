'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BillStatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/format'
import { ExternalLink } from 'lucide-react'

interface BillBasicInfoProps {
  bill: any
}

/**
 * 账单基本信息组件
 * 显示账单的核心信息，包括金额、日期、状态等
 * 支持不同类型账单的差异化展示
 */
export function BillBasicInfo({ bill }: BillBasicInfoProps) {
  const router = useRouter()
  
  // 根据到期日期自动判断是否逾期
  const today = new Date()
  const dueDate = new Date(bill.dueDate)
  const isActuallyOverdue = today > dueDate && bill.status !== 'PAID' && bill.status !== 'COMPLETED'
  const overdueDays = isActuallyOverdue 
    ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // 显示实际状态（基于日期计算）
  const actualStatus = isActuallyOverdue ? 'OVERDUE' : bill.status

  // 跳转到合同详情
  const handleContractClick = () => {
    router.push(`/contracts/${bill.contract.id}`)
  }

  // 跳转到租客详情
  const handleRenterClick = () => {
    router.push(`/renters/${bill.contract.renter.id}`)
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg mb-4">账单信息</CardTitle>
        
        {/* 简化的账单核心信息区域 - 只保留金额和状态 */}
        <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-lg p-4 border border-blue-200">
          {/* 顶部：状态 */}
          <div className="flex justify-center mb-4">
            <BillStatusBadge status={actualStatus} />
          </div>
          
          {/* 中部：账单总金额 */}
          <div className="text-center py-3 border-y border-blue-200/50">
            <p className="text-sm text-gray-600 mb-1">账单总金额</p>
            <p className="text-4xl font-bold text-green-600 mb-2">
              {formatCurrency(bill.amount)}
            </p>
          </div>
          
          {/* 底部：已收/待收金额 */}
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">已收金额</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(bill.receivedAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">待收金额</p>
              <p className="text-lg font-semibold text-orange-600">{formatCurrency(bill.pendingAmount)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 根据账单类型显示不同内容 */}
        {bill.type === 'UTILITIES' ? (
          <UtilitiesBillDetails bill={bill} />
        ) : (
          <GeneralBillDetails bill={bill} />
        )}
        
        {isActuallyOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 font-medium">
              ⚠️ 账单已逾期 {overdueDays} 天，请及时处理
            </p>
          </div>
        )}
        
        {bill.remarks && (
          <div>
            <label className="text-xs font-medium text-gray-600">备注</label>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {bill.remarks}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t">
          <div>
            <label className="text-xs font-medium text-gray-600">创建时间</label>
            <p className="text-xs text-gray-500">{formatDate(bill.createdAt)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">更新时间</label>
            <p className="text-xs text-gray-500">{formatDate(bill.updatedAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 水电费账单明细组件
 */
function UtilitiesBillDetails({ bill }: { bill: any }) {
  const router = useRouter()
  const [billDetails, setBillDetails] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLegacy, setIsLegacy] = useState(false)

  // 跳转到合同详情
  const handleContractClick = () => {
    router.push(`/contracts/${bill.contract.id}`)
  }

  // 跳转到租客详情
  const handleRenterClick = () => {
    router.push(`/renters/${bill.contract.renter.id}`)
  }

  useEffect(() => {
    // 获取真实的账单明细数据
    const fetchBillDetails = async () => {
      try {
        const response = await fetch(`/api/bills/${bill.id}/details`)
        if (response.ok) {
          const result = await response.json()
          setBillDetails(result.data || [])
          setIsLegacy(result.isLegacy || false)
        } else {
          console.error('Failed to fetch bill details')
          setBillDetails([])
        }
      } catch (error) {
        console.error('Error fetching bill details:', error)
        setBillDetails([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBillDetails()
  }, [bill.id])

  const getMeterTypeName = (meterType: string) => {
    const typeNames = {
      'ELECTRICITY': '电费',
      'COLD_WATER': '冷水费',
      'HOT_WATER': '热水费',
      'GAS': '燃气费'
    }
    return typeNames[meterType as keyof typeof typeNames] || '水电费'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">用量明细</h4>
          <div className="animate-pulse space-y-3">
            <div className="bg-white rounded-lg p-3 border">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 账单基本信息 - 下沉到这里 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">账单编号</label>
          <p className="text-sm font-mono truncate">{bill.billNumber}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">账单类型</label>
          <p className="text-sm">{getBillTypeText(bill.type)}</p>
        </div>
        
        {/* 租客信息 - 可点击跳转 */}
        <div>
          <label className="text-xs font-medium text-gray-600">租客姓名</label>
          <button
            onClick={handleRenterClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 group"
          >
            {bill.contract.renter.name}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        
        {/* 房间信息 - 可点击跳转 */}
        <div>
          <label className="text-xs font-medium text-gray-600">房间信息</label>
          <button
            onClick={handleContractClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 group"
          >
            {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        
        {/* 合同编号 - 可点击跳转 */}
        <div>
          <label className="text-xs font-medium text-gray-600">合同编号</label>
          <button
            onClick={handleContractClick}
            className="text-sm font-mono text-blue-600 hover:text-blue-800 transition-colors"
          >
            {bill.contract.contractNumber}
          </button>
        </div>
        
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600">缴费周期</label>
          <p className="text-sm font-medium text-blue-600">
            {bill.period || '2025年1月1日 至 2025年1月31日'}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">到期日期</label>
          <p className="text-sm">{formatDate(bill.dueDate)}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">抄表日期</label>
          <p className="text-sm">
            {billDetails.length > 0 
              ? formatDate(billDetails[0].readingDate) 
              : '2025年1月31日'
            }
          </p>
        </div>
      </div>

      {/* 水电费明细 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">用量明细</h4>
          {isLegacy && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              兼容模式
            </span>
          )}
        </div>
        
        {billDetails.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            暂无明细数据
          </div>
        ) : (
          <div className="space-y-3">
            {billDetails.map((detail, index) => (
              <div key={detail.id || index} className="bg-white rounded-lg p-3 border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {detail.meterName || getMeterTypeName(detail.meterType)}
                    </h5>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(detail.unitPrice)}/{detail.unit || '度'}
                    </p>
                    {detail.priceSource && (
                      <p className="text-xs text-blue-600">
                        {detail.priceSource === 'METER_CONFIG' ? '仪表单价' : '全局单价'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(detail.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-600">
                      {detail.usage} {detail.unit || '度'}
                      {detail.previousReading !== null && detail.currentReading && (
                        <span className="text-gray-500">
                          {' '}({detail.currentReading} - {detail.previousReading})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    抄表日期：{formatDate(detail.readingDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 通用账单详情组件 (租金、押金、其他)
 */
function GeneralBillDetails({ bill }: { bill: any }) {
  const router = useRouter()

  // 跳转到合同详情
  const handleContractClick = () => {
    router.push(`/contracts/${bill.contract.id}`)
  }

  // 跳转到租客详情
  const handleRenterClick = () => {
    router.push(`/renters/${bill.contract.renter.id}`)
  }

  // 生成缴费周期时间段 (模拟数据，实际应从数据库获取)
  const getBillingPeriod = () => {
    if (bill.period) return bill.period
    
    // 根据账单类型生成默认的缴费周期
    const dueDate = new Date(bill.dueDate)
    const startDate = new Date(dueDate)
    
    if (bill.type === 'RENT') {
      // 租金：通常是一个月的周期
      startDate.setMonth(dueDate.getMonth() - 1)
      return `${formatDate(startDate)} 至 ${formatDate(dueDate)}`
    } else if (bill.type === 'DEPOSIT') {
      // 押金：通常是合同开始时的一次性费用
      return `合同生效期间`
    } else {
      // 其他：默认一个月周期
      startDate.setMonth(dueDate.getMonth() - 1)
      return `${formatDate(startDate)} 至 ${formatDate(dueDate)}`
    }
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <label className="text-xs font-medium text-gray-600">账单编号</label>
        <p className="text-sm font-mono truncate">{bill.billNumber}</p>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">账单类型</label>
        <p className="text-sm">{getBillTypeText(bill.type)}</p>
      </div>
      
      {/* 租客信息 - 可点击跳转 */}
      <div>
        <label className="text-xs font-medium text-gray-600">租客姓名</label>
        <button
          onClick={handleRenterClick}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 group"
        >
          {bill.contract.renter.name}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
      
      {/* 房间信息 - 可点击跳转 */}
      <div>
        <label className="text-xs font-medium text-gray-600">房间信息</label>
        <button
          onClick={handleContractClick}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 group"
        >
          {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
      
      {/* 合同编号 - 可点击跳转 */}
      <div>
        <label className="text-xs font-medium text-gray-600">合同编号</label>
        <button
          onClick={handleContractClick}
          className="text-sm font-mono text-blue-600 hover:text-blue-800 transition-colors"
        >
          {bill.contract.contractNumber}
        </button>
      </div>
      
      <div className="col-span-2">
        <label className="text-xs font-medium text-gray-600">缴费周期</label>
        <p className="text-sm font-medium text-blue-600">{getBillingPeriod()}</p>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">到期日期</label>
        <p className="text-sm">{formatDate(bill.dueDate)}</p>
      </div>
      <div></div> {/* 占位保持对齐 */}
      {bill.paidDate && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600">实际支付日期</label>
            <p className="text-sm">{formatDate(bill.paidDate)}</p>
          </div>
          <div></div> {/* 占位保持对齐 */}
        </>
      )}
      {bill.paymentMethod && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600">支付方式</label>
            <p className="text-sm">{bill.paymentMethod}</p>
          </div>
          <div></div> {/* 占位保持对齐 */}
        </>
      )}
      {bill.operator && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600">经办人</label>
            <p className="text-sm">{bill.operator}</p>
          </div>
          <div></div> {/* 占位保持对齐 */}
        </>
      )}
    </div>
  )
}
 
/**
 * 获取账单类型的中文显示文本
 */
function getBillTypeText(type: string) {
  const typeMap = {
    RENT: '租金',
    DEPOSIT: '押金',
    UTILITIES: '水电费',
    OTHER: '其他'
  }
  return typeMap[type as keyof typeof typeMap] || type
}
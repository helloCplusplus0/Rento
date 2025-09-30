'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ContractStatusBadge } from '@/components/ui/status-badge'
import { BillStatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ContractStatus, BillStatus } from '@/lib/colors'
import { 
  User, 
  Home, 
  Calendar, 
  CreditCard, 
  FileText, 
  Phone, 
  MapPin,
  Building,
  Bed,
  Ruler,
  RefreshCw,
  UserX,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  Gauge
} from 'lucide-react'

interface ContractWithDetailsForClient {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  isExtended: boolean
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  paymentMethod?: string | null
  paymentTiming?: string | null
  status: string
  businessStatus?: string | null
  signedBy?: string | null
  signedDate?: Date | null
  remarks?: string | null
  createdAt: Date
  updatedAt: Date
  room: {
    id: string
    roomNumber: string
    floorNumber: number
    buildingId: string
    roomType: string
    area: number | null
    rent: number
    status: string
    currentRenter?: string | null
    overdueDays?: number | null
    createdAt: Date
    updatedAt: Date
    building: {
      id: string
      name: string
      address: string | null
      totalRooms: number
      description: string | null
      createdAt: Date
      updatedAt: Date
    }
  }
  renter: {
    id: string
    name: string
    gender?: string | null
    phone: string
    idCard?: string | null
    emergencyContact?: string | null
    emergencyPhone?: string | null
    occupation?: string | null
    company?: string | null
    moveInDate?: Date | null
    tenantCount?: number | null
    remarks?: string | null
    createdAt: Date
    updatedAt: Date
  }
  bills: Array<{
    id: string
    billNumber: string
    type: string
    amount: number
    receivedAmount: number
    pendingAmount: number
    dueDate: Date
    paidDate?: Date | null
    period?: string | null
    status: string
    paymentMethod?: string | null
    operator?: string | null
    remarks?: string | null
    contractId: string
    createdAt: Date
    updatedAt: Date
  }>
}

interface EnhancedContractDetailProps {
  contract: ContractWithDetailsForClient
  onEdit?: () => void
  onRenew?: () => void
  onTerminate?: () => void
  onDelete?: () => void
  onViewPDF?: () => void
  onActivate?: () => void  // 新增激活回调
  onMeterReading?: () => void  // 新增抄表回调
  className?: string
}

/**
 * 增强版合同详情组件
 * 提供完整的合同信息展示和操作功能
 */
export function EnhancedContractDetail({
  contract,
  onEdit,
  onRenew,
  onTerminate,
  onDelete,
  onViewPDF,
  onActivate,  // 新增激活回调
  onMeterReading,  // 新增抄表回调
  className
}: EnhancedContractDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'facilities'>('overview')
  const router = useRouter()
  
  const isActive = contract.status === 'ACTIVE'
  const isExpired = contract.status === 'EXPIRED'
  const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0

  // 处理租客信息卡片点击
  const handleRenterClick = () => {
    router.push(`/renters/${contract.renter.id}`)
  }

  // 处理房间信息卡片点击
  const handleRoomClick = () => {
    router.push(`/rooms/${contract.room.id}`)
  }

  // 处理账单点击
  const handleBillClick = (billId: string) => {
    router.push(`/bills/${billId}`)
  }



  // 房间类型文本转换
  const getRoomTypeText = (type: string) => {
    switch (type) {
      case 'SINGLE': return '单间'
      case 'SHARED': return '合租'
      case 'WHOLE': return '整租'
      default: return type
    }
  }

  // 账单类型文本转换
  const getBillTypeText = (type: string) => {
    switch (type) {
      case 'RENT': return '租金'
      case 'DEPOSIT': return '押金'
      case 'UTILITIES': return '水电费'
      case 'OTHER': return '其他'
      default: return type
    }
  }

  // 计算账单统计
  const billStats = {
    total: contract.bills.length,
    paid: contract.bills.filter(bill => bill.status === 'PAID').length,
    pending: contract.bills.filter(bill => bill.status === 'PENDING').length,
    overdue: contract.bills.filter(bill => {
      const today = new Date()
      const dueDate = new Date(bill.dueDate)
      return today > dueDate && bill.status !== 'PAID'
    }).length,
    totalAmount: contract.bills.reduce((sum, bill) => sum + bill.amount, 0),
    paidAmount: contract.bills.reduce((sum, bill) => sum + bill.receivedAmount, 0),
    pendingAmount: contract.bills.reduce((sum, bill) => sum + bill.pendingAmount, 0)
  }

  // 按时间排序账单（由近及远）
  const sortedBills = [...contract.bills].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* 顶部状态栏 */}
      <div className={cn(
        'rounded-lg p-6 text-white',
        isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
        isExpired ? 'bg-gradient-to-r from-red-500 to-red-600' :
        'bg-gradient-to-r from-gray-500 to-gray-600'
      )}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {contract.room.building.name} - {contract.room.roomNumber}
            </h1>
            <p className="text-white/90 text-lg">
              {contract.renter.name} · {contract.contractNumber}
            </p>
          </div>
          <ContractStatusBadge 
            status={contract.status as ContractStatus} 
            className="bg-white/20 text-white border-white/30"
          />
        </div>
        
        {/* 关键信息快览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/70">合同期限</p>
            <p className="font-medium">
              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
            </p>
          </div>
          <div>
            <p className="text-white/70">月租金</p>
            <p className="font-medium text-lg">{formatCurrency(contract.monthlyRent)}</p>
          </div>
          <div>
            <p className="text-white/70">押金</p>
            <p className="font-medium">{formatCurrency(contract.deposit)}</p>
          </div>
          <div>
            <p className="text-white/70">付款方式</p>
            <p className="font-medium">{contract.paymentMethod || '月付'}</p>
          </div>
        </div>

        {/* 到期提醒 */}
        {isExpiringSoon && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-300/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                合同将在 {daysUntilExpiry} 天后到期，请及时处理续约事宜
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {onEdit && (
          <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            编辑合同
          </Button>
        )}
        {contract.status === 'PENDING' && onActivate && (
          <Button onClick={onActivate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="w-4 h-4" />
            激活合同
          </Button>
        )}
        {isActive && onRenew && (
          <Button onClick={onRenew} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <RefreshCw className="w-4 h-4" />
            续租
          </Button>
        )}
        {isActive && onTerminate && (
          <Button variant="outline" onClick={onTerminate} className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50">
            <UserX className="w-4 h-4" />
            退租
          </Button>
        )}
        {isActive && onMeterReading && (
          <Button variant="outline" onClick={onMeterReading} className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50">
            <Gauge className="w-4 h-4" />
            抄表录入
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" onClick={onDelete} className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
            删除
          </Button>
        )}
      </div>

      {/* 标签页导航 */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            合同概览
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'bills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            账单历史 ({contract.bills.length})
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'facilities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            房间设施
          </button>
        </nav>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 租客信息 - 添加点击跳转功能 */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleRenterClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  租客信息
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">姓名</label>
                  <p className="font-medium">{contract.renter.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">性别</label>
                  <p className="font-medium">{contract.renter.gender || '未填写'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">手机号</label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {contract.renter.phone}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">身份证号</label>
                  <p className="font-medium">{contract.renter.idCard || '未填写'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">职业</label>
                  <p className="font-medium">{contract.renter.occupation || '未填写'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">公司</label>
                  <p className="font-medium">{contract.renter.company || '未填写'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">入住日期</label>
                  <p className="font-medium">
                    {contract.renter.moveInDate ? formatDate(contract.renter.moveInDate) : '未填写'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">入住人数</label>
                  <p className="font-medium">{contract.renter.tenantCount || 1}人</p>
                </div>
              </div>
              
              {contract.renter.emergencyContact && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm text-gray-600">紧急联系人</label>
                    <p className="font-medium">{contract.renter.emergencyContact}</p>
                    {contract.renter.emergencyPhone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {contract.renter.emergencyPhone}
                      </p>
                    )}
                  </div>
                </>
              )}
              
              {contract.renter.remarks && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm text-gray-600">备注</label>
                    <p className="text-sm text-gray-700">{contract.renter.remarks}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 房间信息 - 添加点击跳转功能 */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleRoomClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-green-600" />
                  房间信息
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">房间号</label>
                  <p className="font-medium text-lg">{contract.room.roomNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">楼栋</label>
                  <p className="font-medium flex items-center gap-1">
                    <Building className="w-4 h-4 text-gray-400" />
                    {contract.room.building.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">楼层</label>
                  <p className="font-medium">{contract.room.floorNumber}层</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">房间类型</label>
                  <p className="font-medium flex items-center gap-1">
                    <Bed className="w-4 h-4 text-gray-400" />
                    {getRoomTypeText(contract.room.roomType)}
                  </p>
                </div>
                {contract.room.area && (
                  <div>
                    <label className="text-sm text-gray-600">面积</label>
                    <p className="font-medium flex items-center gap-1">
                      <Ruler className="w-4 h-4 text-gray-400" />
                      {contract.room.area}㎡
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">房间状态</label>
                  <Badge variant={contract.room.status === 'OCCUPIED' ? 'default' : 'secondary'}>
                    {contract.room.status === 'OCCUPIED' ? '已出租' : '空闲'}
                  </Badge>
                </div>
              </div>
              
              {contract.room.building.address && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm text-gray-600">楼栋地址</label>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {contract.room.building.address}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 合同详情 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                合同详情
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-gray-600">合同编号</label>
                  <p className="font-mono text-sm font-medium">{contract.contractNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">合同状态</label>
                  <ContractStatusBadge status={contract.status as ContractStatus} />
                </div>
                <div>
                  <label className="text-sm text-gray-600">签约人</label>
                  <p className="font-medium">{contract.signedBy || contract.renter.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">签约时间</label>
                  <p className="font-medium">
                    {contract.signedDate ? formatDate(contract.signedDate) : formatDate(contract.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">合同开始</label>
                  <p className="font-medium">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">合同结束</label>
                  <p className="font-medium">{formatDate(contract.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">月租金</label>
                  <p className="font-medium text-green-600">{formatCurrency(contract.monthlyRent)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">总租金</label>
                  <p className="font-medium text-green-600">{formatCurrency(contract.totalRent)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">押金</label>
                  <p className="font-medium">{formatCurrency(contract.deposit)}</p>
                </div>
                {contract.keyDeposit && (
                  <div>
                    <label className="text-sm text-gray-600">门卡押金</label>
                    <p className="font-medium">{formatCurrency(contract.keyDeposit)}</p>
                  </div>
                )}
                {contract.cleaningFee && (
                  <div>
                    <label className="text-sm text-gray-600">保洁费</label>
                    <p className="font-medium">{formatCurrency(contract.cleaningFee)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">付款方式</label>
                  <p className="font-medium">{contract.paymentMethod || '月付'}</p>
                </div>
                {contract.paymentTiming && (
                  <div>
                    <label className="text-sm text-gray-600">支付时间</label>
                    <p className="font-medium">{contract.paymentTiming}</p>
                  </div>
                )}
                {contract.isExtended && (
                  <div>
                    <label className="text-sm text-gray-600">是否延期</label>
                    <Badge variant="secondary">已延期</Badge>
                  </div>
                )}
              </div>
              
              {/* 备注信息 - 如果有备注则显示 */}
              {contract.remarks && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">合同备注</label>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.remarks}</p>
                    </div>
                  </div>
                </>
              )}
              
              {/* 业务状态信息 - 如果有则显示 */}
              {contract.businessStatus && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">业务状态</label>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">{contract.businessStatus}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="space-y-6">
          {/* 账单统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{billStats.total}</p>
                    <p className="text-sm text-gray-600">总账单</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{billStats.paid}</p>
                    <p className="text-sm text-gray-600">已付款</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{billStats.pending}</p>
                    <p className="text-sm text-gray-600">待付款</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{billStats.overdue}</p>
                    <p className="text-sm text-gray-600">已逾期</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 金额统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                金额统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(billStats.totalAmount)}</p>
                  <p className="text-sm text-gray-600">总金额</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(billStats.paidAmount)}</p>
                  <p className="text-sm text-gray-600">已收金额</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(billStats.pendingAmount)}</p>
                  <p className="text-sm text-gray-600">待收金额</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 账单列表 - 添加点击跳转功能 */}
          <Card>
            <CardHeader>
              <CardTitle>账单历史</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedBills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无账单记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedBills.map((bill) => (
                    <div 
                      key={bill.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleBillClick(bill.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <BillStatusBadge status={bill.status as BillStatus} />
                        </div>
                        <div>
                          <p className="font-medium">{bill.billNumber}</p>
                          <p className="text-sm text-gray-600">
                            {getBillTypeText(bill.type)} · 到期日: {formatDate(bill.dueDate)}
                          </p>
                          {bill.period && (
                            <p className="text-xs text-gray-500">账期: {bill.period}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-medium">{formatCurrency(bill.amount)}</p>
                          <p className="text-sm text-gray-600">
                            已收: {formatCurrency(bill.receivedAmount)}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'facilities' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              房间设施
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>房间设施信息功能开发中...</p>
              <p className="text-sm mt-2">将展示房间内的家具、电器等设施清单</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
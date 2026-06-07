'use client'

import { useState, type ReactNode } from 'react'
import {
  AlertCircle,
  Bed,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  Gauge,
  Home,
  MapPin,
  Phone,
  RefreshCw,
  Ruler,
  Trash2,
  User,
  UserX,
} from 'lucide-react'

import type { BillStatus, ContractStatus } from '@/lib/colors'
import type { ContractWithDetailsForClient } from '@/types/database'
import {
  buildBillPresentationStats,
  sortBillsForDisplay,
} from '@/lib/bill-semantics'
import { getBillDisplayLabel, getBillVisualConfig } from '@/lib/bill-display'
import {
  calculateDaysUntilContractExpiry,
  isContractExpiringSoon,
} from '@/lib/contract-alert-semantics'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  BillStatusBadge,
  ContractStatusBadge,
} from '@/components/ui/status-badge'
import { ContractBillDueSummaryDialog } from '@/components/business/ContractBillDueSummaryDialog'
import { contractDetailMobileStyles } from '@/components/business/contract-detail-mobile-styles'
import { navigateWithHost, type PageHostNavigation } from '@/components/pages/page-host-navigation'

interface ContractDetailFieldProps {
  label: string
  children: ReactNode
  className?: string
}

function ContractDetailField({
  label,
  children,
  className,
}: ContractDetailFieldProps) {
  return (
    <div className={cn(contractDetailMobileStyles.detailFieldBlock, className)}>
      <label className={contractDetailMobileStyles.detailLabel}>{label}</label>
      <div className={contractDetailMobileStyles.detailFieldValueSlot}>
        {children}
      </div>
    </div>
  )
}

interface EnhancedContractDetailProps {
  contract: ContractWithDetailsForClient
  onEdit?: () => void
  onRenew?: () => void
  onTerminate?: () => void
  onDelete?: () => void
  onViewPDF?: () => void
  onActivate?: () => void // 新增激活回调
  onMeterReading?: () => void // 新增抄表回调
  onOpenRenter?: (renterId: string) => void
  onOpenRoom?: (roomId: string) => void
  onOpenBill?: (billId: string) => void
  contractExpiryAlertDays?: number
  className?: string
  navigation?: PageHostNavigation
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
  onActivate, // 新增激活回调
  onMeterReading, // 新增抄表回调
  onOpenRenter,
  onOpenRoom,
  onOpenBill,
  contractExpiryAlertDays = 30,
  className,
  navigation,
}: EnhancedContractDetailProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'bills' | 'facilities'
  >('overview')

  const isActive = contract.status === 'ACTIVE'
  const isExpired = contract.status === 'EXPIRED'
  const daysUntilExpiry = calculateDaysUntilContractExpiry(contract.endDate)
  const isExpiringSoon = isContractExpiringSoon(
    contract.endDate,
    contractExpiryAlertDays
  )
  const contractBills = contract.bills ?? []

  // 处理租客信息卡片点击
  const handleRenterClick = () => {
    if (onOpenRenter) {
      onOpenRenter(contract.renter.id)
      return
    }

    navigateWithHost(navigation, `/renters/${contract.renter.id}`)
  }

  // 处理房间信息卡片点击
  const handleRoomClick = () => {
    if (onOpenRoom) {
      onOpenRoom(contract.room.id)
      return
    }

    navigateWithHost(navigation, `/rooms/${contract.room.id}`)
  }

  // 处理账单点击
  const handleBillClick = (billId: string) => {
    if (onOpenBill) {
      onOpenBill(billId)
      return
    }

    navigateWithHost(navigation, `/bills/${billId}`)
  }

  // 房间类型文本转换
  const getRoomTypeText = (type: string) => {
    switch (type) {
      case 'SINGLE':
        return '单间'
      case 'SHARED':
        return '合租'
      case 'WHOLE':
        return '整租'
      default:
        return type
    }
  }

  // 计算账单统计
  const billStats = buildBillPresentationStats(
    contractBills.map((bill) => ({
      ...bill,
      status: bill.status,
    }))
  )

  const sortedBills = sortBillsForDisplay(contractBills)
  const billCountCards = [
    {
      title: '总账单',
      value: billStats.totalCount,
      icon: FileText,
      iconClassName: 'text-blue-600',
      valueClassName: 'text-blue-600',
    },
    {
      title: '已结清',
      value: billStats.settledCount,
      icon: CheckCircle,
      iconClassName: 'text-green-600',
      valueClassName: 'text-green-600',
    },
    {
      title: '待处理',
      value: billStats.openCount,
      icon: Clock,
      iconClassName: 'text-yellow-600',
      valueClassName: 'text-yellow-600',
    },
    {
      title: '已逾期',
      value: billStats.overdueCount,
      icon: AlertCircle,
      iconClassName: 'text-red-600',
      valueClassName: 'text-red-600',
    },
  ] as const
  const billAmountCards = [
    {
      title: '总金额',
      value: formatCurrency(billStats.totalAmount),
      valueClassName: 'text-gray-900',
    },
    {
      title: '已收金额',
      value: formatCurrency(billStats.receivedAmount),
      valueClassName: 'text-green-600',
    },
    {
      title: '待收金额',
      value: formatCurrency(billStats.pendingAmount),
      valueClassName: 'text-yellow-600',
    },
  ] as const

  return (
    <div className={cn(contractDetailMobileStyles.detailRoot, className)}>
      <div className={contractDetailMobileStyles.topSectionStack}>
        {/* 顶部状态栏 */}
        <div
          className={cn(
            contractDetailMobileStyles.heroCard,
            isActive
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : isExpired
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-gray-500 to-gray-600'
          )}
        >
          <div className={contractDetailMobileStyles.heroHeader}>
            <div className={contractDetailMobileStyles.heroHeadingBlock}>
              <h1 className={contractDetailMobileStyles.heroTitle}>
                {contract.room.building.name} - {contract.room.roomNumber}
              </h1>
              <p className={contractDetailMobileStyles.heroSubtitle}>
                <span className={contractDetailMobileStyles.heroSubtitlePrimary}>
                  {contract.renter.name}
                </span>
                <span className={contractDetailMobileStyles.heroSubtitleDivider}>
                  ·
                </span>
                <span className={contractDetailMobileStyles.heroSubtitleSecondary}>
                  {contract.contractNumber}
                </span>
              </p>
            </div>
            <ContractStatusBadge
              status={contract.status as ContractStatus}
              className={contractDetailMobileStyles.heroStatusBadge}
            />
          </div>

          {/* 关键信息快览 */}
          <div className={contractDetailMobileStyles.heroQuickGrid}>
            <div
              className={cn(
                contractDetailMobileStyles.heroQuickItem,
                contractDetailMobileStyles.heroQuickWideItem
              )}
            >
              <p className={contractDetailMobileStyles.heroQuickLabel}>合同期限</p>
              <p className={contractDetailMobileStyles.heroQuickValue}>
                {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
              </p>
            </div>
            <div className={contractDetailMobileStyles.heroQuickItem}>
              <p className={contractDetailMobileStyles.heroQuickLabel}>月租金</p>
              <p className={contractDetailMobileStyles.heroQuickValueEmphasis}>
                {formatCurrency(contract.monthlyRent)}
              </p>
            </div>
            <div className={contractDetailMobileStyles.heroQuickItem}>
              <p className={contractDetailMobileStyles.heroQuickLabel}>押金</p>
              <p className={contractDetailMobileStyles.heroQuickValue}>
                {formatCurrency(contract.deposit)}
              </p>
            </div>
            <div className={contractDetailMobileStyles.heroQuickItem}>
              <p className={contractDetailMobileStyles.heroQuickLabel}>付款方式</p>
              <p className={contractDetailMobileStyles.heroQuickValue}>
                {contract.paymentMethod || '月付'}
              </p>
            </div>
          </div>

          {/* 到期提醒 */}
          {isExpiringSoon && (
            <div className={contractDetailMobileStyles.heroAlert}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  合同将在 {daysUntilExpiry} 天后到期，请及时处理续约事宜
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className={contractDetailMobileStyles.actionsGrid}>
          {onEdit && (
            <Button
              variant="outline"
              onClick={onEdit}
              className={contractDetailMobileStyles.actionButton}
            >
              <FileText className="h-4 w-4" />
              编辑合同
            </Button>
          )}
          {contract.status === 'PENDING' && onActivate && (
            <Button
              onClick={onActivate}
              className={cn(
                contractDetailMobileStyles.actionButton,
                'bg-blue-600 hover:bg-blue-700'
              )}
            >
              <CheckCircle className="h-4 w-4" />
              激活合同
            </Button>
          )}
          {isActive && onRenew && (
            <Button
              onClick={onRenew}
              className={cn(
                contractDetailMobileStyles.actionButton,
                'bg-green-600 hover:bg-green-700'
              )}
            >
              <RefreshCw className="h-4 w-4" />
              续租
            </Button>
          )}
          {isActive && onTerminate && (
            <Button
              variant="outline"
              onClick={onTerminate}
              className={cn(
                contractDetailMobileStyles.actionButton,
                'border-orange-300 text-orange-600 hover:bg-orange-50'
              )}
            >
              <UserX className="h-4 w-4" />
              退租
            </Button>
          )}
          {isActive && onMeterReading && (
            <Button
              variant="outline"
              onClick={onMeterReading}
              className={cn(
                contractDetailMobileStyles.actionButton,
                'border-blue-300 text-blue-600 hover:bg-blue-50'
              )}
            >
              <Gauge className="h-4 w-4" />
              抄表录入
            </Button>
          )}
          <ContractBillDueSummaryDialog
            contract={contract}
            trigger={
              <Button
                variant="outline"
                className={cn(
                  contractDetailMobileStyles.actionButton,
                  'border-violet-300 text-violet-700 hover:bg-violet-50'
                )}
              >
                <CreditCard className="h-4 w-4" />
                本次应催缴汇总
              </Button>
            }
          />
          {onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              className={cn(
                contractDetailMobileStyles.actionButton,
                'border-red-300 text-red-600 hover:bg-red-50'
              )}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          )}
        </div>

        {/* 标签页导航 */}
        <div className={contractDetailMobileStyles.tabsContainer}>
          <nav className={contractDetailMobileStyles.tabsNav}>
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                contractDetailMobileStyles.tabButton,
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              合同概览
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={cn(
                contractDetailMobileStyles.tabButton,
                activeTab === 'bills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              账单历史 ({contractBills.length})
            </button>
            <button
              onClick={() => setActiveTab('facilities')}
              className={cn(
                contractDetailMobileStyles.tabButton,
                activeTab === 'facilities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              房间设施
            </button>
          </nav>
        </div>

      </div>

      {/* 统一标签页内容区的顶部节奏来源，避免 overview 额外叠加 topSectionStack 的间距 */}
      {activeTab === 'overview' && (
        <div className={contractDetailMobileStyles.tabPanelSection}>
          <div className={contractDetailMobileStyles.overviewGrid}>
            {/* 租客信息 - 添加点击跳转功能 */}
            <Card
              className={cn(
                contractDetailMobileStyles.overviewCard,
                contractDetailMobileStyles.overviewInteractiveCard
              )}
              onClick={handleRenterClick}
            >
              <CardHeader className={contractDetailMobileStyles.overviewCardHeader}>
                <CardTitle className={contractDetailMobileStyles.overviewCardTitle}>
                  <div className={contractDetailMobileStyles.overviewIconTitle}>
                    <User className="h-5 w-5 text-blue-600" />
                    租客信息
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className={contractDetailMobileStyles.overviewCardContent}>
                <div className={contractDetailMobileStyles.overviewFieldsGrid}>
                  <ContractDetailField label="姓名">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.renter.name}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="性别">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.renter.gender || '未填写'}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="手机号">
                    <p className={contractDetailMobileStyles.detailIconValue}>
                      <Phone className="h-4 w-4 text-gray-400" />
                      {contract.renter.phone}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="身份证号">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.renter.idCard || '未填写'}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="职业">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.renter.occupation || '未填写'}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="公司">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.renter.company || '未填写'}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="入住日期">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.renter.moveInDate
                        ? formatDate(contract.renter.moveInDate)
                        : '未填写'}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="入住人数">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.renter.tenantCount || 1}人
                    </p>
                  </ContractDetailField>
                </div>

                {contract.renter.emergencyContact && (
                  <>
                    <Separator className={contractDetailMobileStyles.divider} />
                    <div className={contractDetailMobileStyles.detailSectionBlock}>
                      <label className={contractDetailMobileStyles.detailLabel}>紧急联系人</label>
                      <p className={contractDetailMobileStyles.detailValueStrong}>
                        {contract.renter.emergencyContact}
                      </p>
                      {contract.renter.emergencyPhone && (
                        <p className="mt-1 flex items-center gap-1 text-sm leading-6 text-gray-500">
                          <Phone className="h-3 w-3" />
                          {contract.renter.emergencyPhone}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {contract.renter.remarks && (
                  <>
                    <Separator className={contractDetailMobileStyles.divider} />
                    <div className={contractDetailMobileStyles.detailSectionBlock}>
                      <label className={contractDetailMobileStyles.noteLabel}>备注</label>
                      <p className={contractDetailMobileStyles.noteText}>
                        {contract.renter.remarks}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 房间信息 - 添加点击跳转功能 */}
            <Card
              className={cn(
                contractDetailMobileStyles.overviewCard,
                contractDetailMobileStyles.overviewInteractiveCard
              )}
              onClick={handleRoomClick}
            >
              <CardHeader className={contractDetailMobileStyles.overviewCardHeader}>
                <CardTitle className={contractDetailMobileStyles.overviewCardTitle}>
                  <div className={contractDetailMobileStyles.overviewIconTitle}>
                    <Home className="h-5 w-5 text-green-600" />
                    房间信息
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className={contractDetailMobileStyles.overviewCardContent}>
                <div className={contractDetailMobileStyles.overviewFieldsGrid}>
                  <ContractDetailField label="房间号">
                    <p className={contractDetailMobileStyles.detailValueLarge}>
                      {contract.room.roomNumber}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="楼栋">
                    <p className={contractDetailMobileStyles.detailIconValue}>
                      <Building className="h-4 w-4 text-gray-400" />
                      {contract.room.building.name}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="楼层">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.room.floorNumber}层
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="房间类型">
                    <p className={contractDetailMobileStyles.detailIconValue}>
                      <Bed className="h-4 w-4 text-gray-400" />
                      {getRoomTypeText(contract.room.roomType)}
                    </p>
                  </ContractDetailField>
                  {contract.room.area && (
                    <ContractDetailField label="面积">
                      <p className={contractDetailMobileStyles.detailIconValue}>
                        <Ruler className="h-4 w-4 text-gray-400" />
                        {contract.room.area}㎡
                      </p>
                    </ContractDetailField>
                  )}
                  <ContractDetailField label="房间状态">
                    <Badge
                      variant={
                        contract.room.status === 'OCCUPIED'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {contract.room.status === 'OCCUPIED' ? '已出租' : '空闲'}
                    </Badge>
                  </ContractDetailField>
                </div>

                {contract.room.building.address && (
                  <>
                    <Separator className={contractDetailMobileStyles.divider} />
                    <div className={contractDetailMobileStyles.detailSectionBlock}>
                      <label className={contractDetailMobileStyles.detailLabel}>楼栋地址</label>
                      <p className={contractDetailMobileStyles.detailIconValue}>
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {contract.room.building.address}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 合同详情 */}
            <Card
              className={cn(contractDetailMobileStyles.overviewCard, 'lg:col-span-2')}
            >
              <CardHeader className={contractDetailMobileStyles.overviewCardHeader}>
                <CardTitle className={contractDetailMobileStyles.overviewCardTitle}>
                  <FileText className="h-5 w-5 text-purple-600" />
                  合同详情
                </CardTitle>
              </CardHeader>
              <CardContent className={contractDetailMobileStyles.overviewCardContent}>
                <div className={contractDetailMobileStyles.contractFieldsGrid}>
                  <ContractDetailField
                    label="合同编号"
                    className={contractDetailMobileStyles.overviewWideField}
                  >
                    <p className={contractDetailMobileStyles.detailValueMono}>
                      {contract.contractNumber}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="合同状态">
                    <ContractStatusBadge
                      status={contract.status as ContractStatus}
                    />
                  </ContractDetailField>
                  <ContractDetailField label="签约人">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.signedBy || contract.renter.name}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="签约时间">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.signedDate
                        ? formatDate(contract.signedDate)
                        : formatDate(contract.createdAt)}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="合同开始">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {formatDate(contract.startDate)}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="合同结束">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {formatDate(contract.endDate)}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="月租金">
                    <p className={contractDetailMobileStyles.detailValueAccent}>
                      {formatCurrency(contract.monthlyRent)}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="总租金">
                    <p className={contractDetailMobileStyles.detailValueAccent}>
                      {formatCurrency(contract.totalRent)}
                    </p>
                  </ContractDetailField>
                  <ContractDetailField label="押金">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {formatCurrency(contract.deposit)}
                    </p>
                  </ContractDetailField>
                  {contract.keyDeposit && (
                    <ContractDetailField label="门卡押金">
                      <p className={contractDetailMobileStyles.detailValueStrong}>
                        {formatCurrency(contract.keyDeposit)}
                      </p>
                    </ContractDetailField>
                  )}
                  {contract.cleaningFee && (
                    <ContractDetailField label="保洁费">
                      <p className={contractDetailMobileStyles.detailValueStrong}>
                        {formatCurrency(contract.cleaningFee)}
                      </p>
                    </ContractDetailField>
                  )}
                  <ContractDetailField label="付款方式">
                    <p className={contractDetailMobileStyles.detailValueStrong}>
                      {contract.paymentMethod || '月付'}
                    </p>
                  </ContractDetailField>
                  {contract.paymentTiming && (
                    <ContractDetailField label="支付时间">
                      <p className={contractDetailMobileStyles.detailValueStrong}>
                        {contract.paymentTiming}
                      </p>
                    </ContractDetailField>
                  )}
                  {contract.isExtended && (
                    <ContractDetailField label="是否延期">
                      <Badge variant="secondary">已延期</Badge>
                    </ContractDetailField>
                  )}
                </div>

                {/* 备注信息 - 如果有备注则显示 */}
                {contract.remarks && (
                  <>
                    <Separator className={contractDetailMobileStyles.divider} />
                    <div className={contractDetailMobileStyles.detailSectionBlock}>
                      <label className={contractDetailMobileStyles.noteLabel}>
                        合同备注
                      </label>
                      <div className={contractDetailMobileStyles.noteBox}>
                        <p className={contractDetailMobileStyles.noteText}>
                          {contract.remarks}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* 业务状态信息 - 如果有则显示 */}
                {contract.businessStatus && (
                  <>
                    <Separator className={contractDetailMobileStyles.divider} />
                    <div className={contractDetailMobileStyles.detailSectionBlock}>
                      <label className={contractDetailMobileStyles.noteLabel}>
                        业务状态
                      </label>
                      <div className={contractDetailMobileStyles.infoBox}>
                        <p className={contractDetailMobileStyles.infoText}>
                          {contract.businessStatus}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'bills' && (
        <div
          className={cn(
            contractDetailMobileStyles.tabPanelSection,
            contractDetailMobileStyles.billsSection
          )}
        >
          {/* 账单统计 */}
          <div className={contractDetailMobileStyles.billsStatsGrid}>
            {billCountCards.map((stat) => {
              const StatIcon = stat.icon

              return (
                <Card
                  key={stat.title}
                  className={contractDetailMobileStyles.billsStatsCard}
                >
                  <CardContent
                    className={contractDetailMobileStyles.billsStatsCardContent}
                  >
                    <div className={contractDetailMobileStyles.billsStatsInline}>
                      <StatIcon
                        className={cn(
                          contractDetailMobileStyles.billsStatsIcon,
                          stat.iconClassName
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            contractDetailMobileStyles.billsStatsCount,
                            stat.valueClassName
                          )}
                        >
                          {stat.value}
                        </p>
                        <p className={contractDetailMobileStyles.billsStatsLabel}>
                          {stat.title}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 金额统计 */}
          <Card className={contractDetailMobileStyles.billsAmountCard}>
            <CardHeader className={contractDetailMobileStyles.billsAmountHeader}>
              <CardTitle className={contractDetailMobileStyles.billsAmountTitle}>
                <DollarSign className="h-5 w-5 text-green-600" />
                金额统计
              </CardTitle>
            </CardHeader>
            <CardContent
              className={contractDetailMobileStyles.billsAmountContent}
            >
              <div className={contractDetailMobileStyles.billsAmountGrid}>
                {billAmountCards.map((stat) => (
                  <div
                    key={stat.title}
                    className={contractDetailMobileStyles.billsAmountItem}
                  >
                    <p
                      className={cn(
                        contractDetailMobileStyles.billsAmountValue,
                        stat.valueClassName
                      )}
                    >
                      {stat.value}
                    </p>
                    <p className={contractDetailMobileStyles.billsAmountLabel}>
                      {stat.title}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 账单列表 - 添加点击跳转功能 */}
          <Card className={contractDetailMobileStyles.billsHistoryCard}>
            <CardHeader className={contractDetailMobileStyles.billsHistoryHeader}>
              <CardTitle className={contractDetailMobileStyles.billsHistoryTitle}>
                账单历史
              </CardTitle>
            </CardHeader>
            <CardContent
              className={contractDetailMobileStyles.billsHistoryContent}
            >
              {sortedBills.length === 0 ? (
                <div className={contractDetailMobileStyles.billsHistoryEmpty}>
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>暂无账单记录</p>
                </div>
              ) : (
                <>
                  <div className={contractDetailMobileStyles.billsHistoryMobileList}>
                    {sortedBills.map((bill) => {
                      const visualConfig = getBillVisualConfig(bill)
                      const BillTypeIcon = visualConfig.icon

                      return (
                        <Card
                          key={bill.id}
                          className={contractDetailMobileStyles.billsHistoryMobileCard}
                          onClick={() => handleBillClick(bill.id)}
                        >
                          <CardContent
                            className={
                              contractDetailMobileStyles.billsHistoryMobileCardContent
                            }
                          >
                            <div
                              className={
                                contractDetailMobileStyles.billsHistoryMobileHeader
                              }
                            >
                              <div
                                className={
                                  contractDetailMobileStyles.billsHistoryMobileLeading
                                }
                              >
                                <div
                                  className={cn(
                                    contractDetailMobileStyles.billsHistoryMobileIconBox,
                                    visualConfig.iconClassName
                                  )}
                                >
                                  <BillTypeIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={
                                      contractDetailMobileStyles.billsHistoryMobileTitle
                                    }
                                  >
                                    {getBillDisplayLabel(bill)}
                                  </p>
                                  <p
                                    className={
                                      contractDetailMobileStyles.billsHistoryMobileMeta
                                    }
                                  >
                                    {bill.billNumber}
                                  </p>
                                  <p
                                    className={
                                      contractDetailMobileStyles.billsHistoryMobileMeta
                                    }
                                  >
                                    到期日：{formatDate(bill.dueDate)}
                                  </p>
                                </div>
                              </div>
                              <BillStatusBadge
                                status={bill.status as BillStatus}
                                className={
                                  contractDetailMobileStyles.billsHistoryMobileBadge
                                }
                              />
                            </div>

                            <div
                              className={
                                contractDetailMobileStyles.billsHistoryMobileDetails
                              }
                            >
                              <div
                                className={
                                  contractDetailMobileStyles.billsHistoryMobileRow
                                }
                              >
                                <span
                                  className={
                                    contractDetailMobileStyles.billsHistoryMobileLabel
                                  }
                                >
                                  应收金额
                                </span>
                                <span
                                  className={cn(
                                    contractDetailMobileStyles.billsHistoryMobileValue,
                                    'font-semibold text-gray-900'
                                  )}
                                >
                                  {formatCurrency(bill.amount)}
                                </span>
                              </div>

                              <div
                                className={
                                  contractDetailMobileStyles.billsHistoryMobileRow
                                }
                              >
                                <span
                                  className={
                                    contractDetailMobileStyles.billsHistoryMobileLabel
                                  }
                                >
                                  已收金额
                                </span>
                                <span
                                  className={cn(
                                    contractDetailMobileStyles.billsHistoryMobileValue,
                                    'text-green-600'
                                  )}
                                >
                                  {formatCurrency(bill.receivedAmount)}
                                </span>
                              </div>

                              {bill.period && (
                                <div
                                  className={
                                    contractDetailMobileStyles.billsHistoryMobileRow
                                  }
                                >
                                  <span
                                    className={
                                      contractDetailMobileStyles.billsHistoryMobileLabel
                                    }
                                  >
                                    账期
                                  </span>
                                  <span
                                    className={
                                      contractDetailMobileStyles.billsHistoryMobileSecondaryValue
                                    }
                                  >
                                    {bill.period}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div
                              className={
                                contractDetailMobileStyles.billsHistoryMobileFooter
                              }
                            >
                              <div
                                className={
                                  contractDetailMobileStyles.billsHistoryMobileFooterRow
                                }
                              >
                                <span
                                  className={
                                    contractDetailMobileStyles.billsHistoryMobileFooterText
                                  }
                                >
                                  {getBillDisplayLabel(bill)}
                                </span>
                                <ExternalLink
                                  className={
                                    contractDetailMobileStyles.billsHistoryMobileLinkIcon
                                  }
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <div className={contractDetailMobileStyles.billsHistoryDesktopList}>
                    {sortedBills.map((bill) => {
                      const visualConfig = getBillVisualConfig(bill)
                      const BillTypeIcon = visualConfig.icon

                      return (
                        <div
                          key={bill.id}
                          className={contractDetailMobileStyles.billsHistoryDesktopItem}
                          onClick={() => handleBillClick(bill.id)}
                        >
                          <div
                            className={
                              contractDetailMobileStyles.billsHistoryDesktopMain
                            }
                          >
                            <div className="flex-shrink-0">
                              <BillStatusBadge status={bill.status as BillStatus} />
                            </div>
                            <div
                              className={cn(
                                contractDetailMobileStyles.billsHistoryDesktopIconBox,
                                visualConfig.iconClassName
                              )}
                            >
                              <BillTypeIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{bill.billNumber}</p>
                              <p className="break-words text-sm text-gray-600">
                                {getBillDisplayLabel(bill)} · 到期日:{' '}
                                {formatDate(bill.dueDate)}
                              </p>
                              {bill.period && (
                                <p className="text-xs text-gray-500">
                                  账期: {bill.period}
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            className={
                              contractDetailMobileStyles.billsHistoryDesktopAmountBlock
                            }
                          >
                            <div className="min-w-0">
                              <p className="font-medium">
                                {formatCurrency(bill.amount)}
                              </p>
                              <p className="text-sm text-gray-600">
                                已收: {formatCurrency(bill.receivedAmount)}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'facilities' && (
        <Card className={contractDetailMobileStyles.tabPanelSection}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              房间设施
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-gray-500">
              <Home className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>房间设施信息功能开发中...</p>
              <p className="mt-2 text-sm">将展示房间内的家具、电器等设施清单</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

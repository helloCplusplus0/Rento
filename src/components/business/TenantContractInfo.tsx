import type { RoomWithBuildingForClient } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/format'
import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TenantContractInfoProps {
  room: RoomWithBuildingForClient
}

/**
 * 租客和合同信息组件
 * 显示当前租客信息和相关合同详情
 */
export function TenantContractInfo({ room }: TenantContractInfoProps) {
  // 获取当前活跃合同
  const activeContract = room.contracts?.find(
    (contract) => contract.status === 'ACTIVE'
  )

  const getContractStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '待签约'
      case 'ACTIVE':
        return '生效中'
      case 'EXPIRED':
        return '已到期'
      case 'TERMINATED':
        return '已终止'
      default:
        return status
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!activeContract) {
    return (
      <Card className={roomDetailMobileStyles.card}>
        <CardHeader className={roomDetailMobileStyles.cardHeader}>
          <CardTitle className={roomDetailMobileStyles.cardTitle}>租客信息</CardTitle>
        </CardHeader>
        <CardContent className={roomDetailMobileStyles.cardContent}>
          <div className={roomDetailMobileStyles.emptyState}>
            <p className={roomDetailMobileStyles.emptyTitle}>暂无租客信息</p>
            <p className={roomDetailMobileStyles.emptyText}>房间当前为空房状态</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={roomDetailMobileStyles.card}>
      <CardHeader className={roomDetailMobileStyles.cardHeader}>
        <div className={roomDetailMobileStyles.cardHeaderRow}>
          <CardTitle className={roomDetailMobileStyles.cardTitle}>租客信息</CardTitle>
          <Badge className={getContractStatusColor(activeContract.status)}>
            {getContractStatusText(activeContract.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={roomDetailMobileStyles.cardContent}>
        {activeContract.renter && (
          <div>
            <h4 className={roomDetailMobileStyles.sectionTitle}>租客详情</h4>
            <div className={roomDetailMobileStyles.fieldsGrid}>
              <div className={roomDetailMobileStyles.fieldBlock}>
                <label className={roomDetailMobileStyles.fieldLabel}>姓名</label>
                <p className={roomDetailMobileStyles.fieldValueStrong}>
                  {activeContract.renter.name}
                </p>
              </div>
              <div className={roomDetailMobileStyles.fieldBlock}>
                <label className={roomDetailMobileStyles.fieldLabel}>联系电话</label>
                <p className={roomDetailMobileStyles.fieldValueStrong}>
                  {activeContract.renter.phone}
                </p>
              </div>
              {activeContract.renter.gender && (
                <div className={roomDetailMobileStyles.fieldBlock}>
                  <label className={roomDetailMobileStyles.fieldLabel}>性别</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {activeContract.renter.gender}
                  </p>
                </div>
              )}
              {activeContract.renter.occupation && (
                <div className={roomDetailMobileStyles.fieldBlock}>
                  <label className={roomDetailMobileStyles.fieldLabel}>职业</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {activeContract.renter.occupation}
                  </p>
                </div>
              )}
              {activeContract.renter.emergencyContact && (
                <div
                  className={`${roomDetailMobileStyles.fieldBlock} ${roomDetailMobileStyles.fieldWide}`}
                >
                  <label className={roomDetailMobileStyles.fieldLabel}>紧急联系人</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {activeContract.renter.emergencyContact}
                  </p>
                </div>
              )}
              {activeContract.renter.emergencyPhone && (
                <div
                  className={`${roomDetailMobileStyles.fieldBlock} ${roomDetailMobileStyles.fieldWide}`}
                >
                  <label className={roomDetailMobileStyles.fieldLabel}>紧急联系电话</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {activeContract.renter.emergencyPhone}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={roomDetailMobileStyles.sectionBlock}>
          <h4 className={roomDetailMobileStyles.sectionTitle}>合同详情</h4>
          <div className={roomDetailMobileStyles.fieldsGrid}>
            <div
              className={`${roomDetailMobileStyles.fieldBlock} ${roomDetailMobileStyles.fieldWide}`}
            >
              <label className={roomDetailMobileStyles.fieldLabel}>合同编号</label>
              <p className={roomDetailMobileStyles.fieldValueStrong}>
                {activeContract.contractNumber}
              </p>
            </div>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>月租金</label>
              <p className="text-sm font-medium leading-5 text-blue-600 sm:leading-6">
                {formatCurrency(activeContract.monthlyRent)}
              </p>
            </div>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>押金</label>
              <p className={roomDetailMobileStyles.fieldValueStrong}>
                {formatCurrency(activeContract.deposit)}
              </p>
            </div>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>合同开始</label>
              <p className={roomDetailMobileStyles.fieldValueStrong}>
                {formatDate(activeContract.startDate)}
              </p>
            </div>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>合同结束</label>
              <p className={roomDetailMobileStyles.fieldValueStrong}>
                {formatDate(activeContract.endDate)}
              </p>
            </div>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>总租金</label>
              <p className={roomDetailMobileStyles.fieldValueStrong}>
                {formatCurrency(activeContract.totalRent)}
              </p>
            </div>
            {activeContract.keyDeposit && (
              <div className={roomDetailMobileStyles.fieldBlock}>
                <label className={roomDetailMobileStyles.fieldLabel}>门卡押金</label>
                <p className={roomDetailMobileStyles.fieldValueStrong}>
                  {formatCurrency(activeContract.keyDeposit)}
                </p>
              </div>
            )}
            {activeContract.cleaningFee && (
              <div className={roomDetailMobileStyles.fieldBlock}>
                <label className={roomDetailMobileStyles.fieldLabel}>保洁费</label>
                <p className={roomDetailMobileStyles.fieldValueStrong}>
                  {formatCurrency(activeContract.cleaningFee)}
                </p>
              </div>
            )}
          </div>
        </div>

        {(activeContract.paymentMethod || activeContract.paymentTiming) && (
          <div className={roomDetailMobileStyles.sectionBlock}>
            <h4 className={roomDetailMobileStyles.sectionTitle}>付款信息</h4>
            <div className={roomDetailMobileStyles.fieldsGrid}>
              {activeContract.paymentMethod && (
                <div className={roomDetailMobileStyles.fieldBlock}>
                  <label className={roomDetailMobileStyles.fieldLabel}>付款方式</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {activeContract.paymentMethod}
                  </p>
                </div>
              )}
              {activeContract.paymentTiming && (
                <div className={roomDetailMobileStyles.fieldBlock}>
                  <label className={roomDetailMobileStyles.fieldLabel}>收租时间</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {activeContract.paymentTiming}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(activeContract.signedBy || activeContract.signedDate) && (
          <div className={roomDetailMobileStyles.sectionBlock}>
            <h4 className={roomDetailMobileStyles.sectionTitle}>签约信息</h4>
            <div className={roomDetailMobileStyles.fieldsGrid}>
              {activeContract.signedBy && (
                <div className={roomDetailMobileStyles.fieldBlock}>
                  <label className={roomDetailMobileStyles.fieldLabel}>签约人</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {activeContract.signedBy}
                  </p>
                </div>
              )}
              {activeContract.signedDate && (
                <div className={roomDetailMobileStyles.fieldBlock}>
                  <label className={roomDetailMobileStyles.fieldLabel}>签约时间</label>
                  <p className={roomDetailMobileStyles.fieldValueStrong}>
                    {formatDate(activeContract.signedDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

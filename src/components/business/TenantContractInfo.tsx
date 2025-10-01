import type { RoomWithBuildingForClient } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/format'
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
      <Card>
        <CardHeader>
          <CardTitle>租客信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <p>暂无租客信息</p>
            <p className="mt-2 text-sm">房间当前为空房状态</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>租客信息</CardTitle>
          <Badge className={getContractStatusColor(activeContract.status)}>
            {getContractStatusText(activeContract.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 租客基本信息 */}
        {activeContract.renter && (
          <div>
            <h4 className="mb-3 font-medium">租客详情</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="text-muted-foreground text-sm">姓名</label>
                <p className="font-medium">{activeContract.renter.name}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm">
                  联系电话
                </label>
                <p className="font-medium">{activeContract.renter.phone}</p>
              </div>
              {activeContract.renter.gender && (
                <div>
                  <label className="text-muted-foreground text-sm">性别</label>
                  <p className="font-medium">{activeContract.renter.gender}</p>
                </div>
              )}
              {activeContract.renter.occupation && (
                <div>
                  <label className="text-muted-foreground text-sm">职业</label>
                  <p className="font-medium">
                    {activeContract.renter.occupation}
                  </p>
                </div>
              )}
              {activeContract.renter.emergencyContact && (
                <div className="col-span-2">
                  <label className="text-muted-foreground text-sm">
                    紧急联系人
                  </label>
                  <p className="font-medium">
                    {activeContract.renter.emergencyContact}
                  </p>
                </div>
              )}
              {activeContract.renter.emergencyPhone && (
                <div className="col-span-2">
                  <label className="text-muted-foreground text-sm">
                    紧急联系电话
                  </label>
                  <p className="font-medium">
                    {activeContract.renter.emergencyPhone}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 合同信息 */}
        <div className="border-t pt-4">
          <h4 className="mb-3 font-medium">合同详情</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <label className="text-muted-foreground text-sm">合同编号</label>
              <p className="font-medium">{activeContract.contractNumber}</p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm">月租金</label>
              <p className="font-medium text-blue-600">
                {formatCurrency(activeContract.monthlyRent)}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm">押金</label>
              <p className="font-medium">
                {formatCurrency(activeContract.deposit)}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm">合同开始</label>
              <p className="font-medium">
                {formatDate(activeContract.startDate)}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm">合同结束</label>
              <p className="font-medium">
                {formatDate(activeContract.endDate)}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm">总租金</label>
              <p className="font-medium">
                {formatCurrency(activeContract.totalRent)}
              </p>
            </div>
            {activeContract.keyDeposit && (
              <div>
                <label className="text-muted-foreground text-sm">
                  门卡押金
                </label>
                <p className="font-medium">
                  {formatCurrency(activeContract.keyDeposit)}
                </p>
              </div>
            )}
            {activeContract.cleaningFee && (
              <div>
                <label className="text-muted-foreground text-sm">保洁费</label>
                <p className="font-medium">
                  {formatCurrency(activeContract.cleaningFee)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 付款信息 */}
        {(activeContract.paymentMethod || activeContract.paymentTiming) && (
          <div className="border-t pt-4">
            <h4 className="mb-3 font-medium">付款信息</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {activeContract.paymentMethod && (
                <div>
                  <label className="text-muted-foreground text-sm">
                    付款方式
                  </label>
                  <p className="font-medium">{activeContract.paymentMethod}</p>
                </div>
              )}
              {activeContract.paymentTiming && (
                <div>
                  <label className="text-muted-foreground text-sm">
                    收租时间
                  </label>
                  <p className="font-medium">{activeContract.paymentTiming}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 签约信息 */}
        {(activeContract.signedBy || activeContract.signedDate) && (
          <div className="border-t pt-4">
            <h4 className="mb-3 font-medium">签约信息</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {activeContract.signedBy && (
                <div>
                  <label className="text-muted-foreground text-sm">
                    签约人
                  </label>
                  <p className="font-medium">{activeContract.signedBy}</p>
                </div>
              )}
              {activeContract.signedDate && (
                <div>
                  <label className="text-muted-foreground text-sm">
                    签约时间
                  </label>
                  <p className="font-medium">
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

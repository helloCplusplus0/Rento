'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/format'

interface ContractRenterInfoProps {
  bill: any
}

/**
 * 合同租客信息组件
 * 显示与账单关联的合同和租客详细信息
 */
export function ContractRenterInfo({ bill }: ContractRenterInfoProps) {
  const { contract } = bill

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 合同信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">合同信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 移动端优化：使用更紧凑的两列布局 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">合同编号</label>
              <p className="text-sm font-mono truncate">{contract.contractNumber}</p>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">房间信息</label>
              <p className="text-sm">
                {contract.room.building.name} - {contract.room.roomNumber}
              </p>
              <p className="text-xs text-gray-500">
                {contract.room.floorNumber}楼 · {contract.room.roomType === 'SHARED' ? '合租' : contract.room.roomType === 'WHOLE' ? '整租' : '单间'}
                {contract.room.area && ` · ${contract.room.area}㎡`}
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">合同期限</label>
              <p className="text-sm">
                {formatDate(contract.startDate)} 至 {formatDate(contract.endDate)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">合同状态</label>
              <p className="text-sm">
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  contract.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {contract.status === 'ACTIVE' ? '生效中' : 
                   contract.status === 'EXPIRED' ? '已到期' : 
                   contract.status === 'TERMINATED' ? '已终止' : contract.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">月租金</label>
              <p className="text-sm font-semibold">
                {formatCurrency(contract.monthlyRent)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">押金</label>
              <p className="text-sm">{formatCurrency(contract.deposit)}</p>
            </div>
            {contract.keyDeposit && (
              <div>
                <label className="text-xs font-medium text-gray-600">钥匙押金</label>
                <p className="text-sm">{formatCurrency(contract.keyDeposit)}</p>
              </div>
            )}
            {contract.cleaningFee && (
              <div>
                <label className="text-xs font-medium text-gray-600">清洁费</label>
                <p className="text-sm">{formatCurrency(contract.cleaningFee)}</p>
              </div>
            )}
          </div>
          {contract.paymentMethod && (
            <div>
              <label className="text-sm font-medium text-gray-600">付款方式</label>
              <p className="text-sm">{contract.paymentMethod}</p>
            </div>
          )}
          {contract.paymentTiming && (
            <div>
              <label className="text-sm font-medium text-gray-600">付款时间</label>
              <p className="text-sm">{contract.paymentTiming}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 租客信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">租客信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 移动端优化：使用更紧凑的两列布局 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">姓名</label>
              <p className="text-sm font-medium">{contract.renter.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">联系电话</label>
              <p className="text-sm font-mono">
                <a href={`tel:${contract.renter.phone}`} className="text-blue-600 hover:underline">
                  {contract.renter.phone}
                </a>
              </p>
            </div>
            {contract.renter.gender && (
              <div>
                <label className="text-xs font-medium text-gray-600">性别</label>
                <p className="text-sm">{contract.renter.gender}</p>
              </div>
            )}
            {contract.renter.occupation && (
              <div>
                <label className="text-xs font-medium text-gray-600">职业</label>
                <p className="text-sm">{contract.renter.occupation}</p>
              </div>
            )}
            {contract.renter.company && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">公司</label>
                <p className="text-sm">{contract.renter.company}</p>
              </div>
            )}
            {contract.renter.moveInDate && (
              <div>
                <label className="text-xs font-medium text-gray-600">入住日期</label>
                <p className="text-sm">{formatDate(contract.renter.moveInDate)}</p>
              </div>
            )}
            {contract.renter.tenantCount && (
              <div>
                <label className="text-xs font-medium text-gray-600">入住人数</label>
                <p className="text-sm">{contract.renter.tenantCount}人</p>
              </div>
            )}
            {contract.renter.idCard && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">身份证号</label>
                <p className="text-sm font-mono">
                  {contract.renter.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
                </p>
              </div>
            )}
            {contract.renter.emergencyContact && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">紧急联系人</label>
                <p className="text-sm">
                  {contract.renter.emergencyContact}
                  {contract.renter.emergencyPhone && (
                    <span className="text-gray-500 ml-2">
                      (<a href={`tel:${contract.renter.emergencyPhone}`} className="text-blue-600 hover:underline">
                        {contract.renter.emergencyPhone}
                      </a>)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
          {contract.renter.remarks && (
            <div>
              <label className="text-xs font-medium text-gray-600">备注</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                {contract.renter.remarks}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
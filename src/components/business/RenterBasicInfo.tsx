'use client'

import {
  Briefcase,
  Building,
  Calendar,
  Edit,
  IdCard,
  Phone,
  User,
  Users,
} from 'lucide-react'

import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RenterBasicInfoProps {
  renter: any
}

export function RenterBasicInfo({ renter }: RenterBasicInfoProps) {
  const activeContract = renter.contracts?.find(
    (c: any) => c.status === 'ACTIVE'
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">姓名</div>
              <div className="font-medium">{renter.name}</div>
            </div>
          </div>

          {renter.gender && (
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">性别</div>
                <div className="font-medium">{renter.gender}</div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">手机号</div>
              <div className="font-medium">{renter.phone}</div>
            </div>
          </div>

          {renter.idCard && (
            <div className="flex items-center space-x-3">
              <IdCard className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">身份证号</div>
                <div className="font-mono font-medium">
                  {renter.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 联系信息 */}
        {(renter.emergencyContact || renter.emergencyPhone) && (
          <div className="border-t pt-4">
            <h4 className="mb-3 font-medium text-gray-900">紧急联系人</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renter.emergencyContact && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">联系人</div>
                    <div className="font-medium">{renter.emergencyContact}</div>
                  </div>
                </div>
              )}

              {renter.emergencyPhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">联系电话</div>
                    <div className="font-medium">{renter.emergencyPhone}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 职业信息 */}
        {(renter.occupation || renter.company) && (
          <div className="border-t pt-4">
            <h4 className="mb-3 font-medium text-gray-900">职业信息</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renter.occupation && (
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">职业</div>
                    <div className="font-medium">{renter.occupation}</div>
                  </div>
                </div>
              )}

              {renter.company && (
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">公司</div>
                    <div className="font-medium">{renter.company}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 入住信息 */}
        <div className="border-t pt-4">
          <h4 className="mb-3 font-medium text-gray-900">入住信息</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renter.moveInDate && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">入住日期</div>
                  <div className="font-medium">
                    {formatDate(renter.moveInDate)}
                  </div>
                </div>
              </div>
            )}

            {renter.tenantCount && (
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">入住人数</div>
                  <div className="font-medium">{renter.tenantCount} 人</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 当前状态 */}
        <div className="border-t pt-4">
          <h4 className="mb-3 font-medium text-gray-900">当前状态</h4>
          <div className="flex items-center space-x-4">
            <Badge variant={activeContract ? 'default' : 'secondary'}>
              {activeContract ? '在租' : '空闲'}
            </Badge>

            {activeContract && (
              <div className="text-sm text-gray-600">
                当前房间: {activeContract.room.building.name} -{' '}
                {activeContract.room.roomNumber}
              </div>
            )}
          </div>
        </div>

        {/* 备注 */}
        {renter.remarks && (
          <div className="border-t pt-4">
            <h4 className="mb-2 font-medium text-gray-900">备注</h4>
            <p className="text-sm text-gray-600">{renter.remarks}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

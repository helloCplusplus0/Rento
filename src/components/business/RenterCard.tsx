'use client'

import { Calendar, Edit, MapPin, Phone, Trash2, User } from 'lucide-react'

import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface RenterCardProps {
  renter: any // 使用any避免复杂的类型定义
  onClick?: (renter: any) => void
  showActions?: boolean
  onEdit?: (renter: any) => void
  onDelete?: (renter: any) => void
}

export function RenterCard({
  renter,
  onClick,
  showActions = true,
  onEdit,
  onDelete,
}: RenterCardProps) {
  const activeContract = renter.contracts?.find(
    (c: any) => c.status === 'ACTIVE'
  )
  const hasActiveContract = !!activeContract

  const handleCardClick = () => {
    onClick?.(renter)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(renter)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(renter)
  }

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* 租客头像 */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <span className="font-semibold text-blue-600">
                {renter.name.charAt(0)}
              </span>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">{renter.name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="mr-1 h-3 w-3" />
                {renter.phone}
              </div>
            </div>
          </div>

          {/* 状态标识 */}
          <Badge variant={hasActiveContract ? 'default' : 'secondary'}>
            {hasActiveContract ? '在租' : '空闲'}
          </Badge>
        </div>

        {/* 当前房间信息 */}
        {activeContract && (
          <div className="mb-3 rounded-md bg-gray-50 p-2">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-1 h-3 w-3" />
              {activeContract.room.building.name} -{' '}
              {activeContract.room.roomNumber}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              租金: ¥{activeContract.monthlyRent}/月
            </div>
          </div>
        )}

        {/* 基本信息 */}
        <div className="mb-3 space-y-1">
          {renter.gender && (
            <div className="flex items-center text-sm text-gray-500">
              <User className="mr-1 h-3 w-3" />
              {renter.gender}
            </div>
          )}

          {renter.moveInDate && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="mr-1 h-3 w-3" />
              入住: {formatDate(renter.moveInDate)}
            </div>
          )}

          {renter.occupation && (
            <div className="text-sm text-gray-500">
              职业: {renter.occupation}
            </div>
          )}
        </div>

        {/* 合同统计 */}
        {renter.contracts && renter.contracts.length > 0 && (
          <div className="mb-3 text-xs text-gray-500">
            历史合同: {renter.contracts.length} 个
          </div>
        )}
      </CardContent>
    </Card>
  )
}

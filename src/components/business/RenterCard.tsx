'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, MapPin, Calendar, Edit, Trash2, User } from 'lucide-react'
import { formatDate } from '@/lib/format'

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
  onDelete 
}: RenterCardProps) {
  const activeContract = renter.contracts?.find((c: any) => c.status === 'ACTIVE')
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
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* 租客头像 */}
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {renter.name.charAt(0)}
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">{renter.name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="w-3 h-3 mr-1" />
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
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-3 h-3 mr-1" />
              {activeContract.room.building.name} - {activeContract.room.roomNumber}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              租金: ¥{activeContract.monthlyRent}/月
            </div>
          </div>
        )}
        
        {/* 基本信息 */}
        <div className="space-y-1 mb-3">
          {renter.gender && (
            <div className="flex items-center text-sm text-gray-500">
              <User className="w-3 h-3 mr-1" />
              {renter.gender}
            </div>
          )}
          
          {renter.moveInDate && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
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
          <div className="text-xs text-gray-500 mb-3">
            历史合同: {renter.contracts.length} 个
          </div>
        )}
      </CardContent>
    </Card>
  )
}
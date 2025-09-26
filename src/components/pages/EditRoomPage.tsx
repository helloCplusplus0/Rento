'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Save, ArrowLeft } from 'lucide-react'
import type { RoomWithBuildingForClient } from '@/types/database'
import type { Building } from '@prisma/client'

interface EditRoomPageProps {
  room: RoomWithBuildingForClient
  buildings: (Building & { totalRooms: number })[]
}

interface RoomFormData {
  roomNumber: string
  floorNumber: number
  buildingId: string
  roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number
  rent: number
  remarks?: string
}

/**
 * 房间编辑页面组件
 * 允许用户编辑房间的基本信息
 */
export function EditRoomPage({ room, buildings }: EditRoomPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: room.roomNumber,
    floorNumber: room.floorNumber,
    buildingId: room.building.id,
    roomType: room.roomType as 'SHARED' | 'WHOLE' | 'SINGLE',
    area: room.area || undefined,
    rent: room.rent,
    remarks: ''
  })

  const handleInputChange = (field: keyof RoomFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.roomNumber.trim()) {
      alert('房间号不能为空')
      return
    }
    
    if (formData.rent <= 0) {
      alert('租金必须大于0')
      return
    }
    
    if (formData.floorNumber <= 0) {
      alert('楼层必须大于0')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        // 显示成功提示
        alert('房间信息更新成功！')
        // 使用 window.location.href 确保页面跳转
        window.location.href = `/rooms/${room.id}`
      } else {
        const error = await response.json()
        alert(`更新失败: ${error.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Failed to update room:', error)
      alert('更新失败，请检查网络连接后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'SHARED': return '合租'
      case 'WHOLE': return '整租'
      case 'SINGLE': return '单间'
      default: return type
    }
  }

  return (
    <PageContainer title={`编辑房间 ${room.roomNumber}`} showBackButton>
      <div className="max-w-2xl mx-auto space-y-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              房间信息编辑
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 楼栋选择 */}
              <div className="space-y-2">
                <Label htmlFor="buildingId">所属楼栋</Label>
                <Select
                  value={formData.buildingId}
                  onValueChange={(value) => handleInputChange('buildingId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择楼栋" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(building => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name} ({building.address || '无地址'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 房间号 */}
              <div className="space-y-2">
                <Label htmlFor="roomNumber">房间号</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                  placeholder="如：101, A201"
                  required
                />
              </div>

              {/* 楼层 */}
              <div className="space-y-2">
                <Label htmlFor="floorNumber">楼层</Label>
                <Input
                  id="floorNumber"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.floorNumber}
                  onChange={(e) => handleInputChange('floorNumber', parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              {/* 房间类型 */}
              <div className="space-y-2">
                <Label htmlFor="roomType">房间类型</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(value) => handleInputChange('roomType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHARED">合租</SelectItem>
                    <SelectItem value="WHOLE">整租</SelectItem>
                    <SelectItem value="SINGLE">单间</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 面积 */}
              <div className="space-y-2">
                <Label htmlFor="area">面积 (㎡)</Label>
                <Input
                  id="area"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.area || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    handleInputChange('area', value ? parseFloat(value) : 0)
                  }}
                  placeholder="可选"
                />
              </div>

              {/* 租金 */}
              <div className="space-y-2">
                <Label htmlFor="rent">租金 (元/月)</Label>
                <Input
                  id="rent"
                  type="number"
                  min="1"
                  value={formData.rent}
                  onChange={(e) => handleInputChange('rent', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? '保存中...' : '保存修改'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 编辑说明 */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">编辑说明：</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>房间号在同一楼栋内必须唯一</li>
                <li>租金修改会影响新签订的合同，现有合同不受影响</li>
                <li>房间类型变更可能影响租赁策略</li>
                <li>面积信息为可选项，用于计算租金密度</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
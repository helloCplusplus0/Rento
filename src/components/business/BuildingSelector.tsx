'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Building } from 'lucide-react'
import type { Building as BuildingType } from '@prisma/client'

interface BuildingSelectorProps {
  buildings: (BuildingType & { totalRooms: number })[]
  onBuildingSelect: (building: BuildingType) => void
  onNewBuilding: (building: BuildingType) => void
}

/**
 * 楼栋选择器组件
 * 支持选择现有楼栋和新建楼栋
 */
export function BuildingSelector({ 
  buildings, 
  onBuildingSelect, 
  onNewBuilding 
}: BuildingSelectorProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newBuilding, setNewBuilding] = useState({
    name: '',
    address: '',
    description: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateBuilding = async () => {
    if (!newBuilding.name.trim()) {
      alert('请输入楼栋名称')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBuilding.name.trim(),
          address: newBuilding.address.trim() || undefined,
          description: newBuilding.description.trim() || undefined
        })
      })
      
      if (response.ok) {
        const building = await response.json()
        onNewBuilding(building)
        setShowNewForm(false)
        setNewBuilding({ name: '', address: '', description: '' })
      } else {
        const error = await response.json()
        alert(`创建失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to create building:', error)
      alert('创建楼栋失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>选择楼栋</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewForm(!showNewForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            新建楼栋
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 新建楼栋表单 */}
        {showNewForm && (
          <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
            <div>
              <Label htmlFor="buildingName">楼栋名称 *</Label>
              <Input
                id="buildingName"
                placeholder="如：平安寓6688_A栋"
                value={newBuilding.name}
                onChange={(e) => setNewBuilding(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="buildingAddress">楼栋地址</Label>
              <Input
                id="buildingAddress"
                placeholder="详细地址"
                value={newBuilding.address}
                onChange={(e) => setNewBuilding(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="buildingDescription">楼栋描述</Label>
              <Input
                id="buildingDescription"
                placeholder="楼栋描述信息"
                value={newBuilding.description}
                onChange={(e) => setNewBuilding(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateBuilding} 
                disabled={!newBuilding.name.trim() || isCreating}
              >
                {isCreating ? '创建中...' : '创建'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewForm(false)}
                disabled={isCreating}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 现有楼栋列表 */}
        {buildings.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {buildings.map(building => (
              <div
                key={building.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onBuildingSelect(building)}
              >
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <h4 className="font-medium">{building.name}</h4>
                    {building.address && (
                      <p className="text-sm text-gray-500">{building.address}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      共 {building.totalRooms} 间房
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无楼栋，请先创建楼栋</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
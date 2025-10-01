'use client'

import { useState } from 'react'
import type { Building as BuildingType } from '@prisma/client'
import { Building, Edit, MoreVertical, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BuildingSelectorProps {
  buildings: (BuildingType & { totalRooms: number })[]
  onBuildingSelect: (building: BuildingType) => void
  onNewBuilding: (building: BuildingType) => void
  onBuildingUpdate?: (building: BuildingType & { totalRooms: number }) => void
  onBuildingDelete?: (buildingId: string) => void
}

/**
 * 楼栋选择器组件
 * 支持选择现有楼栋、新建楼栋、编辑楼栋和删除楼栋
 */
export function BuildingSelector({
  buildings,
  onBuildingSelect,
  onNewBuilding,
  onBuildingUpdate,
  onBuildingDelete,
}: BuildingSelectorProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<
    (BuildingType & { totalRooms: number }) | null
  >(null)
  const [newBuilding, setNewBuilding] = useState({
    name: '',
    address: '',
    description: '',
  })
  const [editBuilding, setEditBuilding] = useState({
    name: '',
    address: '',
    description: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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
          description: newBuilding.description.trim() || undefined,
        }),
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

  const handleEditBuilding = (
    building: BuildingType & { totalRooms: number }
  ) => {
    setEditingBuilding(building)
    setEditBuilding({
      name: building.name,
      address: building.address || '',
      description: building.description || '',
    })
  }

  const handleUpdateBuilding = async () => {
    if (!editingBuilding || !editBuilding.name.trim()) {
      alert('请输入楼栋名称')
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/buildings/${editingBuilding.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editBuilding.name.trim(),
          address: editBuilding.address.trim() || undefined,
          description: editBuilding.description.trim() || undefined,
        }),
      })

      if (response.ok) {
        const updatedBuilding = await response.json()
        onBuildingUpdate?.(updatedBuilding)
        setEditingBuilding(null)
        setEditBuilding({ name: '', address: '', description: '' })
      } else {
        const error = await response.json()
        alert(`更新失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update building:', error)
      alert('更新楼栋失败，请重试')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteBuilding = async (
    building: BuildingType & { totalRooms: number }
  ) => {
    const hasRooms = building.totalRooms > 0

    // 最佳实践：存在房间时禁止直接删除，引导用户先处理房间
    if (hasRooms) {
      alert(
        `无法删除楼栋 "${building.name}"\n\n该楼栋包含 ${building.totalRooms} 间房间。为了数据安全，请先：\n\n1. 终止所有房间的租赁合同\n2. 结清所有相关账单\n3. 删除所有房间\n4. 然后再删除楼栋\n\n这样可以确保不会意外丢失重要的业务数据。`
      )
      return
    }

    // 只有空楼栋才允许删除
    const confirmMessage = `确定要删除空楼栋 "${building.name}" 吗？`
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(building.id)
    try {
      const response = await fetch(`/api/buildings/${building.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        onBuildingDelete?.(building.id)
        alert(result.message || '楼栋删除成功')
      } else {
        const error = await response.json()
        alert(`删除失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete building:', error)
      alert('删除楼栋失败，请重试')
    } finally {
      setIsDeleting(null)
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
            <Plus className="mr-2 h-4 w-4" />
            新建楼栋
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 新建楼栋表单 */}
        {showNewForm && (
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
            <div>
              <Label htmlFor="buildingName">楼栋名称 *</Label>
              <Input
                id="buildingName"
                placeholder="如：平安寓6688_A栋"
                value={newBuilding.name}
                onChange={(e) =>
                  setNewBuilding((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="buildingAddress">楼栋地址</Label>
              <Input
                id="buildingAddress"
                placeholder="详细地址"
                value={newBuilding.address}
                onChange={(e) =>
                  setNewBuilding((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="buildingDescription">楼栋描述</Label>
              <Input
                id="buildingDescription"
                placeholder="楼栋描述信息"
                value={newBuilding.description}
                onChange={(e) =>
                  setNewBuilding((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
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

        {/* 编辑楼栋表单 */}
        {editingBuilding && (
          <div className="space-y-3 rounded-lg border bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-900">编辑楼栋</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingBuilding(null)}
                disabled={isUpdating}
              >
                ✕
              </Button>
            </div>
            <div>
              <Label htmlFor="editBuildingName">楼栋名称 *</Label>
              <Input
                id="editBuildingName"
                placeholder="如：平安寓6688_A栋"
                value={editBuilding.name}
                onChange={(e) =>
                  setEditBuilding((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="editBuildingAddress">楼栋地址</Label>
              <Input
                id="editBuildingAddress"
                placeholder="详细地址"
                value={editBuilding.address}
                onChange={(e) =>
                  setEditBuilding((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="editBuildingDescription">楼栋描述</Label>
              <Input
                id="editBuildingDescription"
                placeholder="楼栋描述信息"
                value={editBuilding.description}
                onChange={(e) =>
                  setEditBuilding((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateBuilding}
                disabled={!editBuilding.name.trim() || isUpdating}
              >
                {isUpdating ? '更新中...' : '更新'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingBuilding(null)}
                disabled={isUpdating}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 现有楼栋列表 */}
        {buildings.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {buildings.map((building) => (
              <div
                key={building.id}
                className="rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Building className="mr-3 h-5 w-5 text-gray-400" />
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onBuildingSelect(building)}
                  >
                    <h4 className="font-medium">{building.name}</h4>
                    {building.address && (
                      <p className="text-sm text-gray-500">
                        {building.address}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      共 {building.totalRooms} 间房
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="ml-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditBuilding(building)
                      }}
                      disabled={editingBuilding?.id === building.id}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBuilding(building)
                      }}
                      disabled={isDeleting === building.id}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {isDeleting === building.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Building className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>暂无楼栋，请先创建楼栋</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import type { Building } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RoomBatchFormProps {
  building: Building
  onRoomsGenerate: (rooms: RoomData[]) => void
}

interface RoomData {
  roomNumber: string
  floorNumber: number
  roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number
  rent: number
}

type RoomType = 'SHARED' | 'WHOLE' | 'SINGLE'

/**
 * 房间批量添加表单组件
 * 支持配置楼层范围、房间数量、类型等批量生成房间
 */
export function RoomBatchForm({
  building,
  onRoomsGenerate,
}: RoomBatchFormProps) {
  const [batchConfig, setBatchConfig] = useState<{
    startFloor: number
    endFloor: number
    roomsPerFloor: number
    roomPrefix: string
    roomType: RoomType
    defaultArea: number
    defaultRent: number
  }>({
    startFloor: 1,
    endFloor: 1,
    roomsPerFloor: 4,
    roomPrefix: '',
    roomType: 'SHARED',
    defaultArea: 25,
    defaultRent: 1500,
  })

  const generateRooms = () => {
    const rooms: RoomData[] = []

    for (
      let floor = batchConfig.startFloor;
      floor <= batchConfig.endFloor;
      floor++
    ) {
      for (
        let roomIndex = 1;
        roomIndex <= batchConfig.roomsPerFloor;
        roomIndex++
      ) {
        const roomNumber = `${batchConfig.roomPrefix}${floor}${roomIndex.toString().padStart(2, '0')}`

        rooms.push({
          roomNumber,
          floorNumber: floor,
          roomType: batchConfig.roomType,
          area: batchConfig.defaultArea || undefined,
          rent: batchConfig.defaultRent,
        })
      }
    }

    onRoomsGenerate(rooms)
  }

  const totalRooms =
    (batchConfig.endFloor - batchConfig.startFloor + 1) *
    batchConfig.roomsPerFloor

  return (
    <Card>
      <CardHeader>
        <CardTitle>批量添加房间</CardTitle>
        <p className="text-sm text-gray-500">为 {building.name} 批量创建房间</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 楼层范围 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startFloor">起始楼层</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="startFloor"
                type="number"
                min="1"
                max="50"
                value={batchConfig.startFloor}
                onChange={(e) =>
                  setBatchConfig((prev) => ({
                    ...prev,
                    startFloor: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="flex-1"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      startFloor: Math.min(50, prev.startFloor + 1),
                    }))
                  }
                  className="rounded-t border border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      startFloor: Math.max(1, prev.startFloor - 1),
                    }))
                  }
                  className="rounded-b border border-t-0 border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="endFloor">结束楼层</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="endFloor"
                type="number"
                min="1"
                max="50"
                value={batchConfig.endFloor}
                onChange={(e) =>
                  setBatchConfig((prev) => ({
                    ...prev,
                    endFloor: Math.max(
                      prev.startFloor,
                      parseInt(e.target.value) || 1
                    ),
                  }))
                }
                className="flex-1"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      endFloor: Math.min(50, prev.endFloor + 1),
                    }))
                  }
                  className="rounded-t border border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      endFloor: Math.max(prev.startFloor, prev.endFloor - 1),
                    }))
                  }
                  className="rounded-b border border-t-0 border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 房间配置 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="roomsPerFloor">每层房间数</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="roomsPerFloor"
                type="number"
                min="1"
                max="20"
                value={batchConfig.roomsPerFloor}
                onChange={(e) =>
                  setBatchConfig((prev) => ({
                    ...prev,
                    roomsPerFloor: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="flex-1"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      roomsPerFloor: Math.min(20, prev.roomsPerFloor + 1),
                    }))
                  }
                  className="rounded-t border border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      roomsPerFloor: Math.max(1, prev.roomsPerFloor - 1),
                    }))
                  }
                  className="rounded-b border border-t-0 border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="roomPrefix">房间号前缀</Label>
            <Input
              id="roomPrefix"
              placeholder="如: A"
              maxLength={3}
              value={batchConfig.roomPrefix}
              onChange={(e) =>
                setBatchConfig((prev) => ({
                  ...prev,
                  roomPrefix: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>
        </div>

        {/* 房间类型 */}
        <div>
          <Label htmlFor="roomType">房间类型</Label>
          <select
            id="roomType"
            value={batchConfig.roomType}
            onChange={(e) =>
              setBatchConfig((prev) => ({
                ...prev,
                roomType: e.target.value as RoomType,
              }))
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="SHARED">合租</option>
            <option value="WHOLE">整租</option>
            <option value="SINGLE">单间</option>
          </select>
        </div>

        {/* 默认信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="defaultArea">默认面积 (㎡)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="defaultArea"
                type="number"
                min="10"
                max="200"
                value={batchConfig.defaultArea}
                onChange={(e) =>
                  setBatchConfig((prev) => ({
                    ...prev,
                    defaultArea: Math.max(10, parseInt(e.target.value) || 25),
                  }))
                }
                className="flex-1"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      defaultArea: Math.min(200, prev.defaultArea + 5),
                    }))
                  }
                  className="rounded-t border border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      defaultArea: Math.max(10, prev.defaultArea - 5),
                    }))
                  }
                  className="rounded-b border border-t-0 border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="defaultRent">默认租金 (元)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="defaultRent"
                type="number"
                min="100"
                max="50000"
                value={batchConfig.defaultRent}
                onChange={(e) =>
                  setBatchConfig((prev) => ({
                    ...prev,
                    defaultRent: Math.max(
                      100,
                      parseInt(e.target.value) || 1500
                    ),
                  }))
                }
                className="flex-1"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      defaultRent: Math.min(50000, prev.defaultRent + 100),
                    }))
                  }
                  className="rounded-t border border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBatchConfig((prev) => ({
                      ...prev,
                      defaultRent: Math.max(100, prev.defaultRent - 100),
                    }))
                  }
                  className="rounded-b border border-t-0 border-gray-300 bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 预览信息 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                将创建 {totalRooms} 间房间
              </p>
              <p className="mt-1 text-xs text-blue-700">
                房间号示例: {batchConfig.roomPrefix}
                {batchConfig.startFloor}01, {batchConfig.roomPrefix}
                {batchConfig.startFloor}02...
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={generateRooms}
          className="w-full"
          disabled={totalRooms <= 0 || totalRooms > 100}
        >
          生成房间列表
        </Button>

        {totalRooms > 100 && (
          <p className="text-center text-xs text-red-500">
            单次最多创建100间房间，请调整配置
          </p>
        )}
      </CardContent>
    </Card>
  )
}

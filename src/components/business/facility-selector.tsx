import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Facility {
  id: string
  name: string
  category: string
  icon?: React.ReactNode
}

interface FacilityCategory {
  id: string
  name: string
  facilities: Facility[]
}

interface FacilitySelectorProps {
  categories: FacilityCategory[]
  selectedFacilities?: string[]
  onChange?: (selectedIds: string[]) => void
  maxSelections?: number
  className?: string
}

/**
 * 房屋设施选择器组件
 * 支持多选标签、分类展示，类似生产环境的设施选择界面
 */
export function FacilitySelector({
  categories,
  selectedFacilities = [],
  onChange,
  maxSelections,
  className,
}: FacilitySelectorProps) {
  const [localSelected, setLocalSelected] =
    useState<string[]>(selectedFacilities)

  const handleToggleFacility = (facilityId: string) => {
    const newSelected = localSelected.includes(facilityId)
      ? localSelected.filter((id) => id !== facilityId)
      : maxSelections && localSelected.length >= maxSelections
        ? localSelected
        : [...localSelected, facilityId]

    setLocalSelected(newSelected)
    onChange?.(newSelected)
  }

  const handleClearAll = () => {
    setLocalSelected([])
    onChange?.([])
  }

  const handleSelectAll = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return

    const categoryFacilityIds = category.facilities.map((f) => f.id)
    const otherSelected = localSelected.filter(
      (id) => !categoryFacilityIds.includes(id)
    )

    const newSelected = [...otherSelected, ...categoryFacilityIds]
    const finalSelected = maxSelections
      ? newSelected.slice(0, maxSelections)
      : newSelected

    setLocalSelected(finalSelected)
    onChange?.(finalSelected)
  }

  const getAllFacilities = () => {
    return categories.flatMap((cat) => cat.facilities)
  }

  const getSelectedFacilityNames = () => {
    const allFacilities = getAllFacilities()
    return localSelected
      .map((id) => allFacilities.find((f) => f.id === id)?.name)
      .filter(Boolean)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 选择状态显示 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              已选设施 ({localSelected.length}
              {maxSelections && `/${maxSelections}`})
            </CardTitle>
            {localSelected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 px-2 text-xs"
              >
                清空
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {localSelected.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂未选择任何设施</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getSelectedFacilityNames().map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 设施分类选择 */}
      <div className="space-y-4">
        {categories.map((category, categoryIndex) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectAll(category.id)}
                  className="h-8 px-2 text-xs"
                  disabled={Boolean(
                    maxSelections && localSelected.length >= maxSelections
                  )}
                >
                  全选
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {category.facilities.map((facility) => {
                  const isSelected = localSelected.includes(facility.id)
                  const isDisabled =
                    !isSelected &&
                    Boolean(
                      maxSelections && localSelected.length >= maxSelections
                    )

                  return (
                    <FacilityItem
                      key={facility.id}
                      facility={facility}
                      selected={isSelected}
                      disabled={isDisabled}
                      onClick={() =>
                        !isDisabled && handleToggleFacility(facility.id)
                      }
                    />
                  )
                })}
              </div>
            </CardContent>
            {categoryIndex < categories.length - 1 && <Separator />}
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * 设施项组件
 */
function FacilityItem({
  facility,
  selected,
  disabled,
  onClick,
}: {
  facility: Facility
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all',
        'hover:shadow-sm active:scale-95',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-background hover:border-primary/50'
      )}
    >
      {facility.icon && (
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md',
            selected ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {facility.icon}
        </div>
      )}
      <span
        className={cn(
          'text-center text-sm leading-tight font-medium',
          selected ? 'text-primary' : 'text-foreground'
        )}
      >
        {facility.name}
      </span>
      {selected && (
        <div className="bg-primary flex h-4 w-4 items-center justify-center rounded-full">
          <svg
            className="text-primary-foreground h-2.5 w-2.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  )
}

/**
 * 预定义的设施图标
 */
export const FacilityIcons = {
  // 基础设施
  Wifi: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
    </svg>
  ),

  AirConditioner: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.59 3.41L5 5l1.41 1.41L8 4.83V7H6v2h2v2.17l-1.59-1.58L5 11l1.59 1.59L8 11.17V13h2v-2h2.17l-1.58 1.59L11 14l1.41-1.41L11 11.17V9h2V7h-2V4.83l1.59 1.58L14 5l-1.59-1.59L11 2H8v1.41L6.59 3.41z" />
    </svg>
  ),

  Refrigerator: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 2h6c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm1 2v6h1V4h-1zm0 8v6h1v-6h-1z" />
    </svg>
  ),

  WashingMachine: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 2.01L6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6V4h12v16zM8 6h2v2H8V6zm4 0h2v2h-2V6zm-4 4c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5zm2 0c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z" />
    </svg>
  ),

  // 家具
  Bed: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 10.78V8c0-1.65-1.35-3-3-3h-4c-.77 0-1.47.3-2 .78-.53-.48-1.23-.78-2-.78H6C4.35 5 3 6.35 3 8v2.78c-.61.55-1 1.34-1 2.22v6h2v-2h16v2h2v-6c0-.88-.39-1.67-1-2.22zM14 7h4c.55 0 1 .45 1 1v2h-6V8c0-.55.45-1 1-1zM5 8c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v2H5V8zm-1 5h16v2H4v-2z" />
    </svg>
  ),

  Wardrobe: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 2h12c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v16h5V4H6zm7 0v16h5V4h-5zm-2 8h2v2h-2v-2z" />
    </svg>
  ),

  Desk: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 6V4c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v2H2v2h2v10h2V8h12v10h2V8h2V6h-2zm-2 0H6V4h12v2z" />
    </svg>
  ),

  // 厨房设施
  Microwave: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67c-.11.15-.17.34-.17.53V6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM4 16V8h16v8H4zm2-6h8v4H6v-4zm10 1h2v2h-2v-2z" />
    </svg>
  ),

  Stove: () => (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.1 5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S10.43 7 9.6 7s-1.5-.67-1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1.5-9c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm3 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
    </svg>
  ),
}

/**
 * 预定义的设施分类数据
 */
export const defaultFacilityCategories: FacilityCategory[] = [
  {
    id: 'basic',
    name: '基础设施',
    facilities: [
      {
        id: 'wifi',
        name: 'WiFi',
        category: 'basic',
        icon: <FacilityIcons.Wifi />,
      },
      {
        id: 'ac',
        name: '空调',
        category: 'basic',
        icon: <FacilityIcons.AirConditioner />,
      },
      { id: 'heating', name: '暖气', category: 'basic' },
      { id: 'water_heater', name: '热水器', category: 'basic' },
      { id: 'elevator', name: '电梯', category: 'basic' },
      { id: 'parking', name: '停车位', category: 'basic' },
    ],
  },
  {
    id: 'appliances',
    name: '家用电器',
    facilities: [
      {
        id: 'refrigerator',
        name: '冰箱',
        category: 'appliances',
        icon: <FacilityIcons.Refrigerator />,
      },
      {
        id: 'washing_machine',
        name: '洗衣机',
        category: 'appliances',
        icon: <FacilityIcons.WashingMachine />,
      },
      {
        id: 'microwave',
        name: '微波炉',
        category: 'appliances',
        icon: <FacilityIcons.Microwave />,
      },
      { id: 'tv', name: '电视', category: 'appliances' },
      { id: 'dryer', name: '烘干机', category: 'appliances' },
      { id: 'dishwasher', name: '洗碗机', category: 'appliances' },
    ],
  },
  {
    id: 'furniture',
    name: '家具配置',
    facilities: [
      {
        id: 'bed',
        name: '床',
        category: 'furniture',
        icon: <FacilityIcons.Bed />,
      },
      {
        id: 'wardrobe',
        name: '衣柜',
        category: 'furniture',
        icon: <FacilityIcons.Wardrobe />,
      },
      {
        id: 'desk',
        name: '书桌',
        category: 'furniture',
        icon: <FacilityIcons.Desk />,
      },
      { id: 'sofa', name: '沙发', category: 'furniture' },
      { id: 'dining_table', name: '餐桌', category: 'furniture' },
      { id: 'bookshelf', name: '书架', category: 'furniture' },
    ],
  },
  {
    id: 'kitchen',
    name: '厨房设施',
    facilities: [
      {
        id: 'stove',
        name: '燃气灶',
        category: 'kitchen',
        icon: <FacilityIcons.Stove />,
      },
      { id: 'range_hood', name: '抽油烟机', category: 'kitchen' },
      { id: 'oven', name: '烤箱', category: 'kitchen' },
      { id: 'sink', name: '洗菜盆', category: 'kitchen' },
      { id: 'cabinet', name: '橱柜', category: 'kitchen' },
      { id: 'countertop', name: '操作台', category: 'kitchen' },
    ],
  },
]

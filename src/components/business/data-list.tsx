import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface DataColumn<T = any> {
  key: keyof T
  title: string
  width?: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: T) => React.ReactNode
}

interface FilterOption {
  key: string
  label: string
  value: string
}

interface DataListProps<T = any> {
  data: T[]
  columns: DataColumn<T>[]
  title?: string
  searchable?: boolean
  searchPlaceholder?: string
  filters?: FilterOption[]
  pageSize?: number
  onRowClick?: (record: T) => void
  className?: string
}

/**
 * 高级数据列表组件
 * 支持搜索、筛选、排序、分页等功能
 */
export function DataList<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  searchPlaceholder = '搜索...',
  filters = [],
  pageSize = 10,
  onRowClick,
  className,
}: DataListProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

  // 过滤和搜索数据
  const filteredData = useMemo(() => {
    let result = [...data]

    // 搜索过滤
    if (searchTerm) {
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // 筛选器过滤
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => String(item[key]) === value)
      }
    })

    // 排序
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return result
  }, [data, searchTerm, activeFilters, sortConfig])

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  // 生成网格模板，优化列宽分配
  const getGridTemplate = () => {
    const totalColumns = columns.length
    if (totalColumns <= 2) return 'repeat(2, 1fr)'
    if (totalColumns === 3) return '2fr 1fr 1fr'
    if (totalColumns === 4) return '2fr 1fr 1fr 1fr'
    return `repeat(${totalColumns}, 1fr)`
  }

  const handleSort = (key: keyof T) => {
    const column = columns.find((col) => col.key === key)
    if (!column?.sortable) return

    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }))
    setCurrentPage(1) // 重置到第一页
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  return (
    <Card className={className}>
      {(title || searchable || filters.length > 0) && (
        <CardHeader className="pb-4">
          {title && <CardTitle>{title}</CardTitle>}

          {/* 搜索和筛选区域 */}
          <div className="space-y-4">
            {searchable && (
              <div className="max-w-sm flex-1">
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-10"
                />
              </div>
            )}

            {filters.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <FilterSelect
                      key={filter.key}
                      filter={filter}
                      value={activeFilters[filter.key] || ''}
                      onChange={(value) =>
                        handleFilterChange(filter.key, value)
                      }
                      data={data}
                    />
                  ))}
                </div>

                {(Object.values(activeFilters).some((v) => v) ||
                  searchTerm) && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      已筛选:
                    </span>
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        搜索: {searchTerm}
                      </Badge>
                    )}
                    {Object.entries(activeFilters).map(([key, value]) => {
                      if (!value) return null
                      const filter = filters.find((f) => f.key === key)
                      return (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="text-xs"
                        >
                          {filter?.label}: {value}
                        </Badge>
                      )
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      清除
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* 数据统计 */}
        <div className="bg-muted/50 text-muted-foreground px-6 py-3 text-sm">
          共 {filteredData.length} 条记录
          {filteredData.length !== data.length &&
            ` (从 ${data.length} 条中筛选)`}
        </div>

        {/* 表格头部 */}
        <div className="bg-muted/30 border-b px-6 py-3">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: getGridTemplate() }}
          >
            {columns.map((column) => (
              <div
                key={String(column.key)}
                className={cn(
                  'flex items-center justify-between',
                  column.sortable && 'hover:text-foreground cursor-pointer'
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <span className="text-sm font-medium">{column.title}</span>
                {column.sortable && (
                  <div className="ml-2 flex items-center">
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        sortConfig.key === column.key
                          ? sortConfig.direction === 'asc'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      ↑
                    </span>
                    <span
                      className={cn(
                        'ml-0.5 text-xs transition-colors',
                        sortConfig.key === column.key
                          ? sortConfig.direction === 'desc'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      ↓
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 数据行 */}
        <div className="divide-y">
          {paginatedData.length === 0 ? (
            <div className="text-muted-foreground px-6 py-8 text-center">
              暂无数据
            </div>
          ) : (
            paginatedData.map((record, index) => (
              <div
                key={index}
                className={cn(
                  'hover:bg-muted/50 px-6 py-4 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(record)}
              >
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: getGridTemplate() }}
                >
                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className="flex items-center text-sm"
                    >
                      {column.render
                        ? column.render(record[column.key], record)
                        : String(record[column.key] || '-')}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-muted-foreground text-sm">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 筛选选择器组件
 */
function FilterSelect<T>({
  filter,
  value,
  onChange,
  data,
}: {
  filter: FilterOption
  value: string
  onChange: (value: string) => void
  data: T[]
}) {
  // 从数据中提取唯一值作为选项
  const options = useMemo(() => {
    const uniqueValues = [
      ...new Set(data.map((item) => String(item[filter.key as keyof T]))),
    ]
    return uniqueValues.filter(Boolean).sort()
  }, [data, filter.key])

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'bg-background h-8 rounded border px-2 text-xs',
        'focus:ring-ring focus:ring-2 focus:outline-none'
      )}
    >
      <option value="">全部{filter.label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

/**
 * 数据列表骨架屏
 */
export function DataListSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-10 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-muted/50 px-6 py-3">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="grid gap-4 px-6 py-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 animate-pulse rounded bg-gray-200"
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

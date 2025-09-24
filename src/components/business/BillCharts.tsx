'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import { getBillTypeText, type BillStatsData } from '@/lib/bill-stats'

interface BillChartsProps {
  data: BillStatsData
  loading?: boolean
}

export function BillCharts({ data, loading }: BillChartsProps) {
  if (loading) {
    return <BillChartsSkeleton />
  }
  
  // 收支趋势数据
  const trendData = data.timeSeries.map(item => ({
    date: item.date,
    应收: item.totalAmount,
    已收: item.paidAmount,
    待收: item.pendingAmount
  }))
  
  // 状态分布数据
  const statusData = [
    { name: '已付款', value: data.paidAmount, color: '#10b981' },
    { name: '待付款', value: data.pendingAmount, color: '#f59e0b' },
    { name: '逾期', value: data.overdueAmount, color: '#ef4444' }
  ].filter(item => item.value > 0) // 只显示有数据的状态
  
  // 类型分布数据
  const typeData = Object.entries(data.typeBreakdown)
    .filter(([, stats]) => stats.amount > 0) // 只显示有数据的类型
    .map(([type, stats]) => ({
      name: getBillTypeText(type),
      金额: stats.amount,
      数量: stats.count
    }))
  
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 收支趋势图 */}
      {trendData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>收支趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="应收" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="已收" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="待收" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* 状态分布图 */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* 类型分布图 */}
      {typeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="金额" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* 空状态 */}
      {trendData.length === 0 && statusData.length === 0 && typeData.length === 0 && (
        <Card className="md:col-span-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无统计数据</h3>
            <p className="text-gray-600 text-center">
              当前时间范围内没有账单数据，请选择其他时间范围或创建账单
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * 图表加载骨架屏
 */
function BillChartsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 趋势图骨架 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
      
      {/* 饼图骨架 */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
      
      {/* 柱状图骨架 */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    </div>
  )
}
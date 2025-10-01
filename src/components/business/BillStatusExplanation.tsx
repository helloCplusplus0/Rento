'use client'

import { AlertTriangle, CheckCircle, Clock, Info, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * 账单状态说明组件
 * 帮助用户理解账单状态的含义和流转逻辑
 */
export function BillStatusExplanation() {
  const statusExplanations = [
    {
      status: 'PENDING',
      label: '待付',
      color: 'yellow',
      icon: <Clock className="h-4 w-4" />,
      description: '账单已生成，等待收款',
      scenarios: ['新生成的账单', '尚未收到任何款项'],
      nextSteps: ['收到款项后变为"部分付款"', '超过到期日变为"逾期"'],
    },
    {
      status: 'PAID',
      label: '部分付款',
      color: 'green',
      icon: <CheckCircle className="h-4 w-4" />,
      description: '已收到部分或全部款项，但账单流程未完结',
      scenarios: [
        '收到部分款项（如1000元账单收了500元）',
        '收到全部款项但需要后续处理（如开票、记账）',
      ],
      nextSteps: ['待收金额为0时可标记为"已完成"', '继续收取剩余款项'],
    },
    {
      status: 'OVERDUE',
      label: '逾期',
      color: 'red',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: '超过到期日期仍未收款',
      scenarios: ['超过到期日且待收金额>0', '需要催收处理'],
      nextSteps: ['收到款项后变为"部分付款"', '可恢复为"待付"状态'],
    },
    {
      status: 'COMPLETED',
      label: '已完成',
      color: 'blue',
      icon: <XCircle className="h-4 w-4" />,
      description: '账单完全结清，所有相关工作已完成',
      scenarios: ['待收金额为0', '所有后续工作（开票、记账等）已完成'],
      nextSteps: ['账单流程结束，无需进一步操作'],
    },
  ]

  const getStatusColor = (color: string) => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    return colors[color as keyof typeof colors] || colors.yellow
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          账单状态说明
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusExplanations.map((item) => (
          <div key={item.status} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Badge
                className={`${getStatusColor(item.color)} flex items-center gap-1`}
              >
                {item.icon}
                {item.label}
              </Badge>
              <span className="font-medium text-gray-900">
                {item.description}
              </span>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-gray-700">适用场景：</h4>
                <ul className="space-y-1 text-gray-600">
                  {item.scenarios.map((scenario, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 text-gray-400">•</span>
                      <span>{scenario}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-700">后续操作：</h4>
                <ul className="space-y-1 text-gray-600">
                  {item.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 text-gray-400">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        {/* 状态流转图 */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 font-medium text-gray-900">状态流转路径：</h4>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-yellow-100 text-yellow-800">待付</Badge>
            <span className="text-gray-400">→</span>
            <Badge className="bg-green-100 text-green-800">部分付款</Badge>
            <span className="text-gray-400">→</span>
            <Badge className="bg-blue-100 text-blue-800">已完成</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-yellow-100 text-yellow-800">待付</Badge>
            <span className="text-gray-400">→</span>
            <Badge className="bg-red-100 text-red-800">逾期</Badge>
            <span className="text-gray-400">→</span>
            <Badge className="bg-green-100 text-green-800">部分付款</Badge>
          </div>
        </div>

        {/* 关键提示 */}
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="mb-1 font-medium">💡 设计理念：</p>
              <p>
                "部分付款"状态区分了"已收款"和"完全结清"两个概念，支持分期收款和后续处理流程，
                让账单管理更加精细化和专业化。
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Building, FileText, Plus, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'

export const metadata: Metadata = {
  title: '添加功能',
  description: '快速添加房源、租客、合同和账单信息',
}

/**
 * 添加功能页面
 * 提供快速添加各类信息的入口
 */
export default function AddPage() {
  const addItems = [
    {
      id: 'add-room',
      title: '添加房间',
      description: '新增房间信息，支持批量添加',
      icon: Building,
      href: '/add/room',
      color: 'bg-blue-500 hover:bg-blue-600',
      available: true,
    },
    {
      id: 'add-renter',
      title: '添加租客',
      description: '录入租客基本信息',
      icon: Users,
      href: '/renters/new',
      color: 'bg-green-500 hover:bg-green-600',
      available: true,
    },
    {
      id: 'add-contract',
      title: '创建合同',
      description: '新建租赁合同',
      icon: FileText,
      href: '/add/contract',
      color: 'bg-purple-500 hover:bg-purple-600',
      available: true,
    },
    {
      id: 'add-bill',
      title: '添加账单',
      description: '快速录入账单信息',
      icon: Plus,
      href: '/bills/create',
      color: 'bg-orange-500 hover:bg-orange-600',
      available: true,
    },
  ]

  return (
    <PageContainer title="添加功能" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 页面说明 */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Plus className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">添加功能</h2>
          <p className="text-gray-600">快速添加房源、租客、合同和账单信息</p>
        </div>

        {/* 功能网格 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addItems.map((item) => {
            const IconComponent = item.icon

            if (item.available) {
              return (
                <Link key={item.id} href={item.href}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-10 w-10 rounded-lg ${item.color} flex items-center justify-center`}
                        >
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {item.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            } else {
              return (
                <Card key={item.id} className="h-full opacity-60">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-300">
                        <IconComponent className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-gray-500">
                          {item.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="mt-2 text-xs text-gray-400">即将推出</p>
                  </CardContent>
                </Card>
              )
            }
          })}
        </div>
      </div>
    </PageContainer>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building, FileText, Plus, Users } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'
import { addPageMobileStyles } from '@/app/add/add-page-mobile-styles'

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
      <div className={addPageMobileStyles.pageSection}>
        <Card className={addPageMobileStyles.introCard}>
          <CardContent className="p-0">
            <div className={addPageMobileStyles.introTitle}>快捷新增入口</div>
            <div className={addPageMobileStyles.introText}>
              选择要新增的业务对象，进入对应正式创建流程。
            </div>
          </CardContent>
        </Card>

        <div className={addPageMobileStyles.grid}>
          {addItems.map((item) => {
            const IconComponent = item.icon

            if (item.available) {
              return (
                <Link key={item.id} href={item.href}>
                  <Card className={`${addPageMobileStyles.card} h-full cursor-pointer`}>
                    <CardContent className={addPageMobileStyles.cardContent}>
                      <div className={addPageMobileStyles.cardHeader}>
                        <div className={addPageMobileStyles.cardLeading}>
                          <div className={`${addPageMobileStyles.iconBox} ${item.color}`}>
                            <IconComponent className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={addPageMobileStyles.title}>
                              {item.title}
                            </div>
                            <div className={addPageMobileStyles.description}>
                              {item.description}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            } else {
              return (
                <Card key={item.id} className={`${addPageMobileStyles.card} h-full opacity-60`}>
                  <CardContent className={addPageMobileStyles.cardContent}>
                    <div className={addPageMobileStyles.cardHeader}>
                      <div className={addPageMobileStyles.cardLeading}>
                        <div className={`${addPageMobileStyles.iconBox} bg-gray-200`}>
                          <IconComponent className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`${addPageMobileStyles.title} text-gray-500`}>
                            {item.title}
                          </div>
                          <div className="mt-0.5 text-sm leading-5 text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={addPageMobileStyles.footer}>
                      <div className={addPageMobileStyles.footerRow}>
                        <div className={addPageMobileStyles.footerHint}>即将推出</div>
                      </div>
                    </div>
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

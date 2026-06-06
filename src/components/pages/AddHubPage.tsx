'use client'

import { ArrowRight, Building, FileText, Plus, Users } from 'lucide-react'

import { addPageMobileStyles } from '@/app/add/add-page-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'

interface AddHubPageProps {
  onNavigate?: (href: string) => void
}

const addItems = [
  {
    id: 'add-room',
    title: '添加房间',
    description: '新增房间信息，支持批量添加',
    icon: Building,
    href: '/add/room',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'add-renter',
    title: '添加租客',
    description: '录入租客基本信息',
    icon: Users,
    href: '/renters/new',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    id: 'add-contract',
    title: '创建合同',
    description: '新建租赁合同',
    icon: FileText,
    href: '/add/contract',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'add-bill',
    title: '添加账单',
    description: '快速录入账单信息',
    icon: Plus,
    href: '/bills/create',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
]

export function AddHubPage({ onNavigate }: AddHubPageProps) {
  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href)
      return
    }

    if (typeof window !== 'undefined') {
      window.location.assign(href)
    }
  }

  return (
    <PageContainer title="添加功能" showBackButton>
      <div className={addPageMobileStyles.pageSection}>
        <Card className={addPageMobileStyles.introCard}>
          <CardContent className="p-0">
            <div className="space-y-1">
              <div className={addPageMobileStyles.introTitle}>
                请选择需要添加的内容
              </div>
              <div className={addPageMobileStyles.introText}>
                从这里快速进入房间、租客、合同和账单的新增流程。
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={addPageMobileStyles.grid}>
          {addItems.map((item) => {
            const IconComponent = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.href)}
                className="w-full text-left"
              >
                <Card className={`${addPageMobileStyles.card} h-full cursor-pointer`}>
                  <CardContent className={addPageMobileStyles.cardContent}>
                    <div className={addPageMobileStyles.cardHeader}>
                      <div className={addPageMobileStyles.cardLeading}>
                        <div className={`${addPageMobileStyles.iconBox} ${item.color}`}>
                          <IconComponent className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={addPageMobileStyles.title}>{item.title}</div>
                          <div className={addPageMobileStyles.description}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      </div>
    </PageContainer>
  )
}

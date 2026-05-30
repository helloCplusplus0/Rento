'use client'

import { Phone, User } from 'lucide-react'

import { formatDate } from '@/lib/format'
import { renterListMobileStyles } from '@/components/business/renter-list-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TouchCard } from '@/components/ui/touch-button'

interface RenterCardProps {
  renter: any // 使用any避免复杂的类型定义
  onClick?: (renter: any) => void
}

export function RenterCard({ renter, onClick }: RenterCardProps) {
  const activeContract = renter.contracts?.find(
    (c: any) => c.status === 'ACTIVE'
  )
  const hasActiveContract = !!activeContract

  const handleCardClick = () => {
    onClick?.(renter)
  }

  return (
    <TouchCard onClick={handleCardClick}>
      <Card className={`${renterListMobileStyles.card} cursor-pointer`}>
        <CardContent className={renterListMobileStyles.cardContent}>
          <div className={renterListMobileStyles.cardHeader}>
            <div className={renterListMobileStyles.cardLeading}>
              <div className={renterListMobileStyles.cardHeaderInline}>
                <div className={renterListMobileStyles.cardAvatar}>
                  {renter.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className={renterListMobileStyles.cardTitle}>{renter.name}</h3>
                  <div className={renterListMobileStyles.cardPhone}>
                    <Phone className="mr-1 inline h-3 w-3" />
                    {renter.phone}
                  </div>
                </div>
              </div>
            </div>

            <Badge
              variant={hasActiveContract ? 'default' : 'secondary'}
              className={renterListMobileStyles.cardBadge}
            >
              {hasActiveContract ? '在租' : '空闲'}
            </Badge>
          </div>

          <div className={renterListMobileStyles.detailStack}>
            <div className={renterListMobileStyles.detailPairRow}>
              <span className={renterListMobileStyles.detailLabel}>当前房间</span>
              <span className={renterListMobileStyles.cardDetailValueTight}>
                {activeContract
                  ? `${activeContract.room.building.name} - ${activeContract.room.roomNumber}`
                  : '暂无在租房间'}
              </span>
            </div>

            <div className={renterListMobileStyles.detailRow}>
              <span className={renterListMobileStyles.detailLabel}>月租金</span>
              <span className={renterListMobileStyles.detailValue}>
                {activeContract ? `¥${activeContract.monthlyRent}` : '-'}
              </span>
            </div>

            {renter.moveInDate && (
              <div className={renterListMobileStyles.detailPairRow}>
                <span className={renterListMobileStyles.detailLabel}>入住日期</span>
                <span className={renterListMobileStyles.cardDetailValueTight}>
                  {formatDate(renter.moveInDate)}
                </span>
              </div>
            )}
          </div>

          <div className={renterListMobileStyles.footer}>
            <div className={renterListMobileStyles.footerRow}>
              <div className="flex min-w-0 items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className={renterListMobileStyles.footerMetaText}>
                  {renter.gender || '未设置性别'}
                </span>
              </div>
              <span className={renterListMobileStyles.footerMetaSubtle}>
                历史合同 {renter.contracts?.length || 0} 个
              </span>
            </div>

            {activeContract ? (
              <div className="mt-1 flex justify-end">
                <span className={renterListMobileStyles.footerHint}>
                  在租房间已关联
                </span>
              </div>
            ) : renter.contracts?.length > 0 ? (
              <div className="mt-1 flex justify-end">
                <span className={renterListMobileStyles.footerHint}>当前无活跃合同</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </TouchCard>
  )
}

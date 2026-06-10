import {
  IdCard,
} from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import type { RenterBasicInfoViewModel } from '@/components/business/renter-display'
import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RenterBasicInfoProps {
  renter: RenterBasicInfoViewModel
}

export function RenterBasicInfo({ renter }: RenterBasicInfoProps) {
  return (
    <Card className={renterDetailMobileStyles.card}>
      <CardHeader className={renterDetailMobileStyles.cardHeader}>
        <CardTitle className={renterDetailMobileStyles.cardTitle}>基本信息</CardTitle>
      </CardHeader>
      <CardContent className={renterDetailMobileStyles.cardContent}>
        {/* 基本信息 */}
        <div className={renterDetailMobileStyles.fieldsGrid}>
          <div className={renterDetailMobileStyles.fieldBlock}>
            <div className={renterDetailMobileStyles.fieldLabel}>姓名</div>
            <div className={renterDetailMobileStyles.fieldValueStrong}>
              {renter.name}
            </div>
          </div>

          {renter.gender && (
            <div className={renterDetailMobileStyles.fieldBlock}>
              <div className={renterDetailMobileStyles.fieldLabel}>性别</div>
              <div className={renterDetailMobileStyles.fieldValueStrong}>
                {renter.gender}
              </div>
            </div>
          )}

          <div className={renterDetailMobileStyles.fieldBlock}>
            <div className={renterDetailMobileStyles.fieldLabel}>手机号</div>
            <div className={renterDetailMobileStyles.fieldValueStrong}>
              {renter.phone}
            </div>
          </div>

          {renter.idCard && (
            <div className={renterDetailMobileStyles.fieldBlock}>
              <div className="flex items-center gap-1.5">
                <IdCard className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <div className={renterDetailMobileStyles.fieldLabel}>身份证号</div>
              </div>
              <div className={renterDetailMobileStyles.fieldValueMono}>
                {renter.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
              </div>
            </div>
          )}
        </div>

        {/* 联系信息 */}
        {(renter.emergencyContact || renter.emergencyPhone) && (
          <div className={renterDetailMobileStyles.sectionBlock}>
            <h4 className={renterDetailMobileStyles.sectionTitle}>紧急联系人</h4>
            <div className={renterDetailMobileStyles.fieldsGrid}>
              {renter.emergencyContact && (
                <div className={renterDetailMobileStyles.fieldBlock}>
                  <div className={renterDetailMobileStyles.fieldLabel}>联系人</div>
                  <div className={renterDetailMobileStyles.fieldValueStrong}>
                    {renter.emergencyContact}
                  </div>
                </div>
              )}

              {renter.emergencyPhone && (
                <div className={renterDetailMobileStyles.fieldBlock}>
                  <div className={renterDetailMobileStyles.fieldLabel}>联系电话</div>
                  <div className={renterDetailMobileStyles.fieldValueStrong}>
                    {renter.emergencyPhone}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 职业信息 */}
        {(renter.occupation || renter.company) && (
          <div className={renterDetailMobileStyles.sectionBlock}>
            <h4 className={renterDetailMobileStyles.sectionTitle}>职业信息</h4>
            <div className={renterDetailMobileStyles.fieldsGrid}>
              {renter.occupation && (
                <div className={renterDetailMobileStyles.fieldBlock}>
                  <div className={renterDetailMobileStyles.fieldLabel}>职业</div>
                  <div className={renterDetailMobileStyles.fieldValueStrong}>
                    {renter.occupation}
                  </div>
                </div>
              )}

              {renter.company && (
                <div className={renterDetailMobileStyles.fieldBlock}>
                  <div className={renterDetailMobileStyles.fieldLabel}>公司</div>
                  <div className={renterDetailMobileStyles.fieldValueStrong}>
                    {renter.company}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 入住信息 */}
        <div className={renterDetailMobileStyles.sectionBlock}>
          <h4 className={renterDetailMobileStyles.sectionTitle}>入住信息</h4>
          <div className={renterDetailMobileStyles.fieldsGrid}>
            {renter.moveInDate && (
              <div className={renterDetailMobileStyles.fieldBlock}>
                <div className={renterDetailMobileStyles.fieldLabel}>入住日期</div>
                <div className={renterDetailMobileStyles.fieldValueStrong}>
                  {formatDate(renter.moveInDate)}
                </div>
              </div>
            )}

            {renter.tenantCount && (
              <div className={renterDetailMobileStyles.fieldBlock}>
                <div className={renterDetailMobileStyles.fieldLabel}>入住人数</div>
                <div className={renterDetailMobileStyles.fieldValueStrong}>
                  {renter.tenantCount} 人
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 当前状态 */}
        <div className={renterDetailMobileStyles.sectionBlock}>
          <h4 className={renterDetailMobileStyles.sectionTitle}>当前状态</h4>
          <div className={renterDetailMobileStyles.statusCard}>
            <div className={renterDetailMobileStyles.statusHeader}>
              <Badge variant={renter.currentStatus.badgeVariant}>
                {renter.currentStatus.badgeLabel}
              </Badge>
              <div className={renterDetailMobileStyles.statusMeta}>
                <p className={renterDetailMobileStyles.statusTitle}>
                  {renter.currentStatus.title}
                </p>
                <p className={renterDetailMobileStyles.statusDescription}>
                  {renter.currentStatus.description}
                </p>
              </div>
            </div>

            {(renter.currentStatus.roomLabel ||
              renter.currentStatus.contractNumber ||
              renter.currentStatus.monthlyRent !== null) && (
              <div className={renterDetailMobileStyles.statusGrid}>
                {renter.currentStatus.roomLabel && (
                  <div className={renterDetailMobileStyles.statusField}>
                    <div className={renterDetailMobileStyles.fieldLabel}>当前房间</div>
                    <div className={renterDetailMobileStyles.statusFieldValue}>
                      {renter.currentStatus.roomLabel}
                    </div>
                  </div>
                )}

                {renter.currentStatus.monthlyRent !== null && (
                  <div className={renterDetailMobileStyles.statusField}>
                    <div className={renterDetailMobileStyles.fieldLabel}>当前月租</div>
                    <div className={renterDetailMobileStyles.statusFieldValue}>
                      {formatCurrency(renter.currentStatus.monthlyRent)}
                    </div>
                  </div>
                )}

                {(renter.currentStatus.contractNumber ||
                  renter.currentStatus.startDate ||
                  renter.currentStatus.endDate) && (
                  <div
                    className={`${renterDetailMobileStyles.statusField} ${renterDetailMobileStyles.statusFieldWide}`}
                  >
                    <div className={renterDetailMobileStyles.fieldLabel}>合同摘要</div>
                    <div className={renterDetailMobileStyles.statusFieldValue}>
                      {renter.currentStatus.contractNumber ?? '合同编号待补全'}
                      {(renter.currentStatus.startDate || renter.currentStatus.endDate) && (
                        <>
                          {' '}
                          | {renter.currentStatus.startDate
                            ? formatDate(renter.currentStatus.startDate)
                            : '-'}{' '}
                          -{' '}
                          {renter.currentStatus.endDate
                            ? formatDate(renter.currentStatus.endDate)
                            : '-'}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 备注 */}
        {renter.remarks && (
          <div className={renterDetailMobileStyles.sectionBlock}>
            <h4 className={renterDetailMobileStyles.sectionTitle}>备注</h4>
            <div className={renterDetailMobileStyles.noteBlock}>
              <p className={renterDetailMobileStyles.noteText}>{renter.remarks}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

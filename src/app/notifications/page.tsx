import { PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react'

/**
 * 通知页面
 * 显示系统通知和消息
 */
export default function NotificationsPage() {
  // 模拟通知数据
  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: '合同即将到期',
      message: '房间 A101 的租赁合同将在 3 天后到期，请及时处理续约事宜。',
      time: '2024-01-15 14:30',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: '收款成功',
      message: '租客张三已成功支付房间 B203 的租金 2800 元。',
      time: '2024-01-15 10:15',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: '系统维护通知',
      message: '系统将于今晚 23:00-01:00 进行维护升级，期间可能影响部分功能使用。',
      time: '2024-01-14 16:45',
      read: true
    },
    {
      id: 4,
      type: 'error',
      title: '逾期账单提醒',
      message: '房间 C305 的水电费账单已逾期 5 天，请尽快联系租客处理。',
      time: '2024-01-14 09:20',
      read: false
    },
    {
      id: 5,
      type: 'info',
      title: '新租客入住',
      message: '李四已成功入住房间 D401，合同编号：CT20240115001。',
      time: '2024-01-13 15:30',
      read: true
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <PageContainer 
      title="通知中心" 
      showBackButton
      actions={
        <Button size="sm" variant="outline">
          全部标记已读
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 通知统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              通知概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                <div className="text-sm text-gray-600">总通知</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                <div className="text-sm text-gray-600">未读通知</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'success').length}
                </div>
                <div className="text-sm text-gray-600">成功通知</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.type === 'error' || n.type === 'warning').length}
                </div>
                <div className="text-sm text-gray-600">警告通知</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知列表 */}
        <Card>
          <CardHeader>
            <CardTitle>最近通知</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors hover:shadow-sm ${
                  notification.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : getNotificationBgColor(notification.type)
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            新
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card>
          <CardHeader>
            <CardTitle>通知设置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">合同到期提醒</div>
                  <div className="text-xs text-gray-500">提前 3 天提醒合同到期</div>
                </div>
                <Button size="sm" variant="outline">
                  已开启
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">收款通知</div>
                  <div className="text-xs text-gray-500">收到租金时立即通知</div>
                </div>
                <Button size="sm" variant="outline">
                  已开启
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">逾期提醒</div>
                  <div className="text-xs text-gray-500">账单逾期时发送提醒</div>
                </div>
                <Button size="sm" variant="outline">
                  已开启
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
import { Calendar, Edit, Mail, MapPin, Phone, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'

/**
 * 用户资料页面
 * 显示用户的基本信息和账户设置
 */
export default function ProfilePage() {
  // 模拟用户数据
  const userInfo = {
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '138****8888',
    role: '管理员',
    joinDate: '2023-01-15',
    location: '北京市朝阳区',
    avatar: 'U',
    status: 'active',
  }

  return (
    <PageContainer
      title="个人资料"
      showBackButton
      actions={
        <Button size="sm" variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          编辑
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 用户基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 头像和基本信息 */}
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                <span className="text-xl font-bold text-white">
                  {userInfo.avatar}
                </span>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {userInfo.name}
                  </h3>
                  <Badge
                    variant={
                      userInfo.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {userInfo.status === 'active' ? '活跃' : '非活跃'}
                  </Badge>
                </div>
                <p className="text-gray-600">{userInfo.role}</p>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">邮箱</p>
                  <p className="text-gray-900">{userInfo.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">手机号</p>
                  <p className="text-gray-900">{userInfo.phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">加入时间</p>
                  <p className="text-gray-900">{userInfo.joinDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">所在地</p>
                  <p className="text-gray-900">{userInfo.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账户统计 */}
        <Card>
          <CardHeader>
            <CardTitle>账户统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">管理房源</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-600">活跃合同</div>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">3</div>
                <div className="text-sm text-gray-600">待处理账单</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">15</div>
                <div className="text-sm text-gray-600">总租客数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Button variant="outline" className="h-auto justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">修改密码</div>
                  <div className="text-sm text-gray-500">更新您的登录密码</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">通知设置</div>
                  <div className="text-sm text-gray-500">管理消息通知偏好</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">隐私设置</div>
                  <div className="text-sm text-gray-500">控制信息可见性</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">账户安全</div>
                  <div className="text-sm text-gray-500">查看登录记录</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

import { PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Calendar, MapPin, Edit } from 'lucide-react'

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
    status: 'active'
  }

  return (
    <PageContainer 
      title="个人资料" 
      showBackButton
      actions={
        <Button size="sm" variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          编辑
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 用户基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 头像和基本信息 */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">{userInfo.avatar}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold text-gray-900">{userInfo.name}</h3>
                  <Badge variant={userInfo.status === 'active' ? 'default' : 'secondary'}>
                    {userInfo.status === 'active' ? '活跃' : '非活跃'}
                  </Badge>
                </div>
                <p className="text-gray-600">{userInfo.role}</p>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">邮箱</p>
                  <p className="text-gray-900">{userInfo.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">手机号</p>
                  <p className="text-gray-900">{userInfo.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">加入时间</p>
                  <p className="text-gray-900">{userInfo.joinDate}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">管理房源</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-600">活跃合同</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">3</div>
                <div className="text-sm text-gray-600">待处理账单</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">修改密码</div>
                  <div className="text-sm text-gray-500">更新您的登录密码</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">通知设置</div>
                  <div className="text-sm text-gray-500">管理消息通知偏好</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">隐私设置</div>
                  <div className="text-sm text-gray-500">控制信息可见性</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
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
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Calendar,
  CreditCard,
  Edit,
  HelpCircle,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  User,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface UserProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 用户资料抽屉组件
 * 移动端：从左向右推出，占屏幕90%
 * 桌面端：从右向左推出，占屏幕25%
 */
export function UserProfileSheet({
  open,
  onOpenChange,
}: UserProfileSheetProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

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

  // 统计数据
  const userStats = [
    { label: '管理房源', value: '12', color: 'text-blue-600' },
    { label: '活跃合同', value: '8', color: 'text-green-600' },
    { label: '待处理账单', value: '3', color: 'text-orange-600' },
    { label: '总租客数', value: '15', color: 'text-purple-600' },
  ]

  // 快捷操作
  const quickActions = [
    {
      icon: Edit,
      label: '编辑资料',
      description: '修改个人信息',
      onClick: () => {
        onOpenChange(false)
        router.push('/profile')
      },
    },
    {
      icon: Settings,
      label: '系统设置',
      description: '应用配置和偏好',
      onClick: () => {
        onOpenChange(false)
        router.push('/settings')
      },
    },
    {
      icon: Bell,
      label: '通知设置',
      description: '管理消息通知',
      onClick: () => {
        onOpenChange(false)
        router.push('/notifications')
      },
    },
    {
      icon: Shield,
      label: '账户安全',
      description: '密码和安全设置',
      onClick: () => {
        console.log('账户安全')
      },
    },
    {
      icon: CreditCard,
      label: '账单管理',
      description: '查看账单和付款',
      onClick: () => {
        onOpenChange(false)
        router.push('/bills')
      },
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      description: '使用指南和支持',
      onClick: () => {
        console.log('帮助中心')
      },
    },
  ]

  const handleLogout = () => {
    console.log('用户登出')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'left' : 'right'}
        className={cn(
          'overflow-y-auto',
          // 移动端占90%宽度，桌面端占25%宽度
          isMobile
            ? 'w-[90vw] max-w-none'
            : 'w-[25vw] max-w-[400px] min-w-[320px]'
        )}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            个人中心
          </SheetTitle>
          <SheetDescription>管理您的个人信息和应用设置</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 用户基本信息 */}
          <div className="flex items-center space-x-4 rounded-lg bg-gray-50 p-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
              <span className="text-xl font-bold text-white">
                {userInfo.avatar}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-gray-900">
                  {userInfo.name}
                </h3>
                <Badge
                  variant={
                    userInfo.status === 'active' ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {userInfo.status === 'active' ? '活跃' : '非活跃'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{userInfo.role}</p>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">联系信息</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate text-gray-900">{userInfo.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-900">{userInfo.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-900">
                  加入于 {userInfo.joinDate}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate text-gray-900">
                  {userInfo.location}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 统计数据 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">数据概览</h4>
            <div className="grid grid-cols-2 gap-3">
              {userStats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-gray-50 p-3 text-center"
                >
                  <div className={`text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 快捷操作 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">快捷操作</h4>
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {action.label}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {action.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* 退出登录 */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

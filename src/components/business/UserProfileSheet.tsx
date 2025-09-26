'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Settings, 
  LogOut, 
  Edit,
  Bell,
  Shield,
  CreditCard,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 用户资料抽屉组件
 * 移动端：从左向右推出，占屏幕90%
 * 桌面端：从右向左推出，占屏幕25%
 */
export function UserProfileSheet({ open, onOpenChange }: UserProfileSheetProps) {
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
    status: 'active'
  }

  // 统计数据
  const userStats = [
    { label: '管理房源', value: '12', color: 'text-blue-600' },
    { label: '活跃合同', value: '8', color: 'text-green-600' },
    { label: '待处理账单', value: '3', color: 'text-orange-600' },
    { label: '总租客数', value: '15', color: 'text-purple-600' }
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
      }
    },
    {
      icon: Settings,
      label: '系统设置',
      description: '应用配置和偏好',
      onClick: () => {
        onOpenChange(false)
        router.push('/settings')
      }
    },
    {
      icon: Bell,
      label: '通知设置',
      description: '管理消息通知',
      onClick: () => {
        onOpenChange(false)
        router.push('/notifications')
      }
    },
    {
      icon: Shield,
      label: '账户安全',
      description: '密码和安全设置',
      onClick: () => {
        console.log('账户安全')
      }
    },
    {
      icon: CreditCard,
      label: '账单管理',
      description: '查看账单和付款',
      onClick: () => {
        onOpenChange(false)
        router.push('/bills')
      }
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      description: '使用指南和支持',
      onClick: () => {
        console.log('帮助中心')
      }
    }
  ]

  const handleLogout = () => {
    console.log('用户登出')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "left" : "right"}
        className={cn(
          "overflow-y-auto",
          // 移动端占90%宽度，桌面端占25%宽度
          isMobile 
            ? "w-[90vw] max-w-none" 
            : "w-[25vw] min-w-[320px] max-w-[400px]"
        )}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            个人中心
          </SheetTitle>
          <SheetDescription>
            管理您的个人信息和应用设置
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* 用户基本信息 */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">{userInfo.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{userInfo.name}</h3>
                <Badge variant={userInfo.status === 'active' ? 'default' : 'secondary'} className="text-xs">
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
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900 truncate">{userInfo.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900">{userInfo.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900">加入于 {userInfo.joinDate}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900 truncate">{userInfo.location}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 统计数据 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">数据概览</h4>
            <div className="grid grid-cols-2 gap-3">
              {userStats.map((stat, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {stat.label}
                  </div>
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
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <IconComponent className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{action.label}</div>
                      <div className="text-xs text-gray-500 truncate">{action.description}</div>
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
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
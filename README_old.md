# Rento - 公寓管理系统

> 一个轻量化、移动端优先的公寓租赁管理系统，采用现代化技术栈构建

## 📱 项目概述

Rento 是一个专为公寓管理设计的现代化系统，遵循"小步快跑"的开发理念，从个人自用逐步发展到多用户平台。系统采用移动端优先的设计策略，提供直观的用户界面和高效的管理功能。

### 🎯 核心特性

- **移动端优先**: 响应式设计，完美适配各种屏幕尺寸
- **轻量化架构**: 基于 Next.js 14 的全栈解决方案
- **本地存储优先**: SQLite 数据库，支持后期云端同步
- **现代化 UI**: 基于 shadcn/ui 的美观组件库
- **PWA 支持**: 离线使用和本地安装能力

## 🏗️ 技术架构

### 全栈架构说明
Rento 采用 **Next.js 14 全栈架构**，这意味着：
- **前端和后端代码在同一个项目中**：使用 Next.js App Router 处理页面路由
- **API 路由集成**：通过 `app/api/` 目录提供后端 API 接口
- **服务端渲染 (SSR)**：支持服务端组件和客户端组件混合使用
- **统一部署**：前后端作为一个整体进行部署

这种架构的优势：
- ✅ **开发效率高**：无需维护两套独立的代码库
- ✅ **类型安全**：前后端共享 TypeScript 类型定义
- ✅ **部署简单**：单一应用包，降低运维复杂度
- ✅ **性能优异**：减少网络请求，提升用户体验

### 技术栈详情
#### 前端层 (Client-Side)
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件库**: shadcn/ui
- **图标**: Lucide React
- **状态管理**: Zustand (轻量级)

#### 后端层 (Server-Side)
- **API 路由**: Next.js API Routes (`app/api/`)
- **服务端组件**: React Server Components
- **数据库**: SQLite (开发阶段) → PostgreSQL (生产环境)
- **ORM**: Prisma
- **认证**: NextAuth.js (后期集成)

### 开发工具
- **构建工具**: Vite (通过 Next.js)
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript
- **包管理**: npm/pnpm

## 📋 功能模块

### 1. 主页面 (Dashboard)
- 待收/待付金额统计
- 快速操作入口
- 数据概览卡片
- 提醒和通知

### 2. 账单管理 (Bills)
- 账单列表展示
- 账单详情查看
- 收支统计分析
- 逾期提醒功能

### 3. 房间管理 (Rooms)
- 房间信息管理
- 房间状态跟踪
- 房间详情展示
- 空房快查功能

### 4. 合同管理 (Contracts)
- 合同信息录入
- 合同状态管理
- 到期提醒功能
- 合同详情查看

### 5. 添加功能 (Add)
- 添加房间信息
- 添加租客信息
- 创建新账单
- 快速录入界面

## 🎨 UI 设计规范

### 设计原则
- **移动端优先**: 所有界面首先为移动端设计
- **卡片式布局**: 清晰的信息层次和视觉分组
- **触摸友好**: 大按钮和易点击的交互元素
- **一致性**: 统一的色彩系统和交互模式

### 色彩系统
- **主色调**: 蓝色系 (#3B82F6)
- **辅助色**: 橙色 (#F97316)、绿色 (#10B981)
- **状态色**: 红色 (#EF4444) 用于警告和逾期提醒
- **中性色**: 灰色系用于文本和背景

### 响应式断点
```css
/* Tailwind CSS 断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

## 🗄️ 数据模型

### 核心实体关系
```
Room (房间)
├── id: string
├── roomNumber: string
├── floor: number
├── area: number
├── rent: number
└── status: 'vacant' | 'occupied' | 'maintenance'

Renter (租客)
├── id: string
├── name: string
├── phone: string
├── idCard: string
└── emergencyContact: string

Contract (合同)
├── id: string
├── roomId: string (外键)
├── renterId: string (外键)
├── startDate: Date
├── endDate: Date
├── monthlyRent: number
├── deposit: number
└── status: 'active' | 'expired' | 'terminated'

Bill (账单)
├── id: string
├── contractId: string (外键)
├── type: 'rent' | 'utilities' | 'maintenance' | 'other'
├── amount: number
├── dueDate: Date
├── paidDate?: Date
├── status: 'pending' | 'paid' | 'overdue'
└── description: string
```

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 pnpm 包管理器
- Git 版本控制

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd Rento
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **环境配置**
```bash
cp .env.example .env.local
# 编辑 .env.local 文件，配置必要的环境变量
```

4. **数据库初始化**
```bash
npx prisma generate
npx prisma db push
```

5. **启动开发服务器**
```bash
# 使用默认端口 3000 (如果未被占用)
npm run dev

# 或指定端口 3001 (推荐，避免与 podman 冲突)
npm run dev -- --port 3001

# 或使用 pnpm
pnpm dev --port 3001
```

6. **访问应用**
```bash
# 如果使用默认端口
http://localhost:3000

# 如果使用自定义端口 3001 (推荐)
http://localhost:3001
```

## 📁 项目结构

```
Rento/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # 仪表板路由组
│   ├── bills/             # 账单管理页面
│   ├── rooms/             # 房间管理页面
│   ├── contracts/         # 合同管理页面
│   ├── add/               # 添加功能页面
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   └── layout.tsx         # 根布局
├── components/            # 可复用组件
│   ├── ui/                # shadcn/ui 组件
│   ├── forms/             # 表单组件
│   ├── charts/            # 图表组件
│   └── layout/            # 布局组件
├── lib/                   # 工具函数和配置
│   ├── db.ts              # 数据库连接
│   ├── utils.ts           # 通用工具函数
│   └── validations.ts     # 数据验证模式
├── prisma/                # 数据库模式和迁移
│   ├── schema.prisma      # 数据库模式定义
│   └── migrations/        # 数据库迁移文件
├── public/                # 静态资源
├── types/                 # TypeScript 类型定义
└── docs/                  # 项目文档和UI示例
```

## 🔧 开发规范

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件采用函数式组件 + Hooks
- 使用 Tailwind CSS 进行样式开发

### 提交规范
```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 分支策略
- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

## 📈 开发路线图

### 第一阶段 (MVP - 4周)
- [x] 项目初始化和基础架构
- [ ] 主页面和导航系统
- [ ] 房间管理基础功能
- [ ] 账单管理基础功能
- [ ] 响应式布局实现

### 第二阶段 (功能完善 - 6周)
- [ ] 租客管理系统
- [ ] 合同管理功能
- [ ] 数据统计和图表
- [ ] 搜索和筛选功能
- [ ] PWA 功能集成

### 第三阶段 (多用户支持 - 8周)
- [ ] 用户认证系统
- [ ] 权限管理
- [ ] 多租户架构
- [ ] 云端数据同步
- [ ] 高级报表功能

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目链接: [https://github.com/yourusername/Rento](https://github.com/yourusername/Rento)

---

**注意**: 本项目目前处于开发阶段，功能和API可能会发生变化。建议在生产环境使用前进行充分测试。
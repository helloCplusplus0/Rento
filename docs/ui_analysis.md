# Rento UI分析文档

> 基于提供的UI截图提取的核心设计信息，专注于req.md中定义的核心功能

## 📱 核心功能模块分析

### 1. 主页面 (main.jpg) - 核心需求
根据 `req.md` 要求的 "一个main主页"：

#### 必需功能模块
- **账单管理** (bill_list) - 对应UI中的"账单"功能
- **房源管理** (room_list) - 对应UI中的房源相关功能  
- **添加功能** (add按钮) - 对应UI中的"+"添加入口
- **合同管理** (contract_list) - 对应UI中的"合同"功能

#### 暂不实现的功能 (UI中存在但req.md未提及)
- ❌ 数据分析
- ❌ 设备管理  
- ❌ 我的钱包
- ❌ 线上推广
- ❌ 巡房
- ❌ 新房线索/新客线索

### 2. 财务统计面板
```typescript
// 主页顶部统计 - 简化版本
interface DashboardStats {
  pendingReceivables: number    // 待收逾期金额
  pendingPayables: number       // 待付逾期金额
  todayStats: {
    receivables: number         // 今日收款笔数
    payables: number           // 今日付款笔数
  }
  monthlyStats: {
    receivables: number         // 30日内收款笔数  
    payables: number           // 30日内付款笔数
  }
}
```

## 🏠 房间管理 (room_list.jpg)

### 房源层级结构
```typescript
// 楼栋管理 - 核心结构
interface Building {
  id: string
  name: string              // 平安寓6688_A栋
  totalRooms: number        // 共6套
  floors: Floor[]
}

interface Floor {
  floorNumber: number       // 1层, 2层, 3层
  rooms: Room[]
}

interface Room {
  id: string
  roomNumber: string        // 101, 201, 302
  buildingId: string
  floorNumber: number
  
  // 房间基本信息
  roomType: 'shared' | 'whole' | 'single'  // 合租/整租/单间
  rent: number             // 租金
  area?: number            // 面积 (可选)
  
  // 房间状态 - 重要
  status: 'vacant' | 'occupied' | 'overdue' | 'maintenance'
  statusColor: 'green' | 'blue' | 'red' | 'gray'
  
  // 租客信息
  currentRenter?: string    // 当前租客姓名
  overdueDays?: number     // 逾期天数
}
```

### 房间状态可视化
- 🟢 **绿色**: 空房可租
- 🔵 **蓝色**: 在租中
- 🔴 **红色**: 逾期/有问题
- ⚪ **灰色**: 维护中

## 💰 账单管理 (bill_list.jpg, bill_content.jpg)

### 账单核心数据结构
```typescript
interface Bill {
  id: string
  billNumber: string        // 账单编号
  
  // 基本信息
  type: 'rent' | 'deposit' | 'utilities' | 'other'
  amount: number           // 应收金额
  receivedAmount: number   // 已收金额
  pendingAmount: number    // 待收金额
  
  // 时间信息
  dueDate: Date           // 应付日期
  paidDate?: Date         // 实际支付日期
  period: string          // 账期 (如: 2023-03-20 至 2023-09-19)
  
  // 状态管理
  status: 'pending' | 'paid' | 'overdue' | 'completed'
  
  // 关联信息
  renterName: string      // 租客姓名
  roomNumber: string      // 房间号
  contractId: string      // 关联合同ID
  
  // 支付信息
  paymentMethod?: string  // 收款方式 (微信/支付宝/银行转账)
  operator?: string       // 经办人
  remarks?: string        // 备注
}
```

### 账单汇总统计
```typescript
interface BillSummary {
  totalAmount: number      // 总金额
  paidAmount: number       // 已收金额  
  pendingAmount: number    // 待收金额
  dateRange: {
    start: Date           // 统计开始日期
    end: Date            // 统计结束日期
  }
}
```

## 📋 合同管理 (contract_content.jpg, contract_list.jpg)

### 合同核心信息
```typescript
interface Contract {
  id: string
  contractNumber: string   // 合同编号
  
  // 关联信息
  roomId: string          // 房间ID
  renterId: string        // 租客ID
  roomNumber: string      // 房间号 (如: B302-平安寓6688_B栋302)
  renterName: string      // 租客姓名
  
  // 合同期限
  startDate: Date         // 开始日期
  endDate: Date          // 结束日期
  isExtended: boolean    // 是否延期
  
  // 租金信息
  monthlyRent: number    // 月租金
  totalRent: number      // 总租金
  deposit: number        // 押金
  keyDeposit?: number    // 门卡押金
  cleaningFee?: number   // 保洁费
  
  // 合同状态
  status: 'active' | 'expired' | 'terminated' | 'pending'
  businessStatus: string  // 业务状态 (在租中/已到期等)
  
  // 付款方式
  paymentMethod: string   // 付款方式描述
  paymentTiming: string   // 收租时间规则
  
  // 签约信息
  signedBy: string       // 签约人
  signedDate: Date       // 签约时间
  
  // 到期提醒
  daysToExpiry?: number  // 距离到期天数 (负数表示已到期)
  isOverdue: boolean     // 是否逾期
}
```

## 👤 租客管理 (add_renter.jpg)

### 租客信息结构
```typescript
interface Renter {
  id: string
  
  // 基本信息
  name: string           // 姓名
  gender: string         // 性别
  phone: string          // 手机号
  idCard: string         // 身份证号
  
  // 联系信息
  emergencyContact: string     // 紧急联系人
  emergencyPhone: string       // 紧急联系人电话
  
  // 职业信息
  occupation?: string          // 职业
  company?: string            // 公司名称
  
  // 入住信息
  moveInDate?: Date           // 入住日期
  tenantCount?: number        // 入住人数
  
  // 其他信息
  remarks?: string            // 备注
}
```

## 🎨 UI设计规范

### 色彩系统 (基于UI截图)
```css
/* 状态色彩 */
--color-success: #10B981;      /* 绿色 - 正常状态 */
--color-primary: #3B82F6;      /* 蓝色 - 主要操作 */
--color-warning: #F59E0B;      /* 橙色 - 警告 */
--color-danger: #EF4444;       /* 红色 - 错误/逾期 */
--color-info: #06B6D4;         /* 青色 - 信息提示 */

/* 中性色 */
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-500: #6B7280;
--color-gray-900: #111827;
```

### 组件设计原则
1. **卡片式布局**: 所有信息模块使用卡片容器
2. **状态标识**: 使用颜色和图标明确表示状态
3. **触摸友好**: 按钮最小44px，适合移动端操作
4. **信息层次**: 重要信息突出显示，次要信息弱化

### 响应式断点
```css
/* 移动端优先 */
xs: 475px    /* 超小屏 */
sm: 640px    /* 小屏 */
md: 768px    /* 中屏 */
lg: 1024px   /* 大屏 */
```

## 📊 数据关系图

```
Building (楼栋)
├── Floor (楼层)
    └── Room (房间)
        └── Contract (合同)
            ├── Renter (租客)
            └── Bill (账单)
```

## 🔄 核心业务流程

### 1. 房源管理流程
```
添加楼栋 → 添加楼层 → 添加房间 → 设置房间状态
```

### 2. 租赁流程
```
房间空置 → 添加租客 → 签订合同 → 生成账单 → 收款管理
```

### 3. 账单流程
```
合同生效 → 自动生成账单 → 发送提醒 → 收款确认 → 状态更新
```

## 📝 开发优先级

### 第一优先级 (MVP核心功能)
1. ✅ 房间管理 (增删改查)
2. ✅ 租客管理 (基本信息)
3. ✅ 合同管理 (签约/状态)
4. ✅ 账单管理 (生成/收款)
5. ✅ 主页统计 (简化版)

### 第二优先级 (功能完善)
1. 🔄 高级搜索和筛选
2. 🔄 数据导出功能
3. 🔄 提醒通知系统
4. 🔄 报表统计

### 暂不实现
- ❌ 线索管理
- ❌ 设备管理
- ❌ 钱包功能
- ❌ 推广功能
- ❌ 复杂数据分析

---

**文档版本**: v1.0  
**创建时间**: 2024年1月  
**基于UI截图**: 两批共8张UI界面截图  
**对应需求**: req.md 核心功能需求
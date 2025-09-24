# Rento 系统设计分析与最佳实践

## 📋 问题分析概述

**分析时间**: 2024年1月  
**分析范围**: 水电单价冲突、房间状态同步、账单计算一致性  
**分析目标**: 制定系统设计的最佳实践，解决数据一致性问题  

## 🚨 发现的核心问题

### 1. 水电单价冲突问题 ❌

#### **问题描述**
系统中存在两套单价体系，导致计费逻辑混乱：

**全局设置单价**:
```typescript
// src/hooks/useSettings.ts
const defaultSettings: AppSettings = {
  electricityPrice: 0.6,  // 全局电费单价
  waterPrice: 3.5,        // 全局水费单价
}
```

**仪表单价**:
```sql
-- prisma/schema.prisma
model Meter {
  unitPrice: Decimal @default(0) // 仪表单价
}

-- 数据库实际数据
电表: unitPrice = 1 元/度
水表: unitPrice = 10 元/吨
```

#### **冲突表现**
- 批量抄表时使用全局设置单价 (0.6元/度, 3.5元/吨)
- 仪表配置中设置了不同单价 (1元/度, 10元/吨)
- 账单计算结果不一致，用户困惑

#### **业务影响**
- 账单金额计算错误
- 财务数据不准确
- 用户体验混乱

### 2. 房间状态同步问题 ❌

#### **问题描述**
房间状态更新后，不同界面显示不同步：

**状态更新流程**:
```typescript
// 房间详情页状态更新
const handleStatusChange = async (status: RoomStatus) => {
  const response = await fetch(`/api/rooms/${room.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
  
  if (response.ok) {
    router.refresh() // 仅刷新当前页面
  }
}
```

#### **同步问题**
- 房间详情页状态已更新
- 房间列表卡片状态未同步
- 需要手动刷新或重新进入页面才能看到变化

#### **根本原因**
- 缺乏全局状态管理
- 各组件使用独立的数据源
- 没有实时数据同步机制

### 3. 账单计算一致性问题 ❌

#### **问题描述**
账单明细与总金额计算不一致：

**当前计算逻辑**:
```typescript
// 批量抄表使用全局设置
const billData = {
  electricityUsage: usage,
  // 使用全局设置: 0.6元/度, 3.5元/吨
}

// 但仪表实际配置: 1元/度, 10元/吨
```

#### **不一致表现**
- 抄表记录显示: 50吨 × 3.5元/吨 = 175元
- 仪表配置显示: 50吨 × 10元/吨 = 500元
- 用户看到两个不同的金额

## ✅ 最佳实践解决方案

### 1. 统一定价策略 🎯

#### **推荐方案**: 仪表单价优先 + 全局默认值

**设计原则**:
- **仪表单价为准**: 实际计费以仪表配置的单价为准
- **全局设置作为默认值**: 新增仪表时自动填充全局单价
- **支持个性化定价**: 允许特殊房间设置不同单价

**实现方案**:
```typescript
// 1. 修改计费逻辑，优先使用仪表单价
export function calculateUtilityBill(
  electricityUsage: number,
  waterUsage: number,
  gasUsage: number = 0,
  meterPrices?: {
    electricityPrice?: number  // 来自仪表配置
    waterPrice?: number       // 来自仪表配置
    gasPrice?: number
  }
): UtilityBillResult {
  // 优先使用仪表单价，回退到全局设置
  const electricityPrice = meterPrices?.electricityPrice ?? getSettings().electricityPrice
  const waterPrice = meterPrices?.waterPrice ?? getSettings().waterPrice
  const gasPrice = meterPrices?.gasPrice ?? 2.5
  
  // ... 计算逻辑
}

// 2. 批量抄表时传入仪表单价
const billData = {
  electricityUsage: usage,
  waterUsage: usage,
  meterPrices: {
    electricityPrice: Number(meter.unitPrice), // 使用仪表单价
    waterPrice: Number(meter.unitPrice)
  }
}
```

**业务流程**:
1. **新增仪表**: 自动填充全局设置的单价，允许修改
2. **批量抄表**: 使用各仪表配置的单价进行计算
3. **全局设置**: 仅作为新增仪表的默认值和系统参考

### 2. 房间状态实时同步 🎯

#### **推荐方案**: 客户端状态管理 + 乐观更新

**设计原则**:
- **统一数据源**: 使用全局状态管理
- **乐观更新**: 立即更新UI，后台同步数据
- **错误回滚**: 同步失败时回滚状态

**实现方案**:
```typescript
// 1. 全局状态管理 (使用 Zustand 或 Context)
interface RoomStore {
  rooms: RoomWithBuildingForClient[]
  updateRoomStatus: (roomId: string, status: RoomStatus) => Promise<void>
}

const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  
  updateRoomStatus: async (roomId: string, status: RoomStatus) => {
    // 乐观更新
    const oldRooms = get().rooms
    set(state => ({
      rooms: state.rooms.map(room => 
        room.id === roomId ? { ...room, status } : room
      )
    }))
    
    try {
      // 后台同步
      const response = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        throw new Error('Update failed')
      }
    } catch (error) {
      // 回滚状态
      set({ rooms: oldRooms })
      throw error
    }
  }
}))

// 2. 组件中使用统一状态
export function RoomStatusManagement({ room, onStatusChange }: Props) {
  const { updateRoomStatus } = useRoomStore()
  
  const handleStatusChange = async (status: RoomStatus) => {
    try {
      await updateRoomStatus(room.id, status)
      onStatusChange?.(status) // 通知父组件
    } catch (error) {
      // 显示错误提示
    }
  }
}
```

**状态管理策略**:
- **手动更新为主**: 保持当前的手动状态管理设计
- **实时同步**: 确保所有界面立即反映状态变化
- **用户控制**: 用户明确知道何时进行状态变更

### 3. 账单计算一致性 🎯

#### **推荐方案**: 统一计费引擎 + 数据溯源

**设计原则**:
- **单一计费逻辑**: 所有账单计算使用统一函数
- **数据溯源**: 记录计费依据和参数
- **透明展示**: 向用户清晰展示计费明细

**实现方案**:
```typescript
// 1. 统一计费引擎
export interface BillingContext {
  meterId: string
  meterType: MeterType
  usage: number
  unitPrice: number  // 来源明确的单价
  priceSource: 'METER_CONFIG' | 'GLOBAL_SETTING' | 'CUSTOM' // 价格来源
}

export function calculateBill(context: BillingContext): BillCalculationResult {
  const amount = context.usage * context.unitPrice
  
  return {
    usage: context.usage,
    unitPrice: context.unitPrice,
    amount,
    priceSource: context.priceSource,
    calculationTime: new Date(),
    meterId: context.meterId
  }
}

// 2. 批量抄表时获取仪表单价
const meter = await meterQueries.findById(readingData.meterId)
const billingContext: BillingContext = {
  meterId: meter.id,
  meterType: meter.meterType,
  usage,
  unitPrice: Number(meter.unitPrice),
  priceSource: 'METER_CONFIG'
}

const billResult = calculateBill(billingContext)

// 3. 账单元数据记录计费依据
const utilityBill = await prisma.bill.create({
  data: {
    // ... 其他字段
    metadata: JSON.stringify({
      calculationBasis: {
        unitPrice: billResult.unitPrice,
        priceSource: billResult.priceSource,
        meterId: billResult.meterId,
        calculationTime: billResult.calculationTime
      }
    })
  }
})
```

## 🏗️ 系统架构改进建议

### 1. 数据层统一

```typescript
// 统一的数据访问层
export class MeterService {
  // 获取仪表单价（含回退逻辑）
  static async getEffectivePrice(meterId: string): Promise<number> {
    const meter = await meterQueries.findById(meterId)
    
    // 优先使用仪表单价
    if (meter.unitPrice > 0) {
      return Number(meter.unitPrice)
    }
    
    // 回退到全局设置
    const settings = getSettings()
    switch (meter.meterType) {
      case 'ELECTRICITY': return settings.electricityPrice
      case 'COLD_WATER':
      case 'HOT_WATER': return settings.waterPrice
      default: return 0
    }
  }
}
```

### 2. 状态管理层

```typescript
// 全局状态管理
export interface AppState {
  rooms: RoomWithBuildingForClient[]
  settings: AppSettings
  bills: BillWithContract[]
}

// 状态同步中间件
export const syncMiddleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // 状态变更后同步到服务端
  if (action.type.endsWith('_SUCCESS')) {
    syncToServer(action.payload)
  }
  
  return result
}
```

### 3. 业务逻辑层

```typescript
// 统一的业务规则
export class BillingRules {
  // 定价规则
  static getPricingStrategy(): 'METER_FIRST' | 'GLOBAL_FIRST' {
    return 'METER_FIRST' // 仪表单价优先
  }
  
  // 状态变更规则
  static canChangeStatus(from: RoomStatus, to: RoomStatus): boolean {
    const transitions = {
      'VACANT': ['OCCUPIED', 'MAINTENANCE'],
      'OCCUPIED': ['VACANT', 'OVERDUE', 'MAINTENANCE'],
      'OVERDUE': ['OCCUPIED', 'VACANT'],
      'MAINTENANCE': ['VACANT']
    }
    
    return transitions[from]?.includes(to) ?? false
  }
}
```

## 📊 实施优先级

| 问题 | 优先级 | 实施难度 | 业务影响 | 建议方案 |
|------|--------|----------|----------|----------|
| **水电单价冲突** | 🔴 高 | 中等 | 高 | 仪表单价优先策略 |
| **状态同步问题** | 🟡 中 | 高 | 中 | 全局状态管理 |
| **账单计算一致性** | 🔴 高 | 低 | 高 | 统一计费引擎 |

## 🎯 实施建议

### 阶段一: 紧急修复 (1-2天)
1. **修复账单计算**: 使用仪表单价进行计费
2. **统一计费逻辑**: 确保所有计算使用相同的价格来源

### 阶段二: 架构优化 (3-5天)
1. **实现全局状态管理**: 解决状态同步问题
2. **完善数据溯源**: 记录计费依据和变更历史

### 阶段三: 用户体验优化 (1-2天)
1. **优化界面提示**: 清晰显示价格来源和计算依据
2. **完善错误处理**: 提供友好的错误提示和恢复机制

## 📝 最佳实践总结

### 1. 定价策略
- ✅ **仪表单价优先**: 实际计费以仪表配置为准
- ✅ **全局设置作为默认**: 新增时自动填充，支持修改
- ✅ **透明计费**: 清晰显示价格来源和计算过程

### 2. 状态管理
- ✅ **统一数据源**: 使用全局状态管理
- ✅ **乐观更新**: 立即更新UI，提升用户体验
- ✅ **错误处理**: 失败时回滚状态，显示错误信息

### 3. 数据一致性
- ✅ **单一数据源**: 避免多套数据体系
- ✅ **实时同步**: 确保所有界面数据一致
- ✅ **数据溯源**: 记录变更历史和计算依据

---

**结论**: 通过实施上述最佳实践，可以彻底解决系统中的数据一致性问题，提升用户体验和系统可靠性。建议优先解决账单计算一致性问题，然后逐步完善状态管理和用户体验。